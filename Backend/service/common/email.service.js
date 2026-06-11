import nodemailer from "nodemailer";

import emailConfig from "../../config/config.js";

/**
 * @description Sends transactional emails (verification, password reset)
 * using Nodemailer with pre-configured SMTP transport from config.
 */
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

  /**
   * @description Sends an email verification message with a clickable link.
   * @param {string} userEmail - Recipient email address
   * @param {string} token - Verification token
   */
  async sendVerifyEmail(userEmail, token) {
    try {
      console.log(`Sending verification email to ${userEmail}`);
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
    } catch (error) {
      console.error("Failed to send verification email:", error.message);
      throw error;
    }
  }

  /**
   * @description Sends a password reset email with a clickable link.
   * @param {string} userEmail - Recipient email address
   * @param {string} token - Reset token
   */
  async sendResetPasswordEmail(userEmail, token) {
    try {
      console.log(`Sending password reset email to ${userEmail}`);
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
    } catch (error) {
      console.error("Failed to send password reset email:", error.message);
      throw error;
    }
  }
}

export default EmailService;