/**
 * Email Utility for Frontend
 * Provides functions to send emails using EmailJS
 * This file handles OTP emails, password reset emails, and other email communications
 */

import emailjs from '@emailjs/browser';

// EmailJS configuration - these should be set in environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_jo73hp8';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_m83jjye';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'iAe2zwL5rU5RyQ-XY';

// Email template IDs for different email types
const TEMPLATES = {
  OTP: import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID || 'template_m83jjye',
  PASSWORD_RESET: import.meta.env.VITE_EMAILJS_PASSWORD_RESET_TEMPLATE_ID || 'template_password_reset',
  WELCOME: import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID || 'template_welcome',
  NOTIFICATION: import.meta.env.VITE_EMAILJS_NOTIFICATION_TEMPLATE_ID || 'template_notification',
};

// Email types
export interface EmailParams {
  to_email: string;
  to_name?: string;
  passcode?: string;
  otp?: string;
  reset_url?: string;
  resetToken?: string;
  verificationUrl?: string;
  message?: string;
  subject?: string;
  from_name?: string;
  from_email?: string;
  timestamp?: string;
  [key: string]: string | undefined;
}

export interface EmailResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface OtpEmailParams {
  email: string;
  otp: string;
  purpose?: 'registration' | 'login' | 'verification';
}

export interface PasswordResetEmailParams {
  email: string;
  resetToken: string;
  resetUrl?: string;
}

/**
 * Initialize EmailJS with public key
 * Call this once when the app starts
 */
export const initEmailJS = (): void => {
  emailjs.init(EMAILJS_PUBLIC_KEY);
};

/**
 * Send OTP email using EmailJS
 * @param email - Recipient email address
 * @param otp - One-time password to send
 * @param purpose - Purpose of the OTP (registration, login, verification)
 * @returns Promise<EmailResult>
 */
export const sendOtpEmail = async (
  email: string, 
  otp: string, 
  purpose: 'registration' | 'login' | 'verification' = 'registration'
): Promise<EmailResult> => {
  try {
    console.log(`Sending OTP email to ${email} for ${purpose}...`);
    console.log('EmailJS Configuration:', {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: TEMPLATES.OTP,
      publicKey: EMAILJS_PUBLIC_KEY ? 'set' : 'not set',
    });

    // Check if EmailJS is properly configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS is not properly configured. Returning mock success for development.');
      return {
        success: true,
        message: `OTP for ${email} is: ${otp} (Development mode - email not actually sent)`,
      };
    }

    // Prepare template parameters
    const templateParams: EmailParams = {
      to_email: email,
      passcode: otp,
      otp: otp,
      to_name: email.split('@')[0],
      timestamp: new Date().toLocaleString(),
      purpose: purpose,
    };

    // Send email using EmailJS
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.OTP,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('OTP email sent successfully:', result);

    return {
      success: true,
      message: 'OTP email sent successfully',
      data: result,
    };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    
    // In development, return a success with warning instead of failing
    if (import.meta.env.DEV) {
      console.warn(`Development mode: OTP for ${email} is ${otp}`);
      return {
        success: true,
        message: `OTP email failed to send (Development mode). OTP: ${otp}`,
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send OTP email',
    };
  }
};

/**
 * Send password reset email
 * @param email - Recipient email address
 * @param resetToken - Password reset token
 * @param resetUrl - Optional custom reset URL
 * @returns Promise<EmailResult>
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  resetUrl?: string
): Promise<EmailResult> => {
  try {
    console.log(`Sending password reset email to ${email}...`);

    // Check if EmailJS is properly configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS is not properly configured. Returning mock success for development.');
      const defaultResetUrl = `${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      return {
        success: true,
        message: `Password reset URL: ${resetUrl || defaultResetUrl} (Development mode)`,
      };
    }

    // Prepare template parameters
    const templateParams: EmailParams = {
      to_email: email,
      to_name: email.split('@')[0],
      resetToken: resetToken,
      reset_url: resetUrl || `${import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`,
      timestamp: new Date().toLocaleString(),
    };

    // Send email using EmailJS
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.PASSWORD_RESET,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Password reset email sent successfully:', result);

    return {
      success: true,
      message: 'Password reset email sent successfully',
      data: result,
    };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send password reset email',
    };
  }
};

/**
 * Send welcome email to new users
 * @param email - Recipient email address
 * @param username - User's username
 * @returns Promise<EmailResult>
 */
export const sendWelcomeEmail = async (
  email: string,
  username: string
): Promise<EmailResult> => {
  try {
    console.log(`Sending welcome email to ${email}...`);

    // Check if EmailJS is properly configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS is not properly configured. Returning mock success for development.');
      return {
        success: true,
        message: `Welcome email would be sent to ${email} (Development mode)`,
      };
    }

    // Prepare template parameters
    const templateParams: EmailParams = {
      to_email: email,
      to_name: username,
      from_name: 'ScoreX Team',
      timestamp: new Date().toLocaleString(),
    };

    // Send email using EmailJS
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.WELCOME,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Welcome email sent successfully:', result);

    return {
      success: true,
      message: 'Welcome email sent successfully',
      data: result,
    };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send welcome email',
    };
  }
};

/**
 * Send generic notification email
 * @param email - Recipient email address
 * @param subject - Email subject
 * @param message - Email message body
 * @returns Promise<EmailResult>
 */
export const sendNotificationEmail = async (
  email: string,
  subject: string,
  message: string
): Promise<EmailResult> => {
  try {
    console.log(`Sending notification email to ${email}...`);

    // Check if EmailJS is properly configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS is not properly configured. Returning mock success for development.');
      return {
        success: true,
        message: `Notification email would be sent to ${email} (Development mode)`,
      };
    }

    // Prepare template parameters
    const templateParams: EmailParams = {
      to_email: email,
      to_name: email.split('@')[0],
      subject: subject,
      message: message,
      timestamp: new Date().toLocaleString(),
    };

    // Send email using EmailJS
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      TEMPLATES.NOTIFICATION,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('Notification email sent successfully:', result);

    return {
      success: true,
      message: 'Notification email sent successfully',
      data: result,
    };
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send notification email',
    };
  }
};

/**
 * Verify email configuration
 * @returns Object with configuration status
 */
export const verifyEmailConfig = (): { isConfigured: boolean; config: Record<string, boolean> } => {
  const config = {
    serviceId: !!EMAILJS_SERVICE_ID && EMAILJS_SERVICE_ID !== 'your_service_id',
    templateId: !!TEMPLATES.OTP,
    publicKey: !!EMAILJS_PUBLIC_KEY,
  };

  return {
    isConfigured: config.serviceId && config.templateId && config.publicKey,
    config,
  };
};

// Export all email functions as a single object for convenience
export const emailService = {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  initEmailJS,
  verifyEmailConfig,
};

export default emailService;
