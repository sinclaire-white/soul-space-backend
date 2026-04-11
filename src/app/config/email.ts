import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const emailConfig = transporter;

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        path: string;
    }>;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
    try {
        const mailOptions = {
            from: `"Soul Space" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
            attachments: options.attachments,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
        console.error("Email send error:", error);
        throw new Error("Failed to send email");
    }
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Soul Space</h1>
            </div>
            <div class="content">
                <h2>Verify Your Email</h2>
                <p>Thank you for joining Soul Space. Use the verification code below to complete your registration:</p>
                <div class="otp-code">${otp}</div>
                <p>This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Soul Space. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    await sendEmail({
        to: email,
        subject: "Your Soul Space Verification Code",
        html,
    });
};

export const sendPasswordResetEmail = async (email: string, otp: string): Promise<void> => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Soul Space</h1>
            </div>
            <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password. Use the code below to proceed:</p>
                <div class="otp-code">${otp}</div>
                <p>This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Soul Space. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    await sendEmail({
        to: email,
        subject: "Password Reset Request - Soul Space",
        html,
    });
};

export const sendBookingConfirmationEmail = async (
    email: string,
    bookingDetails: {
        consultantName: string;
        date: string;
        time: string;
        amount: number;
    }
): Promise<void> => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Soul Space</h1>
            </div>
            <div class="content">
                <h2>Booking Confirmed!</h2>
                <p>Your consultation has been successfully booked. Here are the details:</p>
                <div class="booking-details">
                    <div class="detail-row">
                        <span><strong>Consultant:</strong></span>
                        <span>${bookingDetails.consultantName}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Date:</strong></span>
                        <span>${bookingDetails.date}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Time:</strong></span>
                        <span>${bookingDetails.time}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Amount Paid:</strong></span>
                        <span>$${bookingDetails.amount}</span>
                    </div>
                </div>
                <p>Please join the session on time. You will receive a reminder before the session starts.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Soul Space. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    await sendEmail({
        to: email,
        subject: "Booking Confirmation - Soul Space",
        html,
    });
};

export const sendModerationEmail = async (
    email: string,
    action: string,
    reason: string
): Promise<void> => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .action-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Soul Space</h1>
            </div>
            <div class="content">
                <h2>Account ${action}</h2>
                <p>We are writing to inform you that your account has been <strong>${action.toLowerCase()}</strong>.</p>
                <div class="action-box">
                    <p><strong>Reason:</strong> ${reason}</p>
                </div>
                <p>If you believe this action was taken in error, please contact our support team.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Soul Space. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    await sendEmail({
        to: email,
        subject: `Account ${action} - Soul Space`,
        html,
    });
};
