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
  { value: "AGAIN", label: "আবার", className: "bg-red-100 text-red-800" },
  { value: "HARD", label: "কঠিন", className: "bg-orange-100 text-orange-800" },
  { value: "GOOD", label: "ঠিক", className: "bg-green-100 text-green-800" },
  { value: "EASY", label: "সহজ", className: "bg-blue-100 text-blue-800" },
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
        <h1 className="text-2xl font-semibold">আজকের review শেষ 🎉</h1>
        <p className="text-gray-600">{queue.length} টা শব্দ review করেছ।</p>
        <Link href="/dashboard" className="rounded bg-black px-4 py-2 text-white">
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
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {index + 1} / {queue.length}
        </span>
        <Link href="/dashboard" className="underline">
          বন্ধ করো
        </Link>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded border p-8 text-center">
        <h1 className="text-3xl font-bold">{word.term}</h1>
        {word.pronunciation && (
          <p className="text-sm text-gray-500">{word.pronunciation}</p>
        )}
        <SpeakButton text={word.term} />
        {revealed ? (
          <div className="flex flex-col gap-2">
            {word.partOfSpeech && (
              <p className="text-xs uppercase text-gray-500">{word.partOfSpeech}</p>
            )}
            <p className="text-lg">{word.meaning}</p>
            {word.example && (
              <p className="text-sm italic text-gray-600">&ldquo;{word.example}&rdquo;</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="rounded border px-4 py-2"
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
              className={`rounded px-3 py-3 text-sm font-medium disabled:opacity-50 ${rating.className}`}
            >
              {rating.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}