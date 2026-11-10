import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().default("autox.sid"),
  SESSION_SECURE: z.string().default("false").transform(value => value === "true"),
  SESSION_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax")
});

export const env = envSchema.parse(process.env);
