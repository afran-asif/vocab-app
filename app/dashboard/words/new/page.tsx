"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { createWord, lookup, type WordFormState } from "../actions";

const initialState: WordFormState = { error: "" };

export default function NewWordPage() {
  const [state, formAction, pending] = useActionState(createWord, initialState);
  const [looking, startLookup] = useTransition();
  const [notice, setNotice] = useState("");

  const [fields, setFields] = useState({
    term: "",
    pronunciation: "",
    partOfSpeech: "",
    meaning: "",
    example: "",
    tags: "",
  });

  function update(key: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function handleLookup() {
    if (!fields.term.trim()) {
      setNotice("আগে একটি শব্দ লেখো");
      return;
    }

    setNotice("");
    startLookup(async () => {
  try {
    const result = await lookup(fields.term);
    if (!result) {
      setNotice("শব্দটা পাওয়া যায়নি — নিজে লিখে নাও");
      return;
    }
    // ... baki setFields code ager moto

      setFields((current) => ({
        ...current,
        term: result.term,
        pronunciation: result.pronunciation || current.pronunciation,
        partOfSpeech: result.partOfSpeech,
        meaning: result.meaning,
        example: result.example || current.example,
        tags: current.tags || result.synonyms.join(", "),
      }));
    } catch {
      setNotice("Dictionary service এখন কাজ করছে না — পরে চেষ্টা করো বা নিজে লিখে নাও");
    }
  });
}

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">নতুন শব্দ</h1>
        <Link href="/dashboard/words" className="text-sm underline">← সব শব্দ</Link>
      </div>

      <div className="flex gap-2">
        <input
          value={fields.term}
          onChange={(event) => update("term", event.target.value)}
          name="term"
          placeholder="Word লিখে Lookup চাপো"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={looking}
          className="rounded border px-3 py-2 text-sm disabled:opacity-50"
        >
          {looking ? "খুঁজছি..." : "Lookup"}
        </button>
      </div>

      {notice && <p className="text-sm text-amber-700">{notice}</p>}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="term" value={fields.term} />
        <input
          value={fields.pronunciation}
          onChange={(event) => update("pronunciation", event.target.value)}
          name="pronunciation"
          placeholder="Pronunciation (optional)"
          className="rounded border px-3 py-2"
        />
        <input
          value={fields.partOfSpeech}
          onChange={(event) => update("partOfSpeech", event.target.value)}
          name="partOfSpeech"
          placeholder="Part of speech"
          className="rounded border px-3 py-2"
        />
        <textarea
          value={fields.meaning}
          onChange={(event) => update("meaning", event.target.value)}
          name="meaning"
          required
          rows={3}
          placeholder="Meaning"
          className="rounded border px-3 py-2"
        />
        <textarea
          value={fields.example}
          onChange={(event) => update("example", event.target.value)}
          name="example"
          rows={2}
          placeholder="Example sentence"
          className="rounded border px-3 py-2"
        />
        <input
          value={fields.tags}
          onChange={(event) => update("tags", event.target.value)}
          name="tags"
          placeholder="Tags, comma separated"
          className="rounded border px-3 py-2"
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save word"}
        </button>
      </form>
    </div>
  );
}