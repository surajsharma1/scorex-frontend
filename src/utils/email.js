/**
 * Email Utility
 * * NOTE: The user has requested to use Backend-based Email Sending (Nodemailer with App Passwords).
 * Therefore, frontend email sending (EmailJS) is deprecated for critical Auth flows.
 * * This file now serves as a placeholder or can be used for non-critical client-side feedback.
 */
export const sendPasswordResetEmail = async (email, token) => {
    console.warn("Emails are now handled by the Backend API via /auth/forgot-password");
    return { success: true, message: "Request forwarded to backend" };
};
export const sendWelcomeEmail = async (email, username) => {
    console.warn("Welcome emails are handled by the Backend upon registration.");
    return { success: true, message: "Handled by backend" };
};
export const emailService = {
    sendPasswordResetEmail,
    sendWelcomeEmail,
};
export default emailService;
