import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  FRONTEND_URL: string;
  
  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  
  // JWT Tokens
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  
  // Super Admin
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  
  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  
  // SMTP
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
}

const getEnvVariable = (key: keyof typeof process.env, isNumber = false): string | number => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return isNumber ? parseInt(value, 10) : value;
};

export const envVars: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as string) || "development",
  PORT: getEnvVariable("PORT", true) as number,
  DATABASE_URL: getEnvVariable("DATABASE_URL") as string,
  BETTER_AUTH_SECRET: getEnvVariable("BETTER_AUTH_SECRET") as string,
  BETTER_AUTH_URL: getEnvVariable("BETTER_AUTH_URL") as string,
  FRONTEND_URL: getEnvVariable("FRONTEND_URL") as string,
  
  // Google OAuth
  GOOGLE_CLIENT_ID: getEnvVariable("GOOGLE_CLIENT_ID") as string,
  GOOGLE_CLIENT_SECRET: getEnvVariable("GOOGLE_CLIENT_SECRET") as string,
  
  // JWT Tokens
  ACCESS_TOKEN_SECRET: getEnvVariable("ACCESS_TOKEN_SECRET") as string,
  ACCESS_TOKEN_EXPIRES_IN: (process.env.ACCESS_TOKEN_EXPIRES_IN as string) || "1d",
  REFRESH_TOKEN_SECRET: getEnvVariable("REFRESH_TOKEN_SECRET") as string,
  REFRESH_TOKEN_EXPIRES_IN: (process.env.REFRESH_TOKEN_EXPIRES_IN as string) || "7d",
  
  // Super Admin
  SUPER_ADMIN_EMAIL: getEnvVariable("SUPER_ADMIN_EMAIL") as string,
  SUPER_ADMIN_PASSWORD: getEnvVariable("SUPER_ADMIN_PASSWORD") as string,
  
  // Stripe
  STRIPE_SECRET_KEY: getEnvVariable("STRIPE_SECRET_KEY") as string,
  STRIPE_WEBHOOK_SECRET: getEnvVariable("STRIPE_WEBHOOK_SECRET") as string,
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: getEnvVariable("CLOUDINARY_CLOUD_NAME") as string,
  CLOUDINARY_API_KEY: getEnvVariable("CLOUDINARY_API_KEY") as string,
  CLOUDINARY_API_SECRET: getEnvVariable("CLOUDINARY_API_SECRET") as string,
  
  // SMTP
  SMTP_HOST: getEnvVariable("SMTP_HOST") as string,
  SMTP_PORT: getEnvVariable("SMTP_PORT", true) as number,
  SMTP_USER: getEnvVariable("SMTP_USER") as string,
  SMTP_PASS: getEnvVariable("SMTP_PASS") as string,
  SMTP_FROM: getEnvVariable("SMTP_FROM") as string,
};
