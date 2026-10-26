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
  meaningBn?: string | null;
  example: string | null;
  pronunciation: string | null;
  partOfSpeech: string | null;
};

type RatingOption = {
  value: ReviewOutcome;
  icon: string;
  label: string;
  hint: string;
  className: string;
};

const ratings: RatingOption[] = [
  {
    value: "AGAIN",
    icon: "❌",
    label: "মনে নেই",
    hint: "১০ মিনিট পর আবার",
    className:
      "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50 dark:hover:bg-red-900/50",
  },
  {
    value: "HARD",
    icon: "🤔",
    label: "কষ্টে পেরেছি",
    hint: "মনে করতে কঠিন লেগেছে",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 dark:hover:bg-amber-900/50",
  },
  {
    value: "GOOD",
    icon: "👍",
    label: "মনে আছে",
    hint: "ঠিকঠাক মনে পড়েছে",
    className:
      "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/50 dark:hover:bg-green-900/50",
  },
  {
    value: "EASY",
    icon: "⚡",
    label: "একদম সহজ",
    hint: "মুখস্থ, কোনো কষ্ট হয়নি",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50 dark:hover:bg-blue-900/50",
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
          মোট {queue.length} টি শব্দ সফলভাবে review করেছ।
        </p>
        <Link
          href="/dashboard"
          className="rounded-lg bg-black px-5 py-2.5 font-medium text-white shadow-xs transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Dashboard-এ ফিরে যাও
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
        <span className="font-semibold text-gray-800 dark:text-neutral-200">
          শব্দ {index + 1} / {queue.length}
        </span>
        <Link
          href="/dashboard"
          className="text-xs underline hover:text-black dark:hover:text-white"
        >
          সেশন বন্ধ করো
        </Link>
      </div>

      {/* Flashcard container */}
      <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {word.term}
        </h1>

        {word.pronunciation && (
          <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">
            /{word.pronunciation}/
          </p>
        )}

        <SpeakButton text={word.term} />

        {revealed ? (
          <div className="mt-4 flex flex-col gap-2.5 border-t border-gray-100 pt-4 dark:border-neutral-800/80">
            {word.partOfSpeech && (
              <span className="self-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                {word.partOfSpeech}
              </span>
            )}

            {word.meaningBn && (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {word.meaningBn}
              </p>
            )}

            {word.meaning && (
              <p className="text-base text-gray-600 dark:text-neutral-300">
                {word.meaning}
              </p>
            )}

            {word.example && (
              <p className="mt-1 text-sm italic text-gray-500 dark:text-neutral-400">
                &ldquo;{word.example}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-4 rounded-xl border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-800 shadow-xs transition hover:bg-gray-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            উত্তর দেখো
          </button>
        )}
      </div>

      {/* Answer rating buttons */}
      {revealed && (
        <div className="flex flex-col gap-2.5">
          <p className="text-center text-xs font-medium text-gray-500 dark:text-neutral-400">
            শব্দটি তোমার কেমন মনে ছিল? রেটিং নির্বাচন করো:
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {ratings.map((rating) => (
              <button
                key={rating.value}
                type="button"
                disabled={saving}
                onClick={() => rate(rating.value)}
                className={`group flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center transition-all duration-150 active:scale-95 disabled:opacity-50 ${rating.className}`}
              >
                <div className="flex items-center gap-1.5 text-sm font-bold sm:text-base">
                  <span>{rating.icon}</span>
                  <span>{rating.label}</span>
                </div>
                <span className="text-[11px] leading-tight opacity-75 sm:text-xs">
                  {rating.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
