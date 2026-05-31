import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { envVars } from "../config/env";
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
        requireEmailVerification: false,
    },

    socialProviders: {},

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
    ],

    session: {
        expiresIn: 60 * 60 * 24,
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24,
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