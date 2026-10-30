"use client";

import { useRef, useState } from "react";
import { bulkAddDeckTerms, deleteDeckWord } from "../actions";

type Result = { added: number; skipped: number; errors: string[] } | null;

function parseTerms(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,;]+/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export default function AddWordsForm({ deckSlug }: { deckSlug: string }) {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleRun() {
    const terms = parseTerms(text);
    if (terms.length === 0) return;

    setRunning(true);
    setResult(null);
    try {
      const res = await bulkAddDeckTerms(deckSlug, terms);
      setResult(res);
      if (res.added > 0) setText("");
    } catch {
      setResult({ added: 0, skipped: 0, errors: ["Server error"] });
    } finally {
      setRunning(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      // JSON array support: ["word1", "word2"] or [{"term":"word1"}, ...]
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(content) as unknown;
          let terms: string[] = [];
          if (Array.isArray(parsed)) {
            terms = parsed.map((item) =>
              typeof item === "string" ? item : typeof item === "object" && item !== null && "term" in item ? String((item as Record<string, unknown>).term) : "",
            ).filter(Boolean);
          }
          setText((prev) => (prev ? prev + "\n" + terms.join("\n") : terms.join("\n")));
        } catch {
          // Fallback: treat as plain text
          setText((prev) => (prev ? prev + "\n" + content : content));
        }
      } else {
        // CSV / plain text
        setText((prev) => (prev ? prev + "\n" + content : content));
      }
    };
    reader.readAsText(file);
    // Reset so same file can be uploaded again
    event.target.value = "";
  }

  const terms = parseTerms(text);

  return (
    <div className="flex flex-col gap-3 rounded border p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">শব্দ যোগ করো</h2>
        <span className="text-xs text-gray-500 dark:text-neutral-400">
          কোনো AI limit নেই — হাজার শব্দও দেওয়া যাবে
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-neutral-400">
        প্রতি লাইনে / কমা দিয়ে English শব্দ দাও। AI details পরে, user click করলে generate হবে।
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
        >
          📂 File Upload (txt / csv / json)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.csv,.json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        disabled={running}
        placeholder={"airport\nluggage\npassport\n\nঅথবা: airport, luggage, passport"}
        className="rounded border px-3 py-2 font-mono text-sm disabled:opacity-60 dark:bg-neutral-900"
      />

      {text.trim() && (
        <p className="text-xs text-gray-500 dark:text-neutral-400">
          {terms.length}টি unique শব্দ পাওয়া গেছে
        </p>
      )}

      <button
        type="button"
        onClick={handleRun}
        disabled={running || terms.length === 0}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {running ? "যোগ হচ্ছে..." : `Add ${terms.length > 0 ? terms.length + "টি" : ""} শব্দ`}
      </button>

      {result && (
        <div className={`rounded p-3 text-sm ${result.errors.length > 0 ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300" : "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300"}`}>
          {result.added > 0 && <p>✓ {result.added}টি নতুন শব্দ যোগ হয়েছে</p>}
          {result.skipped > 0 && <p>↩ {result.skipped}টি আগেই ছিল, skip করা হয়েছে</p>}
          {result.errors.map((err, i) => <p key={i}>✗ {err}</p>)}
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
      className="shrink-0 rounded border border-red-200 px-3 py-2 text-sm text-red-600 disabled:opacity-50 dark:border-red-900 dark:text-red-400"
    >
      {pending ? "..." : "Remove"}
    </button>
  );
}
