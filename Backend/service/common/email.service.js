import nodemailer from "nodemailer";

import emailConfig from "../../config/config.js";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: false,

      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });
  }

  // =========================================
  // Verify Email
  // =========================================
  async sendVerifyEmail(userEmail, token) {
    const verifyLink =
      `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: emailConfig.from,
      to: userEmail,

      subject: "Verify Your Email",

      html: `
        <div style="font-family: Arial;">
          <h2>Email Verification</h2>

          <p>
            Click the button below to verify your email.
          </p>

          <a
            href="${verifyLink}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#2e7d32;
              color:white;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Verify Email
          </a>
        </div>
      `,
    });
  }

  // =========================================
  // Reset Password Email
  // =========================================
  async sendResetPasswordEmail(userEmail, token) {
    const resetLink =
      `${process.env.APP_URL}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: emailConfig.from,
      to: userEmail,

      subject: "Reset Password",

      html: `
        <div style="font-family: Arial;">
          <h2>Password Reset</h2>

          <p>
            Click the button below to reset your password.
          </p>

          <a
            href="${resetLink}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#1565c0;
              color:white;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Reset Password
          </a>
        </div>
      `,
    });
  }
}

export default EmailService;