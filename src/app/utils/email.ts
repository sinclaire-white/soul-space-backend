import ejs from "ejs";
import path from "path";
import { Resend } from "resend";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import status from "http-status";

const resend = envVars.RESEND_API_KEY
  ? new Resend(envVars.RESEND_API_KEY)
  : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({
  subject,
  templateData,
  templateName,
  to,
  attachments,
}: SendEmailOptions) => {
  try {
    if (!resend) {
      if (envVars.NODE_ENV !== "production") {
        console.warn(
          `Email service not configured. Skipping email to ${to} with subject "${subject}".`,
        );
        return;
      }
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        "Email service is not configured",
      );
    }

    const templatePath = path.resolve(
      process.cwd(),
      `src/app/templates/${templateName}.ejs`,
    );
    const html = await ejs.renderFile(templatePath, templateData);

    const { data, error } = await resend.emails.send({
      from: envVars.EMAIL_FROM || "onboarding@resend.dev",
      to: [to],
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content)
          ? a.content.toString("base64")
          : a.content,
      })),
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`Email sent to ${to} : ${data?.id}`);
  } catch (error: any) {
    console.log("Email Sending Error", error.message);

    if (envVars.NODE_ENV !== "production") {
      console.warn(
        `Continuing without email delivery in ${envVars.NODE_ENV} mode.`,
      );
      return;
    }

    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
  }
};
