import Link from "next/link";
import { XCircle } from "lucide-react";
import AppShell from "@/components/AppShell";

export default function PaymentCancelledPage() {
  return (
    <AppShell>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment cancelled</h1>
          <p className="text-gray-500 mb-6">
            No charge was made. You can try again anytime.
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
