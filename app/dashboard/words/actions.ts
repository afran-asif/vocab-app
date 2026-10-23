"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { wordSchema } from "@/lib/validations/word";

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
    example: formData.get("example"),
    partOfSpeech: formData.get("partOfSpeech"),
    pronunciation: formData.get("pronunciation"),
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { term, meaning, example, partOfSpeech, pronunciation, tags } = parsed.data;
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
      meaning,
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