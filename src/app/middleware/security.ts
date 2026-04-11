import { NextFunction, Request, Response } from "express";
import helmet from "helmet";

// Content Security Policy
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
});

// Sanitize request body to prevent NoSQL injection
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
        const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
            const sanitized: Record<string, unknown> = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    // Remove MongoDB operators
                    if (key.startsWith("$") || key.includes(".")) {
                        continue;
                    }
                    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                        sanitized[key] = sanitize(value as Record<string, unknown>);
                    } else {
                        sanitized[key] = value;
                    }
                }
            }
            return sanitized;
        };

        req.body = sanitize(req.body);
    }
    next();
};

// Remove sensitive fields from response
export const sanitizeOutput = (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function (body: unknown) {
        if (body && typeof body === "object") {
            const removeSensitive = (obj: Record<string, unknown>): Record<string, unknown> => {
                const sanitized: Record<string, unknown> = {};
                const sensitiveFields = ["password", "secret", "token", "licenseNumber", "meetingLink", "preSessionNotes", "postSessionNotes"];

                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        if (sensitiveFields.includes(key)) {
                            continue;
                        }
                        const value = obj[key];
                        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                            sanitized[key] = removeSensitive(value as Record<string, unknown>);
                        } else {
                            sanitized[key] = value;
                        }
                    }
                }
                return sanitized;
            };

            if (Array.isArray(body)) {
                body = body.map((item) =>
                    typeof item === "object" && item !== null
                        ? removeSensitive(item as Record<string, unknown>)
                        : item
                );
            } else {
                body = removeSensitive(body as Record<string, unknown>);
            }
        }
        return originalJson.call(this, body);
    };
    next();
};

// Content sanitization - remove phone numbers and emails from posts
export const sanitizeContent = (content: string): string => {
    // Remove email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    // Remove phone numbers (various formats)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    // Remove URLs
    const urlRegex = /(https?:\/\/|www\.)[^\s]+/g;

    return content
        .replace(emailRegex, "[email removed]")
        .replace(phoneRegex, "[phone removed]")
        .replace(urlRegex, "[link removed]");
};

// Middleware to sanitize post/comment content
export const contentSanitizer = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.content && typeof req.body.content === "string") {
        req.body.content = sanitizeContent(req.body.content);
    }
    next();
};
