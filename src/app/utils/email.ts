/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

const isEmailConfigured = () => Boolean(
    envVars.SMTP_HOST &&
    envVars.SMTP_PORT &&
    envVars.SMTP_USER &&
    envVars.SMTP_PASS &&
    envVars.SMTP_FROM
);

const getTransporter = () => {
    if (!isEmailConfigured()) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Email service is not configured");
    }

    return nodemailer.createTransport({
        host: envVars.SMTP_HOST,
        secure: Number(envVars.SMTP_PORT) === 465,
        auth: {
            user: envVars.SMTP_USER,
            pass: envVars.SMTP_PASS
        },
        port: Number(envVars.SMTP_PORT)
    })
}

interface SendEmailOptions {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType: string;
    }[]
}

export const sendEmail = async ({ subject, templateData, templateName, to, attachments }: SendEmailOptions) => {
    try {
        if (!isEmailConfigured()) {
            if (envVars.NODE_ENV !== "production") {
                console.warn(`Email service not configured. Skipping email to ${to} with subject \"${subject}\".`);
                return;
            }

            throw new AppError(status.INTERNAL_SERVER_ERROR, "Email service is not configured");
        }

        const transporter = getTransporter();
        const templatePath = path.resolve(process.cwd(), `src/app/templates/${templateName}.ejs`);

        const html = await ejs.renderFile(templatePath, templateData);

        const info = await transporter.sendMail({
            from: envVars.SMTP_FROM,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments?.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType,
            }))
        })

        console.log(`Email sent to ${to} : ${info.messageId}`);
    } catch (error: any) {
        console.log("Email Sending Error", error.message);

        if (envVars.NODE_ENV !== "production") {
            console.warn(`Continuing without email delivery in ${envVars.NODE_ENV} mode.`);
            return;
        }

        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
    }
}
