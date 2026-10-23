"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createWord, type WordFormState } from "../actions";

const initialState: WordFormState = { error: "" };

export default function NewWordPage() {
  const [state, formAction, pending] = useActionState(createWord, initialState);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">নতুন শব্দ</h1>
        <Link href="/dashboard/words" className="text-sm underline">← সব শব্দ</Link>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input name="term" required placeholder="Word" className="rounded border px-3 py-2" />
        <input name="pronunciation" placeholder="Pronunciation (optional)" className="rounded border px-3 py-2" />
        <input name="partOfSpeech" placeholder="Part of speech (noun, verb...)" className="rounded border px-3 py-2" />
        <textarea name="meaning" required rows={3} placeholder="Meaning" className="rounded border px-3 py-2" />
        <textarea name="example" rows={2} placeholder="Example sentence (optional)" className="rounded border px-3 py-2" />
        <input name="tags" placeholder="Tags, comma separated (optional)" className="rounded border px-3 py-2" />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button type="submit" disabled={pending} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
          {pending ? "Saving..." : "Save word"}
        </button>
      </form>
    </div>
  );
}