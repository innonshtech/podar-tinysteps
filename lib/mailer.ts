import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const verifySmtpConnection = async () => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not found in environment variables. Email services may not work.');
      return false;
    }
    const success = await transporter.verify();
    if (success) {
      console.log('✅ SMTP connection verified successfully');
    }
    return success;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    // Log the error but do not throw to allow graceful handling
    return false;
  }
};

export interface SendEmailParams {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[]; // Future-ready for attachments
}

export const sendEmail = async (params: SendEmailParams) => {
  try {
    const defaultFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: defaultFrom,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments,
    });
    
    console.log(`✉️ Email sent successfully: ${info.messageId}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
};

export default transporter;
