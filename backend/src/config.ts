export type Env = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN?: string;
  ALLOW_REGISTRATION: boolean;
  APP_URL: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID?: string;
};

/** Fails fast at boot when a required secret is missing or weak. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const str = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");
  if (!str("DATABASE_URL")) throw new Error("DATABASE_URL is required");
  if (str("JWT_SECRET").length < 32) {
    throw new Error("JWT_SECRET is required and must be at least 32 characters");
  }
  return {
    DATABASE_URL: str("DATABASE_URL"),
    JWT_SECRET: str("JWT_SECRET"),
    JWT_EXPIRES_IN: str("JWT_EXPIRES_IN") || "7d",
    PORT: Number(str("PORT")) || 4000,
    NODE_ENV: str("NODE_ENV") || "development",
    CORS_ORIGIN: str("CORS_ORIGIN") || undefined,
    // Closed by default: accounts are created by the seed (first admin) or by admin invites.
    ALLOW_REGISTRATION: str("ALLOW_REGISTRATION") === "true",
    APP_URL: (str("APP_URL") || "http://localhost:3000").replace(/\/$/, ""),
    STRIPE_SECRET_KEY: str("STRIPE_SECRET_KEY") || undefined,
    STRIPE_WEBHOOK_SECRET: str("STRIPE_WEBHOOK_SECRET") || undefined,
    STRIPE_PRICE_ID: str("STRIPE_PRICE_ID") || undefined,
  };
}
