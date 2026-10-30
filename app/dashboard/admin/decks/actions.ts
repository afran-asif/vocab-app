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

// Bulk add: just save the terms, no AI call.
// Details are generated on-demand when users first view/add the word.
export async function bulkAddDeckTerms(
  deckSlug: string,
  rawTerms: string[],
): Promise<{ added: number; skipped: number; errors: string[] }> {
  await requireAdmin();

  const deck = await prisma.deck.findUnique({ where: { slug: deckSlug } });
  if (!deck) return { added: 0, skipped: 0, errors: ["Deck পাওয়া যায়নি"] };

  // Deduplicate and validate
  const terms = Array.from(
    new Set(
      rawTerms
        .map((t) => t.trim().toLowerCase())
        .filter((t) => /^[a-z][a-z' -]{0,39}$/.test(t)),
    ),
  );

  if (terms.length === 0) return { added: 0, skipped: 0, errors: ["কোনো valid শব্দ পাওয়া যায়নি"] };

  // Find already-existing terms in one query
  const existing = await prisma.deckWord.findMany({
    where: { deckId: deck.id, term: { in: terms } },
    select: { term: true },
  });
  const existingSet = new Set(existing.map((w) => w.term));
  const newTerms = terms.filter((t) => !existingSet.has(t));

  if (newTerms.length > 0) {
    await prisma.deckWord.createMany({
      data: newTerms.map((term) => ({ deckId: deck.id, term })),
      skipDuplicates: true,
    });
  }

  revalidatePath(`/dashboard/admin/decks/${deckSlug}`);
  revalidatePath(`/dashboard/discover/${deckSlug}`);
  revalidatePath("/dashboard/discover");

  return { added: newTerms.length, skipped: existingSet.size, errors: [] };
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
