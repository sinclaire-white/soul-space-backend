import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  FRONTEND_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
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
  STRIPE_SECRET_KEY: getEnvVariable("STRIPE_SECRET_KEY") as string,
  STRIPE_WEBHOOK_SECRET: getEnvVariable("STRIPE_WEBHOOK_SECRET") as string,
  CLOUDINARY_CLOUD_NAME: getEnvVariable("CLOUDINARY_CLOUD_NAME") as string,
  CLOUDINARY_API_KEY: getEnvVariable("CLOUDINARY_API_KEY") as string,
  CLOUDINARY_API_SECRET: getEnvVariable("CLOUDINARY_API_SECRET") as string,
  SMTP_HOST: getEnvVariable("SMTP_HOST") as string,
  SMTP_PORT: getEnvVariable("SMTP_PORT", true) as number,
  SMTP_USER: getEnvVariable("SMTP_USER") as string,
  SMTP_PASS: getEnvVariable("SMTP_PASS") as string,
  SMTP_FROM: getEnvVariable("SMTP_FROM") as string,
};
