import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import status from "http-status";

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 300 : 1000, // generous in dev
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(status.TOO_MANY_REQUESTS).json({
            success: false,
            message: "Too many requests, please try again later",
        });
    },
});

// Post creation rate limiter - 5 posts per hour
export const postLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(status.TOO_MANY_REQUESTS).json({
            success: false,
            message: "You can only create 5 posts per hour. Please try again later.",
        });
    },
    keyGenerator: (req) => {
        return req.user?.userId ?? ipKeyGenerator(req.ip ?? "::/56");
    },
});

// Comment creation rate limiter - 20 comments per hour
export const commentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(status.TOO_MANY_REQUESTS).json({
            success: false,
            message: "You can only create 20 comments per hour. Please try again later.",
        });
    },
    keyGenerator: (req) => {
        return req.user?.userId ?? ipKeyGenerator(req.ip ?? "::/56");
    },
});

// Login rate limiter - 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(status.TOO_MANY_REQUESTS).json({
            success: false,
            message: "Too many login attempts. Please try again after 15 minutes.",
        });
    },
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Reaction rate limiter - 50 reactions per hour
export const reactionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(status.TOO_MANY_REQUESTS).json({
            success: false,
            message: "You can only react to 50 posts per hour. Please try again later.",
        });
    },
    keyGenerator: (req) => {
        return req.user?.userId ?? ipKeyGenerator(req.ip ?? "::/56");
    },
});

// Report rate limiter - 10 reports per hour
export const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(status.TOO_MANY_REQUESTS).json({
            success: false,
            message: "You can only submit 10 reports per hour. Please try again later.",
        });
    },
    keyGenerator: (req) => {
        return req.user?.userId ?? ipKeyGenerator(req.ip ?? "::/56");
    },
});

// Booking rate limiter - 3 bookings per hour
export const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(status.TOO_MANY_REQUESTS).json({
            success: false,
            message: "You can only create 3 bookings per hour. Please try again later.",
        });
    },
    keyGenerator: (req) => {
        return req.user?.userId ?? ipKeyGenerator(req.ip ?? "::/56");
    },
});
