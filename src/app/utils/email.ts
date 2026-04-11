/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from "ejs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    host: envVars.SMTP_HOST,
    secure: true,
    auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS
    },
    port: Number(envVars.SMTP_PORT)
})

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
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
    }
}
