import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "Soul Space API is running" });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to Soul Space API" });
});

export default app;
