import "server-only";
import Stripe from "stripe";

function getRequiredEnvironmentVariable(
  name: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET" | "STRIPE_MEMBERSHIP_PRICE_ID" | "APP_URL"
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for Stripe membership billing.`);
  }

  return value;
}

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getRequiredEnvironmentVariable("STRIPE_SECRET_KEY"), {
      // Cloudflare Workers provide the Web Fetch API, not a full Node HTTP runtime.
      // Forcing Stripe's fetch transport prevents Node's HTTP client from hanging
      // behind the Workers compatibility layer.
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 1,
      timeout: 15_000,
    });
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  return getRequiredEnvironmentVariable("STRIPE_WEBHOOK_SECRET");
}

export function getMembershipPriceId() {
  return getRequiredEnvironmentVariable("STRIPE_MEMBERSHIP_PRICE_ID");
}

export function getAppUrl() {
  const configuredUrl = getRequiredEnvironmentVariable("APP_URL");
  const url = new URL(configuredUrl);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("APP_URL must use http or https.");
  }

  return url.origin;
}
