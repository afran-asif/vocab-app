"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { lookupWord } from "@/lib/dictionary";

// On-demand: generate and cache word details for a DeckWord that has no meaning yet.
// Returns the updated DeckWord data.
export async function generateDeckWordDetails(deckWordId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const deckWord = await prisma.deckWord.findUnique({ where: { id: deckWordId } });
  if (!deckWord) return null;

  // Already has details
  if (deckWord.meaning && deckWord.meaningBn) return deckWord;

  const result = await lookupWord(deckWord.term);
  if (!result) return deckWord; // couldn't generate, return as-is

  const updated = await prisma.deckWord.update({
    where: { id: deckWordId },
    data: {
      meaning: result.meaning,
      meaningBn: result.meaningBn ?? "",
      example: result.example || null,
      partOfSpeech: result.partOfSpeech || null,
      pronunciation: result.pronunciation || null,
    },
  });

  // Revalidate so the server page also reflects new data
  revalidatePath(`/dashboard/discover/${deckWord.deckId}`);

  return updated;
}

// Add one or all words from a deck to the user's word list.
// Words are added with whatever details exist — if details are missing, we generate them first.
export async function addDeckWords(deckSlug: string, deckWordId?: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const deck = await prisma.deck.findUnique({
    where: { slug: deckSlug },
    include: { words: true },
  });
  if (!deck) return { added: 0 };

  const candidates = deckWordId
    ? deck.words.filter((word) => word.id === deckWordId)
    : deck.words;

  // Skip words user already has
  const mine = await prisma.word.findMany({
    where: { userId },
    select: { term: true },
  });
  const have = new Set(mine.map((word) => word.term.toLowerCase()));
  const toAdd = candidates.filter((word) => !have.has(word.term.toLowerCase()));

  if (toAdd.length === 0) return { added: 0 };

  // For words without details, generate now (sequentially to avoid rate limits)
  const resolved = await Promise.all(
    toAdd.map(async (word) => {
      if (word.meaning && word.meaningBn) return word;
      const result = await lookupWord(word.term);
      if (!result) return word; // add with empty details if generation fails
      // Persist back to DeckWord so future users get it free
      await prisma.deckWord.update({
        where: { id: word.id },
        data: {
          meaning: result.meaning,
          meaningBn: result.meaningBn ?? "",
          example: result.example || null,
          partOfSpeech: result.partOfSpeech || null,
          pronunciation: result.pronunciation || null,
        },
      });
      return { ...word, ...result, meaningBn: result.meaningBn ?? "" };
    }),
  );

  const result = await prisma.word.createMany({
    data: resolved.map((word) => ({
      userId,
      term: word.term,
      meaning: word.meaning ?? "",
      meaningBn: word.meaningBn ?? null,
      example: word.example ?? null,
      partOfSpeech: word.partOfSpeech ?? null,
      pronunciation: word.pronunciation ?? null,
      tags: [],
    })),
    skipDuplicates: true,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/words");
  revalidatePath("/dashboard/discover");
  revalidatePath(`/dashboard/discover/${deckSlug}`);

  return { added: result.count };
}
