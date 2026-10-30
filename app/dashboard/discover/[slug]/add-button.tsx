"use client";

import { useState, useTransition } from "react";
import { addDeckWords } from "../actions";

type Props = {
  deckSlug: string;
  deckWordId?: string;
  label: string;
  primary?: boolean;
};

export default function AddButton({ deckSlug, deckWordId, label, primary }: Props) {
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
        {pending ? "..." : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}