"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ databaseUrl: "", username: "", name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [databaseConfigured, setDatabaseConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/setup", { cache: "no-store" })
      .then((response) => response.json())
      .then((state) => setDatabaseConfigured(Boolean(state.databaseConfigured)))
      .catch(() => setDatabaseConfigured(false));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Setup failed.");
        return;
      }
      sessionStorage.setItem("admin_token", result.token);
      router.replace("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <section className="mx-auto max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-9">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Xerxes Real Estate</p>
        <h1 className="text-3xl font-bold">Initial setup</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Create the first manager. A secure authentication secret is generated automatically.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {databaseConfigured === true ? (
            <p className="rounded-lg bg-emerald-950 px-3 py-2.5 text-sm text-emerald-200">
              PostgreSQL connection detected from Railway configuration.
            </p>
          ) : databaseConfigured === false ? (
            <Field label="PostgreSQL connection URL" type="password" value={form.databaseUrl} onChange={(databaseUrl) => setForm({ ...form, databaseUrl })} autoComplete="off" hint="Paste Railway’s DATABASE_URL. It is stored only in the attached protected Volume." />
          ) : (
            <p className="text-sm text-slate-400">Checking database configuration…</p>
          )}
          <Field label="Full name" value={form.name} onChange={(name) => setForm({ ...form, name })} autoComplete="name" />
          <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} autoComplete="email" />
          <Field label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} autoComplete="username" hint="Letters, numbers, dot, underscore and dash only." />
          <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} autoComplete="new-password" hint="At least 10 characters." />
          <Field label="Confirm password" type="password" value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} autoComplete="new-password" />
          {error && <p role="alert" className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
          <button disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Creating account…" : "Complete setup"}
          </button>
        </form>
        <p className="mt-5 text-xs leading-5 text-slate-400">This page locks permanently after the first manager is created.</p>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", autoComplete, hint }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete: string; hint?: string }) {
  return <label className="block text-sm font-medium">{label}<input required type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="mt-1.5 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-white outline-none ring-blue-500 focus:ring-2" />{hint && <span className="mt-1 block text-xs font-normal text-slate-400">{hint}</span>}</label>;
}
