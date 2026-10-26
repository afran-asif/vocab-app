"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { wordSchema } from "@/lib/validations/word";
import { lookupWord, regenerateWord } from "@/lib/dictionary";

export type WordFormState = { error: string };

export async function createWord(
  _prevState: WordFormState,
  formData: FormData,
): Promise<WordFormState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = wordSchema.safeParse({
    term: formData.get("term"),
    meaning: formData.get("meaning"),
    meaningBn: formData.get("meaningBn"),   
    example: formData.get("example"),
    partOfSpeech: formData.get("partOfSpeech"),
    pronunciation: formData.get("pronunciation"),
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { term, meaning, meaningBn, example, partOfSpeech, pronunciation, tags } = parsed.data;
  const userId = session.user.id;

  const existing = await prisma.word.findUnique({
    where: { userId_term: { userId, term } },
  });

  if (existing) {
    return { error: "এই শব্দটা আগেই যোগ করা আছে" };
  }

  await prisma.word.create({
    data: {
      userId,
      term,
      meaning: meaning ?? "",
      meaningBn: meaningBn || null,
      example: example || null,
      partOfSpeech: partOfSpeech || null,
      pronunciation: pronunciation || null,
      tags: tags
        ? tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    },
  });

  revalidatePath("/dashboard/words");
  redirect("/dashboard/words");
}

export async function lookup(term: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const clean = term.trim().slice(0, 100);
  if (!clean) return null;

  return lookupWord(clean);
}

export async function deleteWord(wordId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await prisma.word.deleteMany({
    where: { id: wordId, userId: session.user.id },
  });

  revalidatePath("/dashboard/words");
  revalidatePath("/dashboard");
}

export async function regenerate(term: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const clean = term.trim().slice(0, 100);
  if (!clean) return null;

  return regenerateWord(clean);
}