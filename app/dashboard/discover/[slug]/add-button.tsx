"use client";

import { useState, useTransition } from "react";
import { addDeckWords, generateDeckWordDetails } from "../actions";
import SpeakButton from "@/components/SpeakButton";

type DeckWordData = {
  id: string;
  term: string;
  meaning: string | null;
  meaningBn: string | null;
  example: string | null;
  partOfSpeech: string | null;
  pronunciation: string | null;
};

// A single word row that shows details on expand, generating them on-demand if needed.
export function WordCard({
  word,
  deckSlug,
  alreadyAdded,
}: {
  word: DeckWordData;
  deckSlug: string;
  alreadyAdded: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<DeckWordData>(word);
  const [generating, startGenerate] = useTransition();
  const [adding, startAdd] = useTransition();
  const [added, setAdded] = useState(alreadyAdded);
  const [error, setError] = useState("");

  const hasDetails = Boolean(details.meaning && details.meaningBn);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    // Trigger generation if opening and no details yet
    if (next && !hasDetails && !generating) {
      startGenerate(async () => {
        try {
          const updated = await generateDeckWordDetails(word.id);
          if (updated) setDetails(updated as DeckWordData);
        } catch {
          // silently fail — user can still add the word
        }
      });
    }
  }

  function handleAdd() {
    setError("");
    startAdd(async () => {
      try {
        await addDeckWords(deckSlug, word.id);
        setAdded(true);
      } catch {
        setError("যোগ করা গেল না, আবার চেষ্টা করো");
      }
    });
  }

  return (
    <li className="border-b last:border-b-0 dark:border-neutral-800">
      {/* Header row — always visible */}
      <div
        className="flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-900/40"
        onClick={handleToggle}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {details.term}
            </span>
            {details.pronunciation && (
              <span className="text-xs text-gray-500 dark:text-neutral-400">
                /{details.pronunciation}/
              </span>
            )}
            {details.partOfSpeech && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                {details.partOfSpeech}
              </span>
            )}
          </div>

          {/* Preview: show meaningBn even when collapsed if available */}
          {!open && details.meaningBn && (
            <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
              {details.meaningBn}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <SpeakButton text={details.term} />
          {added ? (
            <span className="text-sm text-green-700 dark:text-green-400">✓ যোগ করা আছে</span>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleAdd(); }}
              disabled={adding}
              className="rounded border px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700"
            >
              {adding ? "..." : "+ Add"}
            </button>
          )}
          <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expandable details — same style as words page */}
      {open && (
        <div className="flex flex-col gap-0.5 border-t bg-gray-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/30">
          {generating && !hasDetails ? (
            <div className="flex items-center gap-2 py-1 text-sm text-gray-400">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
              তৈরি হচ্ছে...
            </div>
          ) : hasDetails ? (
            <div className="flex flex-col gap-1.5 text-sm">
              {details.meaningBn && (
                <p>
                  <span className="font-semibold text-gray-500 dark:text-neutral-400">অর্থ: </span>
                  <span className="font-semibold text-gray-900 dark:text-neutral-100">{details.meaningBn}</span>
                </p>
              )}
              {details.meaning && (
                <p className="text-gray-600 dark:text-neutral-400">
                  <span className="font-semibold text-gray-500 dark:text-neutral-400">English: </span>
                  {details.meaning}
                </p>
              )}
              {details.example && (
                <p className="text-gray-500 dark:text-neutral-500">
                  <span className="font-semibold not-italic text-gray-500 dark:text-neutral-400">বাক্য: </span>
                  <span className="italic">&ldquo;{details.example}&rdquo;</span>
                </p>
              )}
              {details.pronunciation && (
                <p className="text-gray-400 dark:text-neutral-500">
                  <span className="font-semibold text-gray-500 dark:text-neutral-400">উচ্চারণ: </span>
                  {details.pronunciation}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Details পাওয়া যায়নি।</p>
          )}
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      )}
    </li>
  );
}

// "Add all" button for the deck header
type AddButtonProps = {
  deckSlug: string;
  deckWordId?: string;
  label: string;
  primary?: boolean;
};

export default function AddButton({ deckSlug, deckWordId, label, primary }: AddButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      try {
        await addDeckWords(deckSlug, deckWordId);
      } catch {
        setError("যোগ করা গেল না, আবার চেষ্টা করো");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={
          primary
            ? "rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
            : "rounded border px-3 py-2 text-sm disabled:opacity-50"
        }
      >
        {pending ? "তৈরি হচ্ছে..." : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
