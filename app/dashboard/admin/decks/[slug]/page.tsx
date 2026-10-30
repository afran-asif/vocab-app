import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import AddWordsForm, { DeleteDeckWordButton } from "./add-words-form";

export default async function AdminDeckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isAdmin(session.user.email)) redirect("/dashboard");

  const deck = await prisma.deck.findUnique({
    where: { slug },
    include: { words: { orderBy: { term: "asc" } } },
  });
  if (!deck) notFound();

  const generatedCount = deck.words.filter((w) => w.meaning && w.meaningBn).length;
  const pendingCount = deck.words.length - generatedCount;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/admin/decks" className="text-sm underline">
        ← সব প্যাক
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{deck.title}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
          {deck.description} · মোট {deck.words.length}টি শব্দ
        </p>
        {pendingCount > 0 && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            ⏳ {pendingCount}টির details এখনো generate হয়নি — user click করলে তৈরি হবে
          </p>
        )}
      </div>

      <AddWordsForm deckSlug={deck.slug} />

      {deck.words.length > 0 && (
        <ul className="flex flex-col divide-y rounded border dark:border-neutral-800">
          {deck.words.map((word) => (
            <li key={word.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium">{word.term}</span>
                  {word.partOfSpeech && (
                    <span className="text-xs text-gray-500">{word.partOfSpeech}</span>
                  )}
                  {!word.meaning && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                      pending
                    </span>
                  )}
                </div>
                {word.meaningBn && <p className="text-sm">{word.meaningBn}</p>}
                {word.meaning && <p className="text-sm text-gray-500">{word.meaning}</p>}
              </div>
              <DeleteDeckWordButton
                deckSlug={deck.slug}
                deckWordId={word.id}
                term={word.term}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
