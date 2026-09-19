const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // Standard gmail service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Skipping verification email (EMAIL_USER / EMAIL_PASS not configured)');
    return;
  }
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER ? `"Xorachat" <${process.env.EMAIL_USER}>` : '"Xorachat" <noreply@xorachat.com>',
    to: email,
    subject: 'Xorachat - Verify Your Email',
    html: `
      <h2>Welcome to Xorachat!</h2>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationLink}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', email);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};

const sendPasswordResetEmail = async (email, token) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Skipping password reset email (EMAIL_USER / EMAIL_PASS not configured)');
    return;
  }
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER ? `"Xorachat" <${process.env.EMAIL_USER}>` : '"Xorachat" <noreply@xorachat.com>',
    to: email,
    subject: 'Xorachat - Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}" style="padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${resetLink}</p>
      <p>This link will expire in 1 hour.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

const sendInviteEmail = async (email, senderName = 'A friend') => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inviteLink = `${FRONTEND_URL}/register?ref=${encodeURIComponent(senderName)}`;

  const mailOptions = {
    from: process.env.EMAIL_USER ? `"Xorachat" <${process.env.EMAIL_USER}>` : '"Xorachat" <noreply@xorachat.com>',
    to: email,
    subject: `${senderName} invited you to join Xorachat! 💬✨`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">Xorachat 🚀</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">Connect, chat, and call for free!</p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="font-size: 20px; color: #ffffff; margin-top: 0;">You've Been Invited! 🎉</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin: 16px 0 24px 0;">
            <strong style="color: #38bdf8;">${senderName}</strong> is inviting you to join <strong>Xorachat</strong> — the premier chat and calling community.
          </p>
          <div style="background-color: #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 28px; text-align: left; border: 1px solid #334155;">
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">What you get:</p>
            <p style="margin: 4px 0; color: #f1f5f9; font-size: 14px;">✨ 100% Free Instant Messaging & Reactions</p>
            <p style="margin: 4px 0; color: #f1f5f9; font-size: 14px;">📞 Free HD Audio & Video Calling</p>
            <p style="margin: 4px 0; color: #f1f5f9; font-size: 14px;">🔒 Secure End-to-End Encryption</p>
            <p style="margin: 4px 0; color: #f1f5f9; font-size: 14px;">👥 Community Groups & Self-Notes</p>
          </div>
          <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 30px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);">
            Create Free ID & Start Chatting 👉
          </a>
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            Or open this link directly:<br/>
            <a href="${inviteLink}" style="color: #38bdf8; word-break: break-all;">${inviteLink}</a>
          </p>
        </div>
        <div style="background-color: #090d16; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b;">
          © ${new Date().getFullYear()} Xorachat. All rights reserved.
        </div>
      </div>
    `
  };

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('EMAIL_USER / EMAIL_PASS not configured. Simulated invite email to:', email, 'from:', senderName);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('Invite email sent to:', email, 'from:', senderName);
    return { success: true };
  } catch (error) {
    console.error('Error sending invite email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInviteEmail
};
