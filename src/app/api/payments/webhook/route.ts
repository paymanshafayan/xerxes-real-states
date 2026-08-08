import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/stripe";
import { logActivity } from "@/lib/activityLog";

// Stripe requires the raw, unparsed request body to verify the signature.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const event = await verifyWebhookSignature(rawBody, signature);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const type = event.type as string;
    const data = event.data as { object?: Record<string, unknown> };
    const object = data?.object;

    if (type === "checkout.session.completed" && object) {
      const sessionId = object.id as string;
      const paymentStatus = object.payment_status as string; // "paid" | "unpaid" | ...

      if (paymentStatus === "paid") {
        const updated = await db
          .update(payments)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(payments.transactionId, sessionId))
          .returning();

        if (updated.length > 0) {
          await logActivity({
            action: "update",
            entity: "property",
            details: `Payment ${sessionId} confirmed via Stripe webhook`,
            userName: "stripe-webhook",
          });
        }
      }
    } else if (
      type === "checkout.session.expired" ||
      type === "payment_intent.payment_failed"
    ) {
      const sessionId = object?.id as string | undefined;
      if (sessionId) {
        await db
          .update(payments)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(payments.transactionId, sessionId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
