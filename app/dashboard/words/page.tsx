import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SpeakButton from "@/components/SpeakButton";
import DeleteWordButton from "./delete-word-button";

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const session = await auth();

  if (!session?.user) redirect("/login");

  const words = await prisma.word.findMany({
    where: {
      userId: session.user.id,
      ...(query
        ? {
            OR: [
              { term: { contains: query, mode: "insensitive" } },
              { meaning: { contains: query, mode: "insensitive" } },
              { meaningBn: { contains: query, mode: "insensitive" } },
              { tags: { has: query } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header row: title and add button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          আমার শব্দ ({words.length})
        </h1>
        <Link
          href="/dashboard/words/new"
          className="inline-flex items-center rounded-lg bg-black px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 sm:text-sm"
        >
          + নতুন শব্দ
        </Link>
      </div>

      {/* Search form */}
      <form action="/dashboard/words" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="শব্দ, অর্থ বা tag খোঁজো"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-black focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-white"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-95 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Search
        </button>
      </form>

      {/* Word List */}
      {words.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-neutral-800">
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            {query
              ? `"${query}" এর সাথে মিলে এমন কোনো শব্দ পাওয়া যায়নি।`
              : "এখনো কোনো শব্দ নেই। প্রথম শব্দটা যোগ করো।"}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-xs dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/60">
          {words.map((word) => (
            <li
              key={word.id}
              className="flex flex-col gap-2 p-3.5 sm:p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-900/40"
            >
              {/* Top Row: Word & Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
                  <span className="text-base font-bold text-gray-900 dark:text-white sm:text-lg break-words">
                    {word.term}
                  </span>
                  {word.pronunciation && (
                    <span className="text-xs text-gray-500 dark:text-neutral-400">
                      /{word.pronunciation}/
                    </span>
                  )}
                  {word.partOfSpeech && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {word.partOfSpeech}
                    </span>
                  )}
                </div>

                {/* Actions: Speak & Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <SpeakButton text={word.term} />
                  <DeleteWordButton wordId={word.id} term={word.term} />
                </div>
              </div>

              {/* Meanings */}
              <div className="flex flex-col gap-0.5">
                {word.meaningBn && (
                  <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100 sm:text-base">
                    {word.meaningBn}
                  </p>
                )}
                {word.meaning && (
                  <p className="text-xs text-gray-600 dark:text-neutral-400 sm:text-sm">
                    {word.meaning}
                  </p>
                )}
              </div>

              {/* Example sentence */}
              {word.example && (
                <p className="text-xs italic text-gray-500 dark:text-neutral-500">
                  &ldquo;{word.example}&rdquo;
                </p>
              )}

              {/* Tags */}
              {word.tags.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  {word.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-neutral-800 dark:text-neutral-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
