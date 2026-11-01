"use client";

import { useRef, useState } from "react";
import {
  bulkAddDeckWords,
  deleteDeckWord,
  type DeckWordInput,
} from "../actions";

type ParsedItem = DeckWordInput;

type Result = {
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
} | null;

function sanitize(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

function getField(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    if (key in obj && obj[key] !== null && obj[key] !== undefined) {
      const v = sanitize(obj[key]);
      if (v) return v;
    }
  }
  return "";
}

function parseJsonToWords(rawContent: string): ParsedItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    return [];
  }

  const list: ParsedItem[] = [];

  function handleObject(obj: Record<string, unknown>) {
    const term = getField(obj, [
      "term",
      "word",
      "name",
      "vocabulary",
      "vocab",
    ]).toLowerCase();
    if (!term) return;

    const meaningBn = getField(obj, [
      "meaningBn",
      "meaning_bn",
      "bengali",
      "bn",
      "bangla",
      "meaningBangla",
    ]);
    const meaning = getField(obj, [
      "meaning",
      "meaningEn",
      "meaning_en",
      "definition",
      "en",
      "english",
    ]);
    const partOfSpeech = getField(obj, [
      "partOfSpeech",
      "part_of_speech",
      "pos",
      "type",
    ]).toLowerCase();
    const example = getField(obj, [
      "example",
      "sentence",
      "exampleSentence",
      "example_sentence",
    ]);
    const pronunciation = getField(obj, [
      "pronunciation",
      "phonetic",
      "pronounce",
      "ipa",
    ]);

    list.push({
      term,
      ...(meaningBn ? { meaningBn } : {}),
      ...(meaning ? { meaning } : {}),
      ...(partOfSpeech ? { partOfSpeech } : {}),
      ...(example ? { example } : {}),
      ...(pronunciation ? { pronunciation } : {}),
    });
  }

  function handleItem(item: unknown) {
    if (!item) return;
    if (typeof item === "string") {
      const term = item.trim().toLowerCase();
      if (term) list.push({ term });
      return;
    }
    if (typeof item === "object") {
      handleObject(item as Record<string, unknown>);
    }
  }

  if (Array.isArray(parsed)) {
    parsed.forEach(handleItem);
  } else if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    const arrayKey = Object.keys(obj).find((k) =>
      [
        "words",
        "data",
        "vocabulary",
        "items",
        "terms",
        "deckwords",
        "deck_words",
      ].includes(k.toLowerCase()) && Array.isArray(obj[k]),
    );

    if (arrayKey) {
      (obj[arrayKey] as unknown[]).forEach(handleItem);
    } else {
      // Key-value dictionary
      for (const [key, val] of Object.entries(obj)) {
        if (typeof val === "string") {
          list.push({ term: key.toLowerCase(), meaningBn: val.trim() });
        } else if (typeof val === "object" && val !== null) {
          handleObject({ term: key, ...(val as object) });
        } else {
          list.push({ term: key.toLowerCase() });
        }
      }
    }
  }

  // Deduplicate and filter valid English words
  const map = new Map<string, ParsedItem>();
  for (const item of list) {
    const t = item.term.trim().toLowerCase();
    if (/^[a-z][a-z' -]{0,39}$/.test(t) && !map.has(t)) {
      map.set(t, { ...item, term: t });
    }
  }

  return Array.from(map.values());
}

