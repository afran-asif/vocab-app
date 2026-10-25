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
        if (!window.confirm(`"${term}" শব্দটা মুছে ফেলবে?`)) return;
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
        className="rounded border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
        {pending ? "..." : "Remove"}
        </button>
    );
}
