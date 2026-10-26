"use client";

import { useTransition } from "react";
import { deleteWord } from "./actions";

export default function DeleteWordButton({
  wordId,
  term,
}: {
  wordId: string;
  term: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`"${term}" শব্দটা মুছে ফেলতে চাও?`)) return;
    startTransition(async () => {
      await deleteWord(wordId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Remove ${term}`}
      title="Delete word"
      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 active:scale-95 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/60"
    >
      {pending ? (
        <span className="text-xs">...</span>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.67.028 2.488.083.009-.074.012-.15.012-.228 0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25 0 .078.003.154.012.228.818-.055 1.648-.083 2.488-.083Zm-3.5 5.25a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Zm4.25.75a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">Delete</span>
        </>
      )}
    </button>
  );
}
