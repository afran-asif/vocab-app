"use client";

import { useActionState } from "react";
import { createDeck, type DeckFormState } from "./actions";

const initialState: DeckFormState = { error: "" };

export default function CreateDeckForm() {
  const [state, formAction, pending] = useActionState(createDeck, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-semibold">নতুন প্যাক</h2>
      <input
        name="title"
        required
        placeholder="Title (English-এ, যেমন: Travel Words)"
        className="rounded border px-3 py-2"
      />
      <textarea
        name="description"
        required
        rows={2}
        placeholder="বর্ণনা (বাংলায়)"
        className="rounded border px-3 py-2"
      />
      <input
        name="level"
        placeholder="Level (optional, যেমন: Beginner)"
        className="rounded border px-3 py-2"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creating..." : "প্যাক তৈরি করো"}
      </button>
    </form>
  );
}