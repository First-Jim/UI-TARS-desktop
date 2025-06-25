import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SmtpService } from './smtp.service';
import * as path from 'path';
import * as handlebars from 'handlebars';
import * as fs from 'fs';

handlebars.registerHelper('currentYear', () => new Date().getFullYear());

@Injectable()
export class MailService {
  private resend: Resend | any;
  private smtpService: SmtpService | null = null;
  private readonly templateDir = path.join(
    process.cwd(),
    'src',
    'mail',
    'templates',
  );
  private readonly fromEmail: string;
  private useSmtp: boolean = false;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>(
      'EMAIL_FROM',
      'noreply@yourdomain.com',
    );

    const nodeEnv = configService.get('NODE_ENV');
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    console.log('📧 Mail Service Configuration:');
    console.log('- Environment:', nodeEnv);
    console.log('- From Email:', this.fromEmail);
    console.log('- Has API Key:', !!apiKey);
    console.log(
      '- API Key Preview:',
      apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET',
    );

    // Check if we should use SMTP instead of Resend
    const useSmtp = configService.get<boolean>('USE_SMTP', false);
    const smtpHost = configService.get<string>('SMTP_HOST');

    if (useSmtp && smtpHost) {
      console.log('📧 Using SMTP email service');
      this.useSmtp = true;
      this.smtpService = new SmtpService(configService);
      this.resend = null; // We'll handle SMTP differently
    } else if (
      nodeEnv === 'development' ||
      !apiKey ||
      apiKey === 'your_resend_api_key_here' ||
      apiKey === 're_your_api_key_here'
    ) {
      // Use mock implementation in development or when API key is not properly set
      console.log(
        '🔧 Using MOCK email service (development mode or missing API key)',
      );
      this.resend = {
        emails: {
          send: async (options) => {
            console.log('📧 MOCK EMAIL - Would send:');
            console.log('  To:', options.to);
            console.log('  From:', options.from);
            console.log('  Subject:', options.subject);
            console.log(
              '  HTML Length:',
              options.html?.length || 0,
              'characters',
            );
            return { id: 'mock-id-' + Date.now(), from: options.from };
          },
        },
      } as any;
    } else {
      // Use real Resend service in production with valid API key
      console.log('📧 Using REAL Resend email service');
      this.resend = new Resend(apiKey);
    }
  }

  async sendMail({ to, subject, template, context }) {
    try {
      console.log(`📧 Preparing to send email: ${subject} to ${to}`);

      // Load and compile template using existing Handlebars setup
      const templatePath = path.join(this.templateDir, `${template}.hbs`);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found: ${templatePath}`);
      }

      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateSource);
      const html = compiledTemplate(context);

      console.log(
        `📧 Template compiled successfully, HTML length: ${html.length}`,
      );

      // Send email with appropriate service
      const emailOptions = {
        from: this.fromEmail,
        to,
        subject,
        html,
      };

      console.log('📧 Sending email with options:', {
        from: emailOptions.from,
        to: emailOptions.to,
        subject: emailOptions.subject,
        htmlLength: emailOptions.html.length,
        service: this.useSmtp ? 'SMTP' : 'Resend',
      });

      let result;
      if (this.useSmtp && this.smtpService) {
        result = await this.smtpService.sendMail(emailOptions);
      } else {
        result = await this.resend.emails.send(emailOptions);
      }

      console.log('📧 Email send result:', {
        result: result,
        success: !!result,
      });

      return result;
    } catch (error) {
      console.error('❌ Error sending email:', {
        error: error.message,
        stack: error.stack,
        to,
        subject,
        template,
      });

      // Re-throw with more context
      throw new Error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}
