import { getConfigValue } from "@/lib/runtimeConfig";
import crypto from "crypto";

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeRequest<T = Record<string, unknown>>(
  path: string,
  secretKey: string,
  params: Record<string, string>
): Promise<T> {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    const message =
      (data && data.error && data.error.message) || "Stripe request failed";
    throw new Error(message);
  }
  return data as T;
}

export interface CreateCheckoutSessionArgs {
  amount: number; // in major currency units, e.g. GBP pounds
  currency: string;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

/**
 * Returns null when Stripe isn't configured (no secret key set via env or
 * the Admin > API Keys panel), so callers can fall back to the
 * non-integrated placeholder flow.
 */
export async function isStripeConfigured(): Promise<boolean> {
  const key = await getConfigValue("STRIPE_SECRET_KEY");
  return Boolean(key && key.trim());
}

export async function createCheckoutSession(
  args: CreateCheckoutSessionArgs
): Promise<StripeCheckoutSession | null> {
  const secretKey = await getConfigValue("STRIPE_SECRET_KEY");
  if (!secretKey) return null;

  const amountInMinorUnits = Math.round(args.amount * 100);

  const params: Record<string, string> = {
    mode: "payment",
    "payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": args.currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]": args.description,
    "line_items[0][price_data][unit_amount]": String(amountInMinorUnits),
    "line_items[0][quantity]": "1",
    customer_email: args.customerEmail,
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
  };
  for (const [key, value] of Object.entries(args.metadata)) {
    params[`metadata[${key}]`] = value;
  }

  const session = await stripeRequest<{ id: string; url: string }>(
    "/checkout/sessions",
    secretKey,
    params
  );
  return { id: session.id, url: session.url };
}

/**
 * Verifies a Stripe webhook signature per Stripe's documented scheme:
 * https://stripe.com/docs/webhooks/signatures
 * Returns the parsed event body if valid, otherwise null.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<Record<string, unknown> | null> {
  const webhookSecret = await getConfigValue("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret || !signatureHeader) return null;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    })
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return null;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}
