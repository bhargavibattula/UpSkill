import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { RegistrationRequest } from "@/models/RegistrationRequest";
import { AuditLogger } from "@/lib/audit/AuditLogger";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, mobile, role, password } = await req.json();

    if (!name || !email || !mobile || !role || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter." }, { status: 400 });
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one lowercase letter." }, { status: 400 });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one special character." }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 400 });
    }

    // Also check if they already have a pending registration
    const existingRequest = await RegistrationRequest.findOne({ email: email.toLowerCase(), status: "PENDING" });
    if (existingRequest) {
      return NextResponse.json({ error: "A registration request is already pending for this email." }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newRequest = new RegistrationRequest({
      fullName: name,
      email,
      mobileNumber: mobile,
      requestedRole: role,
      passwordHash,
      status: "PENDING",
    });

    await newRequest.save();

    await AuditLogger.log({
      userId: "REGISTRATION",
      userName: name,
      role: role,
      action: "REGISTRATION_REQUEST_SUBMITTED",
      module: "Registration",
      description: `Registration request submitted by ${name} (${email}) requesting role ${role}`,
      entityId: newRequest._id.toString(),
      entityType: "RegistrationRequest",
      newValues: { fullName: name, email, mobileNumber: mobile, requestedRole: role, status: "PENDING" },
      req
    });

    return NextResponse.json({ success: true, message: "Registration successful. Pending admin approval." }, { status: 201 });

  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "An error occurred during registration." }, { status: 500 });
  }
}
