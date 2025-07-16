// Email notification service for subscription events
// This is a basic implementation - you would integrate with your preferred email service
// (SendGrid, AWS SES, Mailgun, etc.)

interface EmailTemplateData {
  userName: string;
  userEmail: string;
  companyName?: string;
  planName: string;
  amount?: number;
  currency?: string;
  trialEndDate?: Date;
  subscriptionEndDate?: Date;
  billingPeriod?: string;
  nextBillingDate?: Date;
  supportEmail?: string;
  dashboardUrl?: string;
  manageSubscriptionUrl?: string;
}

interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

class SubscriptionEmailService {
  private readonly fromEmail: string;
  private readonly supportEmail: string;
  private readonly baseUrl: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@voxerion.com';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'support@voxerion.com';
    this.baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://voxerion.com';
  }

  async sendWelcomeEmail(data: EmailTemplateData): Promise<boolean> {
    const subject = `Welcome to ${data.planName} - Your subscription is active!`;
    
    const html = this.generateWelcomeEmailHTML(data);
    const text = this.generateWelcomeEmailText(data);

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  async sendTrialEndingEmail(data: EmailTemplateData): Promise<boolean> {
    const subject = 'Your trial is ending soon - Continue with Voxerion';
    
    const html = this.generateTrialEndingEmailHTML(data);
    const text = this.generateTrialEndingEmailText(data);

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  async sendPaymentSuccessEmail(data: EmailTemplateData): Promise<boolean> {
    const subject = `Payment confirmed - ${data.planName} subscription renewed`;
    
    const html = this.generatePaymentSuccessEmailHTML(data);
    const text = this.generatePaymentSuccessEmailText(data);

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  async sendPaymentFailedEmail(data: EmailTemplateData): Promise<boolean> {
    const subject = 'Payment failed - Action required for your subscription';
    
    const html = this.generatePaymentFailedEmailHTML(data);
    const text = this.generatePaymentFailedEmailText(data);

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  async sendCancellationEmail(data: EmailTemplateData): Promise<boolean> {
    const subject = 'Subscription canceled - We\'re sorry to see you go';
    
    const html = this.generateCancellationEmailHTML(data);
    const text = this.generateCancellationEmailText(data);

    return this.sendEmail({
      to: data.userEmail,
      subject,
      html,
      text,
    });
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // TODO: Integrate with your email service provider
      // Example implementations:
      
      // For SendGrid:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.send({
      //   from: this.fromEmail,
      //   ...options
      // });

      // For AWS SES:
      // const ses = new AWS.SES();
      // await ses.sendEmail({
      //   Source: this.fromEmail,
      //   Destination: { ToAddresses: [options.to] },
      //   Message: {
      //     Subject: { Data: options.subject },
      //     Body: {
      //       Html: { Data: options.html },
      //       Text: { Data: options.text }
      //     }
      //   }
      // }).promise();

      // For development - log email content
      if (process.env.NODE_ENV === 'development') {
        console.log('=== EMAIL NOTIFICATION ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Content:', options.text || 'HTML only');
        console.log('========================');
      }

      // For now, just return true (email would be sent in production)
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  private generateWelcomeEmailHTML(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #E64A19; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #E64A19; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Voxerion!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Thank you for subscribing to our <strong>${data.planName}</strong> plan. Your subscription is now active!</p>
            
            ${data.trialEndDate ? `
              <p><strong>Trial Period:</strong> Your trial ends on ${data.trialEndDate.toLocaleDateString()}. You won't be charged until then.</p>
            ` : ''}
            
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Access your dashboard to explore all features</li>
              <li>Set up your team and start the onboarding process</li>
              <li>Configure your organizational insights</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${this.baseUrl}/dashboard" class="button">Go to Dashboard</a>
            </p>
            
            <p>If you have any questions, feel free to reach out to our support team at ${this.supportEmail}.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Voxerion. All rights reserved.</p>
            <p><a href="${this.baseUrl}/dashboard/billing">Manage Subscription</a> | <a href="${this.supportEmail}">Support</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailText(data: EmailTemplateData): string {
    return `
Welcome to Voxerion!

Hello ${data.userName}!

Thank you for subscribing to our ${data.planName} plan. Your subscription is now active!

${data.trialEndDate ? `Trial Period: Your trial ends on ${data.trialEndDate.toLocaleDateString()}. You won't be charged until then.` : ''}

What's next?
- Access your dashboard to explore all features
- Set up your team and start the onboarding process
- Configure your organizational insights

Dashboard: ${this.baseUrl}/dashboard

If you have any questions, feel free to reach out to our support team at ${this.supportEmail}.

© ${new Date().getFullYear()} Voxerion. All rights reserved.
    `.trim();
  }

  private generateTrialEndingEmailHTML(data: EmailTemplateData): string {
    const daysLeft = data.trialEndDate ? Math.ceil((data.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #E64A19; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your trial is ending soon</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            
            <div class="warning">
              <strong>Your ${data.planName} trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.</strong>
            </div>
            
            <p>We hope you've been enjoying your experience with Voxerion! Your trial will end on ${data.trialEndDate?.toLocaleDateString()}.</p>
            
            <p><strong>To continue using Voxerion:</strong></p>
            <ul>
              <li>Your subscription will automatically continue after the trial</li>
              <li>You'll be charged ${data.amount ? `${(data.amount / 100).toFixed(2)} ${(data.currency || 'USD').toUpperCase()}` : 'the subscription amount'} ${data.billingPeriod === 'annual' ? 'annually' : 'monthly'}</li>
              <li>You can cancel anytime before the trial ends with no charge</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${this.baseUrl}/dashboard/billing" class="button">Manage Subscription</a>
            </p>
            
            <p>Questions? Contact us at ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTrialEndingEmailText(data: EmailTemplateData): string {
    const daysLeft = data.trialEndDate ? Math.ceil((data.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    
    return `
Your trial is ending soon

Hello ${data.userName}!

Your ${data.planName} trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.

We hope you've been enjoying your experience with Voxerion! Your trial will end on ${data.trialEndDate?.toLocaleDateString()}.

To continue using Voxerion:
- Your subscription will automatically continue after the trial
- You'll be charged ${data.amount ? `${(data.amount / 100).toFixed(2)} ${(data.currency || 'USD').toUpperCase()}` : 'the subscription amount'} ${data.billingPeriod === 'annual' ? 'annually' : 'monthly'}
- You can cancel anytime before the trial ends with no charge

Manage Subscription: ${this.baseUrl}/dashboard/billing

Questions? Contact us at ${this.supportEmail}
    `.trim();
  }

  private generatePaymentSuccessEmailHTML(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #E64A19; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            
            <div class="success">
              <strong>Your payment has been processed successfully!</strong>
            </div>
            
            <p>Your ${data.planName} subscription has been renewed.</p>
            
            <p><strong>Payment Details:</strong></p>
            <ul>
              <li>Amount: ${data.amount ? `${(data.amount / 100).toFixed(2)} ${(data.currency || 'USD').toUpperCase()}` : 'N/A'}</li>
              <li>Plan: ${data.planName}</li>
              <li>Billing: ${data.billingPeriod === 'annual' ? 'Annual' : 'Monthly'}</li>
              ${data.nextBillingDate ? `<li>Next billing date: ${data.nextBillingDate.toLocaleDateString()}</li>` : ''}
            </ul>
            
            <p style="text-align: center;">
              <a href="${this.baseUrl}/dashboard" class="button">Access Dashboard</a>
            </p>
            
            <p>Thank you for continuing to use Voxerion!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentSuccessEmailText(data: EmailTemplateData): string {
    return `
Payment Confirmed

Hello ${data.userName}!

Your payment has been processed successfully!

Your ${data.planName} subscription has been renewed.

Payment Details:
- Amount: ${data.amount ? `${(data.amount / 100).toFixed(2)} ${(data.currency || 'USD').toUpperCase()}` : 'N/A'}
- Plan: ${data.planName}
- Billing: ${data.billingPeriod === 'annual' ? 'Annual' : 'Monthly'}
${data.nextBillingDate ? `- Next billing date: ${data.nextBillingDate.toLocaleDateString()}` : ''}

Dashboard: ${this.baseUrl}/dashboard

Thank you for continuing to use Voxerion!
    `.trim();
  }

  private generatePaymentFailedEmailHTML(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #E64A19; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .error { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Failed</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            
            <div class="error">
              <strong>We couldn't process your payment for the ${data.planName} subscription.</strong>
            </div>
            
            <p>Don't worry - your access hasn't been interrupted yet. Please update your payment method to continue using Voxerion.</p>
            
            <p><strong>What you need to do:</strong></p>
            <ul>
              <li>Update your payment method in your account</li>
              <li>Check that your card hasn't expired</li>
              <li>Ensure sufficient funds are available</li>
              <li>Contact your bank if the issue persists</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${this.baseUrl}/dashboard/billing" class="button">Update Payment Method</a>
            </p>
            
            <p>Need help? Contact us at ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentFailedEmailText(data: EmailTemplateData): string {
    return `
Payment Failed

Hello ${data.userName}!

We couldn't process your payment for the ${data.planName} subscription.

Don't worry - your access hasn't been interrupted yet. Please update your payment method to continue using Voxerion.

What you need to do:
- Update your payment method in your account
- Check that your card hasn't expired
- Ensure sufficient funds are available
- Contact your bank if the issue persists

Update Payment Method: ${this.baseUrl}/dashboard/billing

Need help? Contact us at ${this.supportEmail}
    `.trim();
  }

  private generateCancellationEmailHTML(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6B7280; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #E64A19; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Canceled</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            
            <p>We're sorry to see you go. Your ${data.planName} subscription has been canceled.</p>
            
            ${data.subscriptionEndDate ? `
              <p><strong>Access:</strong> You'll continue to have access to Voxerion until ${data.subscriptionEndDate.toLocaleDateString()}.</p>
            ` : ''}
            
            <p><strong>What happens next:</strong></p>
            <ul>
              <li>Your data will be preserved for 30 days after cancellation</li>
              <li>You can reactivate your subscription anytime</li>
              <li>No further charges will be made</li>
            </ul>
            
            <p>We'd love to have you back anytime. If you have feedback on how we can improve, please let us know.</p>
            
            <p style="text-align: center;">
              <a href="${this.baseUrl}/payment" class="button">Reactivate Subscription</a>
            </p>
            
            <p>Contact us at ${this.supportEmail} if you need any assistance.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateCancellationEmailText(data: EmailTemplateData): string {
    return `
Subscription Canceled

Hello ${data.userName}!

We're sorry to see you go. Your ${data.planName} subscription has been canceled.

${data.subscriptionEndDate ? `Access: You'll continue to have access to Voxerion until ${data.subscriptionEndDate.toLocaleDateString()}.` : ''}

What happens next:
- Your data will be preserved for 30 days after cancellation
- You can reactivate your subscription anytime
- No further charges will be made

We'd love to have you back anytime. If you have feedback on how we can improve, please let us know.

Reactivate Subscription: ${this.baseUrl}/payment

Contact us at ${this.supportEmail} if you need any assistance.
    `.trim();
  }
}

export const subscriptionEmailService = new SubscriptionEmailService();

// Helper function to send emails based on webhook events
export async function sendSubscriptionEmail(
  eventType: 'welcome' | 'trial_ending' | 'payment_success' | 'payment_failed' | 'canceled',
  userData: EmailTemplateData
): Promise<boolean> {
  try {
    switch (eventType) {
      case 'welcome':
        return await subscriptionEmailService.sendWelcomeEmail(userData);
      case 'trial_ending':
        return await subscriptionEmailService.sendTrialEndingEmail(userData);
      case 'payment_success':
        return await subscriptionEmailService.sendPaymentSuccessEmail(userData);
      case 'payment_failed':
        return await subscriptionEmailService.sendPaymentFailedEmail(userData);
      case 'canceled':
        return await subscriptionEmailService.sendCancellationEmail(userData);
      default:
        console.error('Unknown email event type:', eventType);
        return false;
    }
  } catch (error) {
    console.error('Error sending subscription email:', error);
    return false;
  }
}