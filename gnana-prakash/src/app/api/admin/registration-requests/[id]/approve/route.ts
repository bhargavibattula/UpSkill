import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth/getAuthToken";
import connectDB from "@/lib/db/mongoose";
import { RegistrationRequest } from "@/models/RegistrationRequest";
import User from "@/models/User";
import { AuditLogger } from "@/lib/audit/AuditLogger";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req);
    const session = token ? { user: token } : null;
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const request = await RegistrationRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: `Request is already ${request.status}` }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: request.email });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Approve the request
    request.status = "APPROVED";
    request.reviewedAt = new Date();
    request.reviewedBy = (session.user as any).id;
    await request.save();

    // Create the active user
    const employeeId = `EMP-${Date.now().toString().slice(-6)}`;
    const newUser = new User({
      name: request.fullName,
      email: request.email,
      mobile: request.mobileNumber,
      role: request.requestedRole,
      password: request.passwordHash, // We've already hashed it
      employeeId,
      isActive: true,
    });
    // Mongoose pre-save middleware might try to hash the password again if we used user.save()
    // Wait, the User schema has a pre-save hook that hashes the password if it is modified.
    // Let's use create with already hashed password, or we can just not hash it in RegistrationRequest and hash it here.
    // Since we hashed it in RegistrationRequest, User schema's pre('save') hook will hash the hash!
    // To prevent this, we should either insert directly or update the pre-save hook.
    // Instead of using `new User()`, let's just insert directly using User.collection.insertOne to bypass the pre-save hook.
    // Or we can just let it hash if we hadn't hashed it before.
    // Wait, in POST /api/auth/register we did `bcrypt.hash(password, salt)`.
    // Let's use User.collection.insertOne
    const result = await User.collection.insertOne({
      name: request.fullName,
      email: request.email,
      mobile: request.mobileNumber,
      role: request.requestedRole,
      password: request.passwordHash,
      employeeId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await AuditLogger.log({
      userId: session.user.sub || (session.user as any).id,
      userName: session.user.name || session.user.email || "",
      role: (session.user as any).role,
      action: "REGISTRATION_APPROVED",
      module: "Registration",
      description: `Approved registration request for ${request.email}`,
      entityId: request._id.toString(),
      entityType: "RegistrationRequest",
      newValues: { createdUserId: result.insertedId.toString() },
      req
    });

    return NextResponse.json({ success: true, message: "Registration approved successfully." });
  } catch (error: any) {
    console.error("PUT /approve error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
