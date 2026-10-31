"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Page-e check thakleo prottek action-e abar check lagbe,
// karon action-gulo direct call kora jay
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isAdmin(session.user.email)) redirect("/dashboard");
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type DeckFormState = { error: string };

export async function createDeck(
  _prevState: DeckFormState,
  formData: FormData,
): Promise<DeckFormState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const slug = slugify(title);

  if (!title || !description) return { error: "Title আর description দুটোই লাগবে" };
  if (!slug) return { error: "Title-এ অন্তত কিছু English অক্ষর বা সংখ্যা দাও" };

  const exists = await prisma.deck.findUnique({ where: { slug } });
  if (exists) return { error: "এই নামে প্যাক আগেই আছে" };

  await prisma.deck.create({
    data: { slug, title, description, level: level || null },
  });

  revalidatePath("/dashboard/admin/decks");
  revalidatePath("/dashboard/discover");
  redirect(`/dashboard/admin/decks/${slug}`);
}

export type AddWordResult = {
  status: "added" | "exists" | "skipped" | "error";
  message?: string;
};

export type DeckWordInput = {
  term: string;
  meaning?: string | null;
  meaningBn?: string | null;
  example?: string | null;
  partOfSpeech?: string | null;
  pronunciation?: string | null;
};

// Bulk add words to a deck — supports full details from JSON or just terms
export async function bulkAddDeckWords(
  deckSlug: string,
  wordInputs: DeckWordInput[],
): Promise<{ added: number; updated: number; skipped: number; errors: string[] }> {
  await requireAdmin();

  const deck = await prisma.deck.findUnique({ where: { slug: deckSlug } });
  if (!deck) return { added: 0, updated: 0, skipped: 0, errors: ["Deck পাওয়া যায়নি"] };

  // Deduplicate and validate
  const cleanMap = new Map<string, DeckWordInput>();
  for (const input of wordInputs) {
    const term = input.term?.trim().toLowerCase();
    if (term && /^[a-z][a-z' -]{0,39}$/.test(term) && !cleanMap.has(term)) {
      cleanMap.set(term, {
        term,
        meaning: input.meaning?.trim() || null,
        meaningBn: input.meaningBn?.trim() || null,
        example: input.example?.trim() || null,
        partOfSpeech: input.partOfSpeech?.trim() || null,
        pronunciation: input.pronunciation?.trim() || null,
      });
    }
  }

  const terms = Array.from(cleanMap.keys());
  if (terms.length === 0) {
    return { added: 0, updated: 0, skipped: 0, errors: ["কোনো valid শব্দ পাওয়া যায়নি"] };
  }

  // Find already-existing terms
  const existing = await prisma.deckWord.findMany({
    where: { deckId: deck.id, term: { in: terms } },
  });
  const existingMap = new Map(existing.map((w) => [w.term, w]));

  const toCreate: DeckWordInput[] = [];
  const toUpdate: { id: string; data: Partial<DeckWordInput> }[] = [];

  for (const [term, data] of cleanMap.entries()) {
    const exist = existingMap.get(term);
    if (!exist) {
      toCreate.push(data);
    } else {
      // If existing word lacked details, update with incoming info
      const shouldUpdate =
        (!exist.meaningBn && data.meaningBn) ||
        (!exist.meaning && data.meaning) ||
        (!exist.example && data.example) ||
        (!exist.partOfSpeech && data.partOfSpeech) ||
        (!exist.pronunciation && data.pronunciation);

      if (shouldUpdate) {
        toUpdate.push({
          id: exist.id,
          data: {
            meaningBn: data.meaningBn || exist.meaningBn,
            meaning: data.meaning || exist.meaning,
            example: data.example || exist.example,
            partOfSpeech: data.partOfSpeech || exist.partOfSpeech,
            pronunciation: data.pronunciation || exist.pronunciation,
          },
        });
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.deckWord.createMany({
      data: toCreate.map((item) => ({
        deckId: deck.id,
        term: item.term,
        meaning: item.meaning || null,
        meaningBn: item.meaningBn || null,
        example: item.example || null,
        partOfSpeech: item.partOfSpeech || null,
        pronunciation: item.pronunciation || null,
      })),
      skipDuplicates: true,
    });
  }

  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map((u) =>
        prisma.deckWord.update({
          where: { id: u.id },
          data: u.data,
        }),
      ),
    );
  }

  revalidatePath(`/dashboard/admin/decks/${deckSlug}`);
  revalidatePath(`/dashboard/discover/${deckSlug}`);
  revalidatePath("/dashboard/discover");

  const skipped = existing.length - toUpdate.length;
  return { added: toCreate.length, updated: toUpdate.length, skipped, errors: [] };
}

// Bulk add by terms only (backward compatible)
export async function bulkAddDeckTerms(
  deckSlug: string,
  rawTerms: string[],
): Promise<{ added: number; skipped: number; errors: string[] }> {
  const result = await bulkAddDeckWords(
    deckSlug,
    rawTerms.map((term) => ({ term })),
  );
  return { added: result.added, skipped: result.skipped, errors: result.errors };
}

export async function deleteDeckWord(deckSlug: string, deckWordId: string) {
  await requireAdmin();

  await prisma.deckWord.deleteMany({
    where: { id: deckWordId, deck: { slug: deckSlug } },
  });

  revalidatePath(`/dashboard/admin/decks/${deckSlug}`);
  revalidatePath(`/dashboard/discover/${deckSlug}`);
  revalidatePath("/dashboard/discover");
}
