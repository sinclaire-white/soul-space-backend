import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import { auth } from "./app/lib/auth";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { IndexRoutes } from "./app/routes";

dotenv.config();

const app: Express = express();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Better Auth handler - MUST be before express.json()
app.all("/api/auth/*", async (req, res) => {
    // Better Auth handler will be mounted here
    // Using dynamic import to handle the auth handler properly
    const { toNodeHandler } = await import("better-auth/node");
    return toNodeHandler(auth)(req, res);
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "Soul Space API is running" });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
    res.json({ message: "Welcome to Soul Space API" });
});

// API Routes
app.use("/api/v1", IndexRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

export default app;
