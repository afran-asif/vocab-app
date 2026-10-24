import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SpeakButton from "@/components/SpeakButton";

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
              { tags: { has: query } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          আমার শব্দ ({words.length})
        </h1>
        <Link
          href="/dashboard/words/new"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          + নতুন শব্দ
        </Link>
      </div>

      <form action="/dashboard/words" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="শব্দ, অর্থ বা tag খোঁজো"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-black focus:outline-hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-white"
        />
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Search
        </button>
      </form>

      {words.length === 0 ? (
        <p className="py-8 text-center text-gray-600 dark:text-neutral-400">
          এখনো কোনো শব্দ নেই। প্রথম শব্দটা যোগ করো।
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-xs dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/60">
          {words.map((word) => (
            <li key={word.id} className="flex flex-col gap-1.5 px-4 py-3.5">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {word.term}
                </span>
                {word.partOfSpeech && (
                  <span className="text-xs font-medium text-gray-500 dark:text-neutral-400">
                    {word.partOfSpeech}
                  </span>
                )}
                {word.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
                <SpeakButton text={word.term} className="ml-auto" />
              </div>
              <p className="text-sm text-gray-700 dark:text-neutral-300">
                {word.meaning}
              </p>
              {word.example && (
                <p className="text-sm italic text-gray-500 dark:text-neutral-400">
                  {word.example}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