function parseCsvToWords(content: string): ParsedItem[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const results: ParsedItem[] = [];

  // Check if first row is header
  const firstRow = lines[0].toLowerCase();
  const hasHeader =
    firstRow.includes("term") ||
    firstRow.includes("word") ||
    firstRow.includes("meaning");
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim());
    if (parts.length > 0) {
      const term = parts[0].toLowerCase().replace(/^["']|["']$/g, "");
      if (/^[a-z][a-z' -]{0,39}$/.test(term)) {
        const item: ParsedItem = { term };
        if (parts[1]) item.meaningBn = parts[1].replace(/^["']|["']$/g, "");
        if (parts[2]) item.meaning = parts[2].replace(/^["']|["']$/g, "");
        if (parts[3]) item.partOfSpeech = parts[3].replace(/^["']|["']$/g, "");
        results.push(item);
      }
    }
  }

  // Deduplicate
  const map = new Map<string, ParsedItem>();
  for (const r of results) {
    if (!map.has(r.term)) map.set(r.term, r);
  }
  return Array.from(map.values());
}

function parseRawTextToWords(text: string): ParsedItem[] {
  return Array.from(
    new Set(
      text
        .split(/[\n,;]+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => /^[a-z][a-z' -]{0,39}$/.test(t)),
    ),
  ).map((term) => ({ term }));
}

export default function AddWordsForm({ deckSlug }: { deckSlug: string }) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result>(null);

  // File state
  const [fileName, setFileName] = useState("");
  const [fileWords, setFileWords] = useState<ParsedItem[]>([]);
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError("");
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setFileError("ফাইলটি খালি ছিল।");
        setFileWords([]);
        return;
      }

      let parsed: ParsedItem[] = [];
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith(".json")) {
        parsed = parseJsonToWords(content);
        if (parsed.length === 0) {
          setFileError(
            "JSON ফাইল থেকে কোনো ইংরেজি শব্দ খুঁজে পাওয়া যায়নি। নিশ্চিত করুন ফাইলটিতে array বা term/word ফিল্ড রয়েছে।",
          );
        }
      } else if (lowerName.endsWith(".csv")) {
        parsed = parseCsvToWords(content);
        if (parsed.length === 0) {
          setFileError("CSV ফাইল থেকে কোনো বৈধ শব্দ পড়া যায়নি।");
        }
      } else {
        // .txt or generic
        parsed = parseRawTextToWords(content);
        if (parsed.length === 0) {
          setFileError("ফাইলটিতে কোনো বৈধ শব্দ পাওয়া যায়নি।");
        }
      }

      setFileWords(parsed);
    };

    reader.onerror = () => {
      setFileError("ফাইলটি পড়তে সমস্যা হয়েছে।");
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  async function handleImportFile() {
    if (fileWords.length === 0) return;

    setRunning(true);
    setResult(null);

    // Send in batches of 500 to stay well under the 4MB server action body limit
    const BATCH = 500;
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const allErrors: string[] = [];

    try {
      for (let i = 0; i < fileWords.length; i += BATCH) {
        const batch = fileWords.slice(i, i + BATCH);
        const res = await bulkAddDeckWords(deckSlug, batch);
        totalAdded += res.added;
        totalUpdated += res.updated;
        totalSkipped += res.skipped;
        allErrors.push(...res.errors);
      }
      const res = { added: totalAdded, updated: totalUpdated, skipped: totalSkipped, errors: allErrors };
      setResult(res);
      if (res.added > 0 || res.updated > 0) {
        setFileWords([]);
        setFileName("");
      }
    } catch {
      setResult({ added: 0, updated: 0, skipped: 0, errors: ["সার্ভার এরর, আবার চেষ্টা করুন"] });
    } finally {
      setRunning(false);
    }
  }

  async function handleRunText() {
    const words = parseRawTextToWords(text);
    if (words.length === 0) return;

    setRunning(true);
    setResult(null);
    try {
      const res = await bulkAddDeckWords(deckSlug, words);
      setResult(res);
      if (res.added > 0) setText("");
    } catch {
      setResult({ added: 0, updated: 0, skipped: 0, errors: ["সার্ভার এরর, আবার চেষ্টা করুন"] });
    } finally {
      setRunning(false);
    }
  }

  const textTerms = parseRawTextToWords(text);
  const wordsWithMeaning = fileWords.filter((w) => w.meaningBn || w.meaning);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-neutral-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          শব্দ যোগ করো
        </h2>
        <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "file"
                ? "bg-white text-black shadow-xs dark:bg-neutral-700 dark:text-white"
                : "text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            📂 ফাইল আপলোড (JSON/CSV/TXT)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "text"
                ? "bg-white text-black shadow-xs dark:bg-neutral-700 dark:text-white"
                : "text-gray-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            ✍️ টেক্সট লিখে যোগ
          </button>
        </div>
      </div>

      {activeTab === "file" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-neutral-700">
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">📄</span>
              <p className="text-sm font-medium text-gray-800 dark:text-neutral-200">
                JSON, CSV বা TXT ফাইল নির্বাচন করো
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                JSON-এ বাংলা অর্থ থাকলে সেটিও সরাসরি সেভ হবে
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={running}
                className="mt-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-50 dark:bg-neutral-100 dark:text-black dark:hover:bg-white"
              >
                ফাইল ব্রাউজ করো
              </button>
            </div>
          </div>

          {fileError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {fileError}
            </div>
          )}

          {fileWords.length > 0 && (
            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fileName}
                  </span>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-neutral-400">
                    <span className="rounded bg-green-100 px-2 py-0.5 font-medium text-green-800 dark:bg-green-950/50 dark:text-green-300">
                      ✓ {fileWords.length}টি শব্দ পাওয়া গেছে
                    </span>
                    {wordsWithMeaning.length > 0 && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                        {wordsWithMeaning.length}টির অর্থ অন্তর্ভুক্ত আছে
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFileWords([]);
                    setFileName("");
                  }}
                  className="text-xs text-gray-500 underline hover:text-black dark:hover:text-white"
                >
                  বাতিল
                </button>
              </div>

              {/* Preview table */}
              <div className="max-h-48 overflow-y-auto rounded border bg-white p-2 text-xs dark:border-neutral-800 dark:bg-neutral-950">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-gray-500 dark:border-neutral-800">
                      <th className="pb-1 font-medium">#</th>
                      <th className="pb-1 font-medium">Word</th>
                      <th className="pb-1 font-medium">বাংলা অর্থ</th>
                      <th className="pb-1 font-medium">POS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-neutral-800">
                    {fileWords.slice(0, 15).map((w, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1 text-gray-400">{idx + 1}</td>
                        <td className="py-1 font-medium">{w.term}</td>
                        <td className="py-1 text-gray-600 dark:text-neutral-300">
                          {w.meaningBn || (
                            <span className="italic text-gray-400">
                              (on-demand)
                            </span>
                          )}
                        </td>
                        <td className="py-1 text-gray-400">
                          {w.partOfSpeech || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {fileWords.length > 15 && (
                  <p className="pt-2 text-center text-xs text-gray-400">
                    ... আরও {fileWords.length - 15}টি শব্দ রয়েছে
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleImportFile}
                disabled={running}
                className="rounded-lg bg-black py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                {running
                  ? "সেভ হচ্ছে..."
                  : `সবগুলো শব্দ (${fileWords.length}টি) ডেকে যোগ করো`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-600 dark:text-neutral-400">
            প্রতি লাইনে একটি করে শব্দ লিখুন অথবা কমা দিয়ে লিখুন।
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            disabled={running}
            placeholder={"airport\nluggage\npassport\n\nঅথবা: airport, luggage, passport"}
            className="rounded-lg border border-gray-300 p-3 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          {text.trim() && (
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              {textTerms.length}টি অনন্য শব্দ পাওয়া গেছে
            </p>
          )}
          <button
            type="button"
            onClick={handleRunText}
            disabled={running || textTerms.length === 0}
            className="rounded-lg bg-black py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {running
              ? "যোগ হচ্ছে..."
              : `Add ${textTerms.length > 0 ? textTerms.length + "টি" : ""} শব্দ`}
          </button>
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg p-3 text-xs ${
            result.errors.length > 0
              ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
              : "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300"
          }`}
        >
          {result.added > 0 && <p>✓ {result.added}টি নতুন শব্দ সফলভাবে যোগ হয়েছে</p>}
          {result.updated > 0 && (
            <p>✓ {result.updated}টি শব্দের তথ্য (অর্থ/উদাহরণ) আপডেট করা হয়েছে</p>
          )}
          {result.skipped > 0 && (
            <p>↩ {result.skipped}টি শব্দ আগেই হুবহু ছিল, স্কিপ করা হয়েছে</p>
          )}
          {result.errors.map((err, i) => (
            <p key={i}>✗ {err}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeleteDeckWordButton({
  deckSlug,
  deckWordId,
  term,
}: {
  deckSlug: string;
  deckWordId: string;
  term: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`"${term}" প্যাক থেকে মুছে ফেলবে?`)) return;
    setPending(true);
    await deleteDeckWord(deckSlug, deckWordId);
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="shrink-0 rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
    >
      {pending ? "..." : "Remove"}
    </button>
  );
}
