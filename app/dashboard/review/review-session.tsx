"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReviewOutcome } from "@/lib/srs";
import { reviewWord } from "./actions";
import SpeakButton from "@/components/SpeakButton";

type Card = {
  id: string;
  term: string;
  meaning: string;
  example: string | null;
  pronunciation: string | null;
  partOfSpeech: string | null;
};

const ratings: { value: ReviewOutcome; label: string; className: string }[] = [
  {
    value: "AGAIN",
    label: "আবার",
    className:
      "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900/60 border border-transparent dark:border-red-900/40",
  },
  {
    value: "HARD",
    label: "কঠিন",
    className:
      "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:hover:bg-orange-900/60 border border-transparent dark:border-orange-900/40",
  },
  {
    value: "GOOD",
    label: "ঠিক",
    className:
      "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950/60 dark:text-green-300 dark:hover:bg-green-900/60 border border-transparent dark:border-green-900/40",
  },
  {
    value: "EASY",
    label: "সহজ",
    className:
      "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-transparent dark:border-blue-900/40",
  },
];

export default function ReviewSession({ words }: { words: Card[] }) {
  const [queue] = useState(words);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);

  const word = queue[index];

  if (!word) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          আজকের review শেষ 🎉
        </h1>
        <p className="text-gray-600 dark:text-neutral-400">
          {queue.length} টা শব্দ review করেছ।
        </p>
        <Link
          href="/dashboard"
          className="rounded-lg bg-black px-5 py-2.5 font-medium text-white shadow-xs transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Dashboard
        </Link>
      </div>
    );
  }

  async function rate(rating: ReviewOutcome) {
    setSaving(true);
    try {
      await reviewWord(word.id, rating);
      setRevealed(false);
      setIndex((current) => current + 1);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-neutral-400">
        <span className="font-medium">
          {index + 1} / {queue.length}
        </span>
        <Link
          href="/dashboard"
          className="underline hover:text-black dark:hover:text-white"
        >
          বন্ধ করো
        </Link>
      </div>

      <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {word.term}
        </h1>
        {word.pronunciation && (
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {word.pronunciation}
          </p>
        )}
        <SpeakButton text={word.term} />
        {revealed ? (
          <div className="mt-2 flex flex-col gap-2">
            {word.partOfSpeech && (
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                {word.partOfSpeech}
              </p>
            )}
            <p className="text-xl font-medium text-gray-800 dark:text-neutral-100">
              {word.meaning}
            </p>
            {word.example && (
              <p className="text-sm italic text-gray-600 dark:text-neutral-400">
                &ldquo;{word.example}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-2 rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            উত্তর দেখো
          </button>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ratings.map((rating) => (
            <button
              key={rating.value}
              disabled={saving}
              onClick={() => rate(rating.value)}
              className={`rounded-lg px-3 py-3 text-sm font-semibold transition disabled:opacity-50 ${rating.className}`}
            >
              {rating.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
