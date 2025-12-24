import nodemailer from 'nodemailer';
import { logger } from '../config/logger';
import { config } from '../config/environment';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
  
  static async sendWelcomeEmail(data: { name: string; email: string }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to: data.email,
        subject: 'Welcome to Storage Management System',
        html: `
          <h1>Welcome ${data.name}!</h1>
          <p>Thank you for signing up to Storage Management System.</p>
          <p>We're excited to have you on board.</p>
        `,
      });
      
      logger.info(`Welcome email sent to ${data.email}`);
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      throw error;
    }
  }
  
  static async sendVerificationCode(email: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'Password Reset Verification Code',
        html: `
          <h1>Password Reset Request</h1>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
      
      logger.info(`Verification code sent to ${email}`);
    } catch (error) {
      logger.error('Error sending verification code:', error);
      throw error;
    }
  }
  
  static async sendPasswordResetConfirmation(email: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'Password Reset Successful',
        html: `
          <h1>Password Reset Successful</h1>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
        `,
      });
      
      logger.info(`Password reset confirmation sent to ${email}`);
    } catch (error) {
      logger.error('Error sending password reset confirmation:', error);
      throw error;
    }
  }
}

