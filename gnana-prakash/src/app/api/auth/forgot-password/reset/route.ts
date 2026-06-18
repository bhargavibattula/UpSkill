import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP, and new password are required." }, { status: 400 });
    }

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    ) {
      return NextResponse.json({ error: "Password does not meet complexity requirements." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select("+password");
    if (!user) {
      return NextResponse.json({ error: "User not found or invalid request." }, { status: 404 });
    }

    // Verify OTP
    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return NextResponse.json({ error: "No OTP request found for this email." }, { status: 400 });
    }

    if (user.resetPasswordOTP !== otp) {
      return NextResponse.json({ error: "Invalid verification code (OTP)." }, { status: 400 });
    }

    if (new Date() > user.resetPasswordOTPExpires) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    // Reset password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully." 
    });
  } catch (err: any) {
    console.error("Forgot password reset error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
