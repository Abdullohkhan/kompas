// Must be imported before anything that loads AppModule: ConfigModule.forRoot reads env at import time.
import "dotenv/config";

export const WEBHOOK_SECRET = "whsec_test_secret_for_e2e_only";
process.env.ALLOW_REGISTRATION = "true";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy_not_used_for_network";
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.STRIPE_PRICE_ID = "price_test";
