import { NextRequest, NextResponse } from "next/server";
import { translateText, translateToAll, type Lang } from "@/lib/translate";
import { rateLimit } from "@/lib/rateLimit";

// POST { text, from?, to? }
//  - if `to` provided: translate text from `from` (default fa) to `to`
//  - otherwise: translate to all 4 languages (used by mobile auto-translate)
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "translate", 20, 60_000);
  if (limited) return limited;
  try {
    const body = await request.json();
    const text: string = body.text || "";
    const from: Lang = (body.from as Lang) || "fa";
    const to: Lang | undefined = body.to as Lang | undefined;

    if (!text.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    if (to) {
      const translated = await translateText(text, from, to);
      return NextResponse.json({ translated, from, to });
    }

    const translations = await translateToAll(text, from);
    return NextResponse.json({ translations, from });
  } catch (error) {
    console.error("Translate error:", error);
    return NextResponse.json({ error: "Translate failed" }, { status: 500 });
  }
}
