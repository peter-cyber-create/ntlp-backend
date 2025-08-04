// backend/middleware/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify email configuration
export const verifyEmailConfig = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email service is ready');
        return true;
    } catch (error) {
        console.log('⚠️ Email service not configured:', error.message);
        return false;
    }
};

// Send contact confirmation email
export const sendContactConfirmation = async (contactData) => {
    try {
        const { name, email, subject, message, id } = contactData;
        
        const mailOptions = {
            from: process.env.SMTP_FROM || 'NTLP Conference <noreply@ntlp-conference.org>',
            to: email,
            subject: `NTLP Conference - We received your message: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">NTLP Conference 2025</h2>
                    
                    <p>Dear ${name},</p>
                    
                    <p>Thank you for contacting us! We have received your message and will respond within 24-48 hours.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #374151; margin-top: 0;">Your Message Details:</h3>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong></p>
                        <p style="font-style: italic; margin-left: 20px;">${message}</p>
                        <p><strong>Reference ID:</strong> #${id}</p>
                    </div>
                    
                    <p>If you have any urgent inquiries, please contact us directly at:</p>
                    <ul>
                        <li>Email: contact@ntlp-conference.org</li>
                        <li>Phone: +1 (555) 123-4567</li>
                    </ul>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        Best regards,<br>
                        NTLP Conference 2025 Organizing Committee<br>
                        <a href="https://ntlp-conference.org" style="color: #2563eb;">ntlp-conference.org</a>
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Confirmation email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send confirmation email:', error);
        return false;
    }
};

// Send admin notification for new contact
export const sendAdminNotification = async (contactData) => {
    try {
        const { name, email, subject, message, id, organization } = contactData;
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@ntlp-conference.org';
        
        const mailOptions = {
            from: process.env.SMTP_FROM || 'NTLP Conference <noreply@ntlp-conference.org>',
            to: adminEmail,
            subject: `[NTLP Admin] New Contact Message: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">New Contact Message Received</h2>
                    
                    <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                        <h3 style="color: #7f1d1d; margin-top: 0;">Contact Details:</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p><strong>Organization:</strong> ${organization || 'Not provided'}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Reference ID:</strong> #${id}</p>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                        <h4 style="color: #374151; margin-top: 0;">Message:</h4>
                        <p style="white-space: pre-wrap; font-family: 'Courier New', monospace; background-color: white; padding: 15px; border-radius: 4px;">${message}</p>
                    </div>
                    
                    <p style="margin-top: 30px;">
                        <a href="http://localhost:5000/api/contacts/${id}" 
                           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                           View in Admin Panel
                        </a>
                    </p>
                    
                    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                        Received at: ${new Date().toLocaleString()}<br>
                        System: NTLP Conference Management
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Admin notification sent for contact #${id}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send admin notification:', error);
        return false;
    }
};

// Send response email when admin responds to contact
export const sendResponseEmail = async (contactData, responseMessage) => {
    try {
        const { name, email, subject, id } = contactData;
        
        const mailOptions = {
            from: process.env.SMTP_FROM || 'NTLP Conference <noreply@ntlp-conference.org>',
            to: email,
            subject: `Re: ${subject} - NTLP Conference Response`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">NTLP Conference 2025 - Response</h2>
                    
                    <p>Dear ${name},</p>
                    
                    <p>Thank you for contacting the NTLP Conference 2025. Here is our response to your inquiry:</p>
                    
                    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                        <h3 style="color: #1e40af; margin-top: 0;">Our Response:</h3>
                        <p style="white-space: pre-wrap;">${responseMessage}</p>
                    </div>
                    
                    <p>If you have any follow-up questions, please don't hesitate to contact us again.</p>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        Reference ID: #${id}<br>
                        Original Subject: ${subject}
                    </p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        Best regards,<br>
                        NTLP Conference 2025 Organizing Committee<br>
                        <a href="https://ntlp-conference.org" style="color: #2563eb;">ntlp-conference.org</a>
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Response email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send response email:', error);
        return false;
    }
};

export default {
    verifyEmailConfig,
    sendContactConfirmation,
    sendAdminNotification,
    sendResponseEmail
};
