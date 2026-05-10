import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, emailOTP } from "better-auth/plugins";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { envVars } from "../config/env";
import { sendEmail } from "../utils/email";
import { prisma } from "./prisma";

export const auth = betterAuth({
    baseURL: envVars.BETTER_AUTH_URL,
    secret: envVars.BETTER_AUTH_SECRET,
    trustedOrigins: [envVars.FRONTEND_URL],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },

    socialProviders: {},

    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: UserRole.USER
            },
            isActive: {
                type: "boolean",
                required: true,
                defaultValue: true
            },
            defaultPostVisibility: {
                type: "string",
                required: true,
                defaultValue: "PUBLIC"
            },
            lastLoginAt: {
                type: "date",
                required: false,
                defaultValue: null
            },
        }
    },

    plugins: [
        bearer(),
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
                if (envVars.NODE_ENV !== "production") {
                    console.log(`DEV OTP (${type}) for ${email}: ${otp}`);
                }

                if (type === "email-verification") {
                    await sendEmail({
                        to: email,
                        subject: "Verify your email",
                        templateName: "otp",
                        templateData: {
                            name: "Soul Space User",
                            otp,
                        }
                    });
                } else if (type === "forget-password") {
                    const user = await prisma.user.findUnique({
                        where: { email }
                    })

                    if (user) {
                        await sendEmail({
                            to: email,
                            subject: "Password Reset OTP",
                            templateName: "otp",
                            templateData: {
                                name: "Soul Space User",
                                otp,
                            }
                        })
                    }
                }
            },
            expiresIn: 5 * 60, // 5 minutes in seconds
            otpLength: 6,
        })
    ],

    session: {
        expiresIn: 60 * 60 * 24, // 1 day in seconds
        updateAge: 60 * 60 * 24, // 1 day in seconds
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24, // 1 day in seconds
        }
    },

    advanced: {
        useSecureCookies: envVars.NODE_ENV === "production",
        cookies: {
            state: {
                attributes: {
                    sameSite: envVars.NODE_ENV === "production" ? "none" : "lax",
                    secure: envVars.NODE_ENV === "production",
                    httpOnly: true,
                    path: "/",
                }
            },
            sessionToken: {
                attributes: {
                    sameSite: envVars.NODE_ENV === "production" ? "none" : "lax",
                    secure: envVars.NODE_ENV === "production",
                    httpOnly: true,
                    path: "/",
                }
            }
        }
    }
});
