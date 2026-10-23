import { z } from "zod";

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

const responseSchema = z.array(entrySchema);

export type DictionaryResult = {
  term: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  synonyms: string[];
};

export async function lookupWord(term: string): Promise<DictionaryResult | null> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`;

  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) return null;

  const parsed = responseSchema.safeParse(await response.json());
  if (!parsed.success) return null;

  const entry = parsed.data[0];
  const meaning = entry.meanings[0];
  const definition = meaning?.definitions[0];
  if (!meaning || !definition) return null;

  return {
    term: entry.word,
    pronunciation:
      entry.phonetic ?? entry.phonetics.find((item) => item.text)?.text ?? "",
    partOfSpeech: meaning.partOfSpeech,
    meaning: meaning.definitions
      .slice(0, 2)
      .map((item) => item.definition)
      .join("; "),
    example: definition.example ?? "",
    synonyms: definition.synonyms.slice(0, 5),
  };
}