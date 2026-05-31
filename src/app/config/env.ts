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
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  
  // JWT Tokens
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  
  // Super Admin
  SUPER_ADMIN_EMAIL?: string;
  SUPER_ADMIN_PASSWORD?: string;
  
  // Stripe
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  
  // SMTP
  // SMTP_HOST?: string;
  // SMTP_PORT?: number;
  // SMTP_USER?: string;
  // SMTP_PASS?: string;
  // SMTP_FROM?: string;

  // Resend Email
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

const getEnvVariable = (
  key: keyof typeof process.env,
  isNumber = false,
  developmentFallback?: string
): string | number => {
  const value = process.env[key];

  if (!value && developmentFallback && process.env.NODE_ENV !== "production") {
    return isNumber ? parseInt(developmentFallback, 10) : developmentFallback;
  }

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return isNumber ? parseInt(value, 10) : value;
};

const getOptionalEnvVariable = (key: keyof typeof process.env): string | undefined => {
  return process.env[key] || undefined;
};

// const getOptionalNumberEnvVariable = (key: keyof typeof process.env): number | undefined => {
//   const value = process.env[key];
//   return value ? parseInt(value, 10) : undefined;
// };

export const envVars: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as string) || "development",
  PORT: getEnvVariable("PORT", true) as number,
  DATABASE_URL: getEnvVariable("DATABASE_URL") as string,
  BETTER_AUTH_SECRET: getEnvVariable("BETTER_AUTH_SECRET") as string,
  BETTER_AUTH_URL: getEnvVariable("BETTER_AUTH_URL") as string,
  FRONTEND_URL: getEnvVariable("FRONTEND_URL") as string,
  
  // Google OAuth
  GOOGLE_CLIENT_ID: getOptionalEnvVariable("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getOptionalEnvVariable("GOOGLE_CLIENT_SECRET"),
  
  // JWT Tokens
  ACCESS_TOKEN_SECRET: getEnvVariable("ACCESS_TOKEN_SECRET", false, "dev-access-token-secret") as string,
  ACCESS_TOKEN_EXPIRES_IN: (process.env.ACCESS_TOKEN_EXPIRES_IN as string) || "1d",
  REFRESH_TOKEN_SECRET: getEnvVariable("REFRESH_TOKEN_SECRET", false, "dev-refresh-token-secret") as string,
  REFRESH_TOKEN_EXPIRES_IN: (process.env.REFRESH_TOKEN_EXPIRES_IN as string) || "7d",
  
  // Super Admin
  SUPER_ADMIN_EMAIL: getOptionalEnvVariable("SUPER_ADMIN_EMAIL"),
  SUPER_ADMIN_PASSWORD: getOptionalEnvVariable("SUPER_ADMIN_PASSWORD"),
  
  // Stripe
  STRIPE_SECRET_KEY: getOptionalEnvVariable("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: getOptionalEnvVariable("STRIPE_WEBHOOK_SECRET"),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: getOptionalEnvVariable("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: getOptionalEnvVariable("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: getOptionalEnvVariable("CLOUDINARY_API_SECRET"),
  
  // SMTP
  // SMTP_HOST: getOptionalEnvVariable("SMTP_HOST"),
  // SMTP_PORT: getOptionalNumberEnvVariable("SMTP_PORT"),
  // SMTP_USER: getOptionalEnvVariable("SMTP_USER"),
  // SMTP_PASS: getOptionalEnvVariable("SMTP_PASS"),
  // SMTP_FROM: getOptionalEnvVariable("SMTP_FROM"),

  // Resend Email
  // RESEND_API_KEY: getOptionalEnvVariable("RESEND_API_KEY"),
  // EMAIL_FROM: getOptionalEnvVariable("EMAIL_FROM"),
};
