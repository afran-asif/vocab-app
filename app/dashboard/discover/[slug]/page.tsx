import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AddButton, { WordCard } from "./add-button";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [deck, myWords] = await Promise.all([
    prisma.deck.findUnique({
      where: { slug },
      include: { words: { orderBy: { term: "asc" } } },
    }),
    prisma.word.findMany({
      where: { userId: session.user.id },
      select: { term: true },
    }),
  ]);

  if (!deck) notFound();

  const have = new Set(myWords.map((word) => word.term.toLowerCase()));
  const remaining = deck.words.filter((word) => !have.has(word.term.toLowerCase()));
  const generatedCount = deck.words.filter((w) => w.meaning && w.meaningBn).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/discover" className="text-sm underline">
          ← সব প্যাক
        </Link>
        {deck.level && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
            {deck.level}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{deck.title}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
            {deck.description}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-neutral-500">
            {deck.words.length}টি শব্দ
            {generatedCount < deck.words.length && (
              <> · {deck.words.length - generatedCount}টির details এখনো তৈরি হয়নি (click করলে হবে)</>
            )}
          </p>
        </div>
        {remaining.length > 0 ? (
          <AddButton
            deckSlug={deck.slug}
            label={`সব যোগ করো (${remaining.length})`}
            primary
          />
        ) : (
          <span className="shrink-0 text-sm text-green-700 dark:text-green-400">
            ✓ সব যোগ করা হয়েছে
          </span>
        )}
      </div>

      <ul className="flex flex-col divide-y rounded border dark:border-neutral-800">
        {deck.words.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            deckSlug={deck.slug}
            alreadyAdded={have.has(word.term.toLowerCase())}
          />
        ))}
      </ul>
    </div>
  );
}
