import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DiscoverPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [decks, myWords] = await Promise.all([
    prisma.deck.findMany({
      orderBy: { createdAt: "asc" },
      include: { words: { select: { term: true } } },
    }),
    prisma.word.findMany({
      where: { userId: session.user.id },
      select: { term: true },
    }),
  ]);

  const have = new Set(myWords.map((word) => word.term.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Discover</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
          তৈরি করা শব্দের প্যাক থেকে এক ক্লিকে নিজের তালিকায় শব্দ যোগ করো।
        </p>
      </div>

      {decks.length === 0 ? (
        <p className="text-gray-600">এখনো কোনো প্যাক নেই।</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {decks.map((deck) => {
            const total = deck.words.length;
            const added = deck.words.filter((word) =>
              have.has(word.term.toLowerCase()),
            ).length;

            return (
              <li key={deck.id}>
                <Link
                  href={`/dashboard/discover/${deck.slug}`}
                  className="flex h-full flex-col gap-2 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold">{deck.title}</h2>
                    {deck.level && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
                        {deck.level}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-neutral-400">
                    {deck.description}
                  </p>
                  <p className="mt-auto text-xs text-gray-500">
                    {added === total
                      ? `✓ সব ${total}টা যোগ করা হয়েছে`
                      : `${added}/${total} যোগ করা হয়েছে`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}