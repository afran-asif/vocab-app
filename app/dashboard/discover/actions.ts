"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// deckWordId dile shudhu oi ekta word, na dile deck-er baki shob word
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

  // Ager-i je word user-er ache (case ignore kore) seta bad
  const mine = await prisma.word.findMany({
    where: { userId },
    select: { term: true },
  });
  const have = new Set(mine.map((word) => word.term.toLowerCase()));
  const toAdd = candidates.filter((word) => !have.has(word.term.toLowerCase()));

  if (toAdd.length === 0) return { added: 0 };

  const result = await prisma.word.createMany({
    data: toAdd.map((word) => ({
      userId,
      term: word.term,
      meaning: word.meaning,
      meaningBn: word.meaningBn,
      example: word.example,
      partOfSpeech: word.partOfSpeech,
      pronunciation: word.pronunciation,
      tags: [deck.slug],
    })),
    skipDuplicates: true,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/words");
  revalidatePath("/dashboard/discover");
  revalidatePath(`/dashboard/discover/${deckSlug}`);

  return { added: result.count };
}