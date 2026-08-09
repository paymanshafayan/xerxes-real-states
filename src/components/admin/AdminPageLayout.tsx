"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminPageLayout({
  children,
  title,
  backHref = "/admin",
}: {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
}) {
  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 p-4 border-b">
          <Link href={backHref}>
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      )}
      {children}
    </div>
  );
}
