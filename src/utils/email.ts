// EmailJS utility for sending OTP emails from frontend
// This uses the EmailJS library loaded in index.html

declare global {
  interface Window {
    emailjs: any;
  }
}

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_jo73hp8';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_m83jjye';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'iAe2zwL5rU5RyQ-XY';

export const sendOtpEmail = async (email: string, otp: string): Promise<boolean> => {
  try {
    console.log('Sending OTP email via EmailJS...');
    console.log('EmailJS config:', {
      serviceId: EMAILJS_SERVICE_ID,
      templateId: EMAILJS_TEMPLATE_ID,
      publicKey: EMAILJS_PUBLIC_KEY,
    });

    // Check if EmailJS is loaded
    if (!window.emailjs) {
      console.error('EmailJS not loaded!');
      console.log(`OTP for ${email}: ${otp} (EmailJS not loaded)`);
      return false;
    }

    const timeString = new Date().toLocaleString();
    
    const templateParams = {
      to_email: email,
      passcode: otp,
      time: timeString,
      to_name: email.split('@')[0],
    };

    console.log('Sending with params:', templateParams);

    const result = await window.emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('EmailJS response:', result);
    console.log(`OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email via EmailJS:', error);
    console.log(`OTP for ${email}: ${otp} (email send failed)`);
    return false;
  }
};

export default { sendOtpEmail };
