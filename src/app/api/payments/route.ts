import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activityLog";
import { requireStaff } from "@/lib/auth/session";
import { createCheckoutSession } from "@/lib/stripe";
import { rateLimit } from "@/lib/rateLimit";
import { VALID_PAYMENT_TYPES, isValidPaymentType, isValidPaymentAmount } from "@/lib/validation/payments";

const TYPE_LABELS: Record<string, string> = {
  deposit: "Property Deposit",
  booking_fee: "Booking Fee",
  consultation: "Consultation Fee",
};

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "payments", 10, 60_000);
  if (limited) return limited;
  try {
    const body = await request.json();
    const {
      propertyId,
      userId,
      amount,
      currency,
      type,
      paymentMethod,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = body;

    if (!amount || !customerName || !customerEmail || !type) {
      return NextResponse.json(
        { error: "Amount, name, email, and type are required" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!isValidPaymentAmount(numericAmount)) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }
    if (!isValidPaymentType(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${VALID_PAYMENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Simulate a transaction id; overwritten below with the real Stripe
    // session id when a live Checkout Session is created.
    let transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let checkoutUrl: string | null = null;
    // Card payments start "pending" until Stripe confirms them via webhook
    // (or "completed" immediately in the no-Stripe-configured demo fallback).
    let status = paymentMethod === "bank_transfer" ? "pending" : "completed";

    if ((paymentMethod || "card") === "card") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      try {
        const session = await createCheckoutSession({
          amount: numericAmount,
          currency: currency || "GBP",
          description:
            TYPE_LABELS[type] +
            (notes ? ` — ${notes}` : "") ,
          customerEmail,
          successUrl: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${appUrl}/payment/cancelled`,
          metadata: {
            propertyId: propertyId ? String(propertyId) : "",
            type,
            customerName,
          },
        });
        if (session) {
          transactionId = session.id;
          checkoutUrl = session.url;
          status = "pending"; // will flip to "completed" once the webhook fires
        }
        // If Stripe isn't configured, session is null and we fall back to
        // the placeholder "completed" flow below (demo/dev mode only).
      } catch (stripeError) {
        console.error("Stripe checkout session creation failed:", stripeError);
        return NextResponse.json(
          { error: "Unable to start payment. Please try again." },
          { status: 502 }
        );
      }
    }

    const payment = await db
      .insert(payments)
      .values({
        propertyId: propertyId || null,
        userId: userId || null,
        amount: numericAmount,
        currency: currency || "GBP",
        type,
        status,
        paymentMethod: paymentMethod || "card",
        transactionId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        notes: notes || null,
      })
      .returning();

    await logActivity({
      action: "create",
      entity: "property",
      details: `Payment of ${currency || "GBP"} ${numericAmount} by ${customerName} (${type})`,
      userName: customerName,
    });

    return NextResponse.json({
      success: true,
      payment: payment[0],
      checkoutUrl, // present only when a real Stripe Checkout session was created
    });
  } catch (error) {
    console.error("Payment failed:", error);
    return NextResponse.json(
      { error: "Payment failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const paymentList = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));

    const totals = await db
      .select({
        total: sql<number>`COALESCE(sum(amount), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(payments)
      .where(eq(payments.status, "completed"));

    return NextResponse.json({
      payments: paymentList,
      summary: {
        totalRevenue: Number(totals[0].total),
        totalTransactions: Number(totals[0].count),
      },
    });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json({ payments: [], summary: { totalRevenue: 0, totalTransactions: 0 } });
  }
}
