import { z } from "zod";
import { ipaToBengali } from "./ipa-to-bengali";

export type DictionaryResult = {
  term: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  meaningBn?: string;
  example: string;
  synonyms: string[];
};

/* ---------- Source 1: dictionaryapi.dev ---------- */

const entrySchema = z.object({
  word: z.string(),
  phonetic: z.string().optional(),
  phonetics: z
    .array(z.object({ text: z.string().optional() }))
    .optional()
    .default([]),
  meanings: z.array(
    z.object({
      partOfSpeech: z.string(),
      definitions: z.array(
        z.object({
          definition: z.string(),
          example: z.string().optional(),
          synonyms: z.array(z.string()).optional().default([]),
        }),
      ),
    }),
  ),
});

async function lookupFreeDictionary(term: string): Promise<DictionaryResult | null> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`;
  const response = await fetch(url, { cache: "no-store" });

  if (response.status === 404) return null; // word sotti nai
  if (!response.ok) throw new Error(`Free Dictionary API ${response.status}`);

  const parsed = z.array(entrySchema).safeParse(await response.json());
  if (!parsed.success) throw new Error("Free Dictionary: unexpected response shape");

  const entry = parsed.data[0];
  const meaning = entry?.meanings[0];
  const definition = meaning?.definitions[0];
  if (!entry || !meaning || !definition) return null;

  return {
    term: entry.word,
    pronunciation:
      entry.phonetic ?? entry.phonetics.find((item) => item.text)?.text ?? "",
    partOfSpeech: meaning.partOfSpeech,
    meaning: meaning.definitions
      .slice(0, 2)
      .map((item) => item.definition.replace(/[.;\s]+$/, ""))
      .join(", "),
    example: definition.example ?? "",
    synonyms: definition.synonyms.slice(0, 5),
  };
}

/* ---------- Source 2 (fallback): Wiktionary ---------- */

const wiktionarySchema = z.object({
  en: z
    .array(
      z.object({
        partOfSpeech: z.string(),
        definitions: z.array(
          z.object({
            definition: z.string(),
            examples: z.array(z.string()).optional().default([]),
          }),
        ),
      }),
    )
    .optional()
    .default([]),
});

// Wiktionary-r text-e HTML tag thake, seta bad diye plain text banay
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function lookupWiktionary(term: string): Promise<DictionaryResult | null> {
  const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(term)}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      // Wikimedia chay request-e ekta descriptive User-Agent thakuk
      "User-Agent": "vocab-app/1.0 (personal learning project; your-email-or-github-link)",
      Accept: "application/json",
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Wiktionary API ${response.status}`);

  const parsed = wiktionarySchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Wiktionary: unexpected response shape");

  for (const entry of parsed.data.en) {
    const definitions = entry.definitions
      .map((item) => ({
        text: stripHtml(item.definition),
        example: item.examples[0] ? stripHtml(item.examples[0]) : "",
      }))
      .filter((item) => item.text);

    if (definitions.length === 0) continue;

    return {
      term,
      pronunciation: "", // Wiktionary response-e pronunciation nai
      partOfSpeech: entry.partOfSpeech.toLowerCase(),
      meaning: definitions
        .slice(0, 2)
        .map((item) => item.text.replace(/[.;\s]+$/, ""))
        .join(", "),
      example: definitions.find((item) => item.example)?.example ?? "",
      synonyms: [], // eitao nai
    };
  }

  return null;
}

async function translateToBengali(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return "";

  try {
    const params = new URLSearchParams({
      q: clean.slice(0, 100),
      langpair: "en|bn",
    });
    if (process.env.MYMEMORY_EMAIL) params.set("de", process.env.MYMEMORY_EMAIL);

    const response = await fetch(
      `https://api.mymemory.translated.net/get?${params}`,
      { cache: "no-store" },
    );
    if (!response.ok) return "";

    const data = await response.json();
    const translated: string = data?.responseData?.translatedText ?? "";

    // Quota shesh hole MyMemory error message-ke-i "translation" hishebe pathay
    if (Number(data?.responseStatus) !== 200) return "";
    if (translated.toUpperCase().includes("MYMEMORY WARNING")) return "";

    return translated.trim();
  } catch (error) {
    console.error("[translate] failed:", error);
    return "";
  }
}

/* ---------- Public function ---------- */

export async function lookupWord(term: string): Promise<DictionaryResult | null> {
  const clean = term.trim().toLowerCase();

  let result: DictionaryResult | null;
  try {
    result = await lookupFreeDictionary(clean);
  } catch (error) {
    console.error("[dictionary] primary failed, trying Wiktionary:", error);
    result = await lookupWiktionary(clean);
  }

  if (!result) return null;

  const meaningBn = await translateToBengali(result.term);
  return {
    ...result,
    pronunciation: ipaToBengali(result.pronunciation),
    meaningBn,
  };
}