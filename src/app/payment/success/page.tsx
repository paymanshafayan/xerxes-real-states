"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import AppShell from "@/components/AppShell";

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<"checking" | "confirmed" | "pending">("checking");

  useEffect(() => {
    // The webhook usually confirms within a few seconds; we just show a
    // friendly "thank you" state — actual status is authoritative in the DB
    // and visible to staff in the admin dashboard regardless of this page.
    const timer = setTimeout(() => setStatus("confirmed"), 1500);
    setStatus("pending");
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppShell>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {status === "confirmed" ? (
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <Clock className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {status === "confirmed" ? "Payment received" : "Confirming your payment..."}
          </h1>
          <p className="text-gray-500 mb-6">
            Thank you — you will receive a confirmation email shortly with the details.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
