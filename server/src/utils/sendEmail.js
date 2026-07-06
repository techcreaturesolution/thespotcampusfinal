import nodemailer from "nodemailer";

/**
 * Reusable email sending utility using Nodemailer.
 * Falls back to printing to terminal in development if SMTP details are missing.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("\n==========================================================");
    console.warn("⚠️  WARNING: Nodemailer SMTP variables are not configured in server/.env!");
    console.warn(`📧 Recipient: ${to}`);
    console.warn(`📝 Subject: ${subject}`);
    console.warn("📄 Plain Text Message:");
    console.warn(text);
    console.warn("==========================================================\n");
    return;
  }

  try {
    console.log(`📧 Attempting to send email to: ${to} via SMTP host: ${host}...`);

    const transporterConfig = {
      host,
      port: parseInt(port || "587", 10),
      secure: port === "465" || port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Bypass SSL certificate verification issues
      },
    };

    // If using gmail.com, force service option for maximum compatibility
    if (host.toLowerCase().includes("gmail.com")) {
      delete transporterConfig.host;
      delete transporterConfig.port;
      delete transporterConfig.secure;
      transporterConfig.service = "gmail";
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    // Gmail strictly overrides and sometimes rejects from address if format doesn't match authenticated account
    const fromHeader = process.env.SMTP_FROM || `"The Spot Campus" <${user}>`;

    const mailOptions = {
      from: fromHeader,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to: ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Nodemailer Send Error:", error);
    throw error; // Rethrow to let the controller catch and return the status code
  }
};

/**
 * Sends a stylized HTML password reset email to the recipient.
 */
export const sendPasswordResetEmail = async (to, resetUrl) => {
  const subject = "Reset Your Password - The Spot Campus";
  const text = `You are receiving this email because you requested a password reset for your account on The Spot Campus. Please click on the link below, or paste it into your browser, to reset your password (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #3730a3; margin: 0; font-size: 24px; font-weight: 800;">The Spot Campus</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">AI-Powered Campus Placement Ecosystem</p>
      </div>
      <div style="color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Hello,</p>
        <p>We received a request to reset the password for your account. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" target="_blank" style="background-color: #3730a3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">If the button above does not work, copy and paste the following link into your browser:</p>
        <p style="color: #3730a3; font-size: 12px; word-break: break-all; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #f1f5f9;">${resetUrl}</p>
        <p>If you did not request this, you can safely ignore this email; your password will remain unchanged.</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <div style="text-align: center; font-size: 11px; color: #94a3b8;">
        <p>Powered by Tech Creature Solution</p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
};

export default sendEmail;
