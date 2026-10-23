import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
        <h1 className="text-2xl font-semibold">আমার শব্দ ({words.length})</h1>
        <Link href="/dashboard/words/new" className="rounded bg-black px-3 py-2 text-sm text-white">
          + নতুন শব্দ
        </Link>
      </div>

      <form action="/dashboard/words" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="শব্দ, অর্থ বা tag খোঁজো"
          className="flex-1 rounded border px-3 py-2"
        />
        <button type="submit" className="rounded border px-3 py-2">
          Search
        </button>
      </form>

      {words.length === 0 ? (
        <p className="text-gray-600">এখনো কোনো শব্দ নেই। প্রথম শব্দটা যোগ করো।</p>
      ) : (
        <ul className="flex flex-col divide-y rounded border">
          {words.map((word) => (
            <li key={word.id} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{word.term}</span>
                {word.partOfSpeech && (
                  <span className="text-xs text-gray-500">{word.partOfSpeech}</span>
                )}
                {word.tags.map((tag) => (
                  <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-700">{word.meaning}</p>
              {word.example && (
                <p className="text-sm italic text-gray-500">{word.example}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}