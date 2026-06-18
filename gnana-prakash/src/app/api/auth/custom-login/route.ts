import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { RegistrationRequest } from "@/models/RegistrationRequest";
import { AuditLogger } from "@/lib/audit/AuditLogger";

/**
 * Custom login endpoint that bypasses NextAuth's broken signIn() flow on Next.js 16.
 * 
 * This directly:
 * 1. Validates credentials against MongoDB
 * 2. Creates a JWT token using NextAuth's encode() (same format, 100% compatible)
 * 3. Sets the session cookie manually
 * 
 * The resulting cookie is identical to what NextAuth would set, so getSession(),
 * useSession(), and our custom decode()-based middleware all work correctly.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email, isActive: true }).select("+password");
    if (!user) {
      // User not found in active users, check RegistrationRequest
      const pendingRequest = await RegistrationRequest.findOne({ email: email.toLowerCase() }).sort({ submittedAt: -1 });
      
      if (pendingRequest) {
        if (pendingRequest.status === "PENDING") {
          return NextResponse.json(
            { error: "Your registration request is still pending approval." },
            { status: 401 }
          );
        }
        if (pendingRequest.status === "REJECTED") {
          return NextResponse.json(
            { error: "Your registration request has been rejected. Contact Super Admin." },
            { status: 401 }
          );
        }
      }

      await AuditLogger.log({
        userId: "UNKNOWN",
        userName: email,
        role: "UNKNOWN",
        action: "FAILED_LOGIN_ATTEMPT",
        module: "Authentication",
        description: `Failed login attempt for email: ${email} (User not found or inactive)`,
        req
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await AuditLogger.log({
        userId: user._id.toString(),
        userName: user.name,
        role: user.role,
        action: "FAILED_LOGIN_ATTEMPT",
        module: "Authentication",
        description: `Failed login attempt for user: ${user.name} (${email}) - Invalid password`,
        req
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Success login
    await AuditLogger.log({
      userId: user._id.toString(),
      userName: user.name,
      role: user.role,
      action: "LOGIN",
      module: "Authentication",
      description: `User ${user.name} logged in successfully`,
      req
    });

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const secret = process.env.NEXTAUTH_SECRET!;

    // Build JWT payload — same shape as NextAuth's jwt callback produces
    const tokenPayload = {
      sub: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      district: user.district?.toString(),
      mandal: user.mandal?.toString(),
      venue: user.venue?.toString(),
      avatar: user.avatar,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    // Determine cookie name based on environment
    const isSecure = process.env.NODE_ENV === "production" ||
      (process.env.NEXTAUTH_URL || "").startsWith("https");
    const cookieName = isSecure
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    // Encode JWT using NextAuth's encode — produces a token our decode() can read
    const token = await encode({
      token: tokenPayload,
      secret,
      salt: cookieName,
      maxAge: 24 * 60 * 60,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        district: user.district?.toString(),
        mandal: user.mandal?.toString(),
        venue: user.venue?.toString(),
        avatar: user.avatar,
      },
    });

    // Set the session cookie — identical to NextAuth's format
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("[custom-login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
