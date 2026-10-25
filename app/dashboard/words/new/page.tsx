"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { createWord, lookup, type WordFormState } from "../actions";
import SpeakButton from "@/components/SpeakButton";

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
    meaningBn: "",
    example: "",
    tags: "",
  });

  const emptyFields = {
    term: "",
    pronunciation: "",
    partOfSpeech: "",
    meaning: "",
    meaningBn: "",
    example: "",
    tags: "",
  };

  function update(key: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function handleLookup() {
    if (!fields.term.trim()) {
      setNotice("আগে একটি শব্দ লেখো");
      return;
    }

    setNotice("");
    // Ager word-er data muche felo, shudhu term-ta rakho
    setFields((current) => ({ ...emptyFields, term: current.term }));

    startLookup(async () => {
      try {
        const result = await lookup(fields.term);
        if (!result) {
          setNotice("শব্দটা পাওয়া যায়নি — নিজে লিখে নাও");
          return;
        }

        setFields({
          term: result.term,
          pronunciation: result.pronunciation,
          partOfSpeech: result.partOfSpeech,
          meaning: result.meaning,
          meaningBn: result.meaningBn ?? "",
          example: result.example,
          tags: result.synonyms.join(", "),
        });
      } catch {
        setNotice("Dictionary service এখন কাজ করছে না — পরে চেষ্টা করো বা নিজে লিখে নাও");
      }
    });
  }

  const inputClass =
    "rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-black focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-white";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          নতুন শব্দ
        </h1>
        <Link
          href="/dashboard/words"
          className="text-sm font-medium text-gray-600 underline hover:text-black dark:text-neutral-400 dark:hover:text-white"
        >
          ← সব শব্দ
        </Link>
      </div>

      <div className="flex gap-2">
        <input
          value={fields.term}
          onChange={(event) => update("term", event.target.value)}
          name="term"
          placeholder="Word লিখে Lookup চাপো"
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={looking}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {looking ? "খুঁজছি..." : "Lookup"}
        </button>
        <SpeakButton text={fields.term} />
      </div>

      {notice && (
        <p className="rounded-lg bg-amber-50 px-3.5 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {notice}
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="term" value={fields.term} />
        <input
          value={fields.pronunciation}
          onChange={(event) => update("pronunciation", event.target.value)}
          name="pronunciation"
          placeholder="Pronunciation (optional)"
          className={inputClass}
        />
        <input
          value={fields.partOfSpeech}
          onChange={(event) => update("partOfSpeech", event.target.value)}
          name="partOfSpeech"
          placeholder="Part of speech"
          className={inputClass}
        />
        <input
          value={fields.meaningBn}
          onChange={(event) => update("meaningBn", event.target.value)}
          name="meaningBn"
          required
          placeholder="বাংলা অর্থ"
          className="rounded border px-3 py-2"
        />
        <textarea
          value={fields.meaning}
          onChange={(event) => update("meaning", event.target.value)}
          name="meaning"
          rows={3}
          placeholder="English meaning (optional)"
          className="rounded border px-3 py-2"
        />
        <textarea
          value={fields.example}
          onChange={(event) => update("example", event.target.value)}
          name="example"
          rows={2}
          placeholder="Example sentence"
          className={inputClass}
        />
        <input
          value={fields.tags}
          onChange={(event) => update("tags", event.target.value)}
          name="tags"
          placeholder="Tags, comma separated"
          className={inputClass}
        />

        {state.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-black px-4 py-2.5 font-medium text-white shadow-xs transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {pending ? "Saving..." : "Save word"}
        </button>
      </form>
    </div>
  );
}
