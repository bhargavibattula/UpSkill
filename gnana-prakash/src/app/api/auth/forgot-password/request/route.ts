import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import User from "@/models/User";
import { sendOTPMail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    
    if (!user) {
      // Return a generic message to prevent email enumeration
      return NextResponse.json({ 
        success: true, 
        message: "If the email is registered, you will receive a verification code shortly." 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiration (10 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email
    const mailSent = await sendOTPMail(user.email, otp);
    if (!mailSent) {
      return NextResponse.json({ error: "Failed to send verification email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "If the email is registered, you will receive a verification code shortly." 
    });
  } catch (err: any) {
    console.error("Forgot password request error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
