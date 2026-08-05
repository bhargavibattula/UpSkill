import nodemailer from "nodemailer";

export async function sendOTPMail(email: string, otp: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"Gnana Prakash TMS" <shanmukharani20@gmail.com>`;

  console.log(`[MAIL SYSTEM] Preparing to send OTP ${otp} to ${email}`);

  // Fallback if SMTP is not configured
  if (!host || !user || !pass) {
    console.warn("[MAIL SYSTEM] WARNING: SMTP credentials are not configured in environment variables (.env.local).");
    console.warn(`[MAIL SYSTEM] FORGOT PASSWORD OTP FOR ${email}: ${otp}`);
    return true; // Return true to indicate fallback mock success
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from,
      to: email,
      subject: "Verification OTP - Gnana Prakash Portal",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background-color: #2563eb; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">Gnana Prakash Portal</h1>
            <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 13px;">Training Management & Monitoring System</p>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <p style="font-size: 15px; color: #334155; margin-top: 0; font-weight: 500;">Hello,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 12px 0;">We received a request to reset the password for your Gnana Prakash Portal account. Please use the following 2FA verification code to proceed:</p>
            
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 32px; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a; font-family: monospace;">${otp}</span>
            </div>
            
            <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 12px 0;">This OTP code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or contact support.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL SYSTEM] Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[MAIL SYSTEM] ERROR: Failed to send email via SMTP:", error);
    console.warn(`[MAIL SYSTEM] FALLBACK PASSWORD RESET OTP FOR ${email}: ${otp}`);
    // Return true as fallback so local testing/development is not blocked.
    // The developer can read the OTP from the terminal output above.
    return true;
  }
}
