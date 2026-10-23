"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { scheduleNext, type ReviewOutcome } from "@/lib/srs";

const RATINGS: ReviewOutcome[] = ["AGAIN", "HARD", "GOOD", "EASY"];

export async function reviewWord(wordId: string, rating: ReviewOutcome) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!RATINGS.includes(rating)) {
    throw new Error("Invalid rating");
  }

  const word = await prisma.word.findFirst({
    where: { id: wordId, userId: session.user.id },
  });

  if (!word) {
    throw new Error("Word not found");
  }

  const next = scheduleNext(
    { ease: word.ease, interval: word.interval, repetitions: word.repetitions },
    rating,
  );

  const now = new Date();

  await prisma.$transaction([
    prisma.word.update({
      where: { id: word.id },
      data: {
        ease: next.ease,
        interval: next.interval,
        repetitions: next.repetitions,
        dueAt: next.dueAt,
        lastReviewedAt: now,
      },
    }),
    prisma.reviewLog.create({
      data: {
        wordId: word.id,
        userId: session.user.id,
        rating,
        intervalDays: next.interval,
        easeAfter: next.ease,
      },
    }),
  ]);

  revalidatePath("/dashboard");
}