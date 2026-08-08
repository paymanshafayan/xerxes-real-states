export type Lang = "en" | "tr" | "fa" | "ru";

export const ALL_LANGS: Lang[] = ["en", "tr", "fa", "ru"];

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  tr: "Türkçe",
  fa: "فارسی",
  ru: "Русский",
};

/**
 * Translate a single string. Uses OpenAI when configured, otherwise echoes the
 * source text (so the app is fully usable in dev without an API key).
 */
export async function translateText(
  text: string,
  from: Lang,
  to: Lang
): Promise<string> {
  if (!text?.trim()) return "";
  if (from === to) return text;

  const apiKey = process.env.OPENAI_API_KEY;
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  if (!apiKey) return text; // dev fallback

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATE_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional real-estate translator. Translate the user text from ${LANG_NAMES[from]} to ${LANG_NAMES[to]}. Return only the translated text, no quotes, no commentary.`,
          },
          { role: "user", content: text },
        ],
        temperature: 0.2,
      }),
    });
    const data = await res.json();
    const out = data?.choices?.[0]?.message?.content?.trim();
    return out || text;
  } catch (err) {
    console.error("Translate failed:", err);
    return text;
  }
}

/**
 * Translate one source string in `from` to every other supported language.
 * Returns a record keyed by language code.
 */
export async function translateToAll(
  text: string,
  from: Lang = "fa"
): Promise<Record<Lang, string>> {
  const out = { en: "", tr: "", fa: "", ru: "" } as Record<Lang, string>;
  await Promise.all(
    ALL_LANGS.map(async (lang) => {
      out[lang] = await translateText(text, from, lang);
    })
  );
  return out;
}
