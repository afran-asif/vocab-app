import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SpeakButton from "@/components/SpeakButton";
import AddButton from "./add-button";

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

      <ul className="flex flex-col divide-y rounded border">
        {deck.words.map((word) => {
          const added = have.has(word.term.toLowerCase());

          return (
            <li key={word.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{word.term}</span>
                  {word.partOfSpeech && (
                    <span className="text-xs text-gray-500">{word.partOfSpeech}</span>
                  )}
                  <SpeakButton text={word.term} />
                </div>
                <p className="text-sm text-gray-700 dark:text-neutral-300">
                  {word.meaningBn}
                </p>
                <p className="text-sm text-gray-500">{word.meaning}</p>
                {word.example && (
                  <p className="text-sm italic text-gray-500">{word.example}</p>
                )}
              </div>

              {added ? (
                <span className="shrink-0 text-sm text-green-700 dark:text-green-400">
                  ✓ যোগ করা আছে
                </span>
              ) : (
                <AddButton deckSlug={deck.slug} deckWordId={word.id} label="+ Add" />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}