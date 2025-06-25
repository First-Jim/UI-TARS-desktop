import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SmtpService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    console.log('📧 SMTP Configuration:');
    console.log('- Host:', smtpHost);
    console.log('- Port:', smtpPort);
    console.log('- User:', smtpUser);
    console.log('- Has Password:', !!smtpPass);

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('❌ SMTP configuration incomplete');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('✅ SMTP transporter initialized');
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<any> {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const fromEmail =
      options.from ||
      this.configService.get<string>(
        'EMAIL_FROM',
        this.configService.get<string>('SMTP_USER'),
      );

    const mailOptions = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    console.log('📧 Sending SMTP email:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ SMTP email sent successfully:', result.messageId);
      return { id: result.messageId };
    } catch (error) {
      console.error('❌ SMTP email send failed:', error);
      throw error;
    }
  }
}
