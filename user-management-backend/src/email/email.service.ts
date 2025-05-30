import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    const emailHost = this.configService.get<string>('EMAIL_HOST');
    const emailPort = this.configService.get<number>('EMAIL_PORT');
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
    const emailFrom = this.configService.get<string>('EMAIL_FROM');

    if (!emailHost || !emailPort || !emailUser || !emailPassword || !emailFrom) {
      this.logger.error('Email configuration is incomplete. Email service may not work.');
      // Depending on strictness, you might throw an error here or allow service to exist in a non-functional state.
      // For now, we'll log and let it be, nodemailer will likely fail on sendMail.
    }
    
    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      // เพิ่ม tls options หากจำเป็นสำหรับบาง mail server เช่น Gmail ที่อาจต้องการ rejectUnauthorized: false
      // tls: {
      //   rejectUnauthorized: false 
      // }
    });

    this.transporter.verify((error, success) => {
        if (error) {
            this.logger.error('Nodemailer transporter verification failed:', error);
        } else {
            this.logger.log('Nodemailer transporter is configured correctly and ready to send emails.');
        }
    });
  }

  private async loadTemplate(templateName: string, replacements: Record<string, string>): Promise<string> {
    const templatePath = path.join(__dirname, 'templates', templateName);
    try {
      let template = fs.readFileSync(templatePath, 'utf-8');
      for (const key in replacements) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, replacements[key]);
      }
      return template;
    } catch (error) {
      this.logger.error(`Error loading or parsing email template ${templateName}:`, error);
      throw new InternalServerErrorException(`Could not load email template: ${templateName}`);
    }
  }

  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to} with subject "${subject}". Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} with subject "${subject}":`, error);
      // Depending on how critical email sending is, you might rethrow or handle differently
      throw new InternalServerErrorException(`Failed to send email: ${error.message}`);
    }
  }

  async sendVerificationEmail(to: string, name: string, token: string, frontendUrl: string): Promise<void> {
    const subject = 'Verify Your Email Address';
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;
    const html = await this.loadTemplate('verify-email.html', { name, verificationLink });
    await this.sendMail(to, subject, html);
  }

  async sendPasswordChangeNotificationEmail(to: string, name: string): Promise<void> {
    const subject = 'Your Password Has Been Changed';
    const html = await this.loadTemplate('password-changed.html', { name });
    await this.sendMail(to, subject, html);
  }

  async sendEmailChangeVerificationEmail(to: string, name: string, newEmail: string, token: string, frontendUrl: string): Promise<void> {
    const subject = 'Confirm Your New Email Address';
    const confirmationLink = `${frontendUrl}/auth/confirm-email-change?token=${token}`;
    const html = await this.loadTemplate('confirm-new-email.html', { name, newEmail, confirmationLink });
    await this.sendMail(to, subject, html);
  }

  async sendEmailChangeNotificationEmail(to: string, name: string, oldEmail: string, newEmail: string): Promise<void> {
    const subject = 'Your Email Address Has Been Updated';
    const html = await this.loadTemplate('email-changed-notification.html', { name, oldEmail, newEmail });
    await this.sendMail(to, subject, html);
  }
}
