import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ReviewSession from "./review-session";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const dueWords = await prisma.word.findMany({
    where: {
      userId: session.user.id,
      dueAt: { lte: new Date() },
    },
    orderBy: { dueAt: "asc" },
    take: 20,
    select: {
      id: true,
      term: true,
      meaning: true,
      example: true,
      pronunciation: true,
      partOfSpeech: true,
    },
  });

  if (dueWords.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">এখন review করার মতো কিছু নেই</h1>
        <p className="text-gray-600">নতুন শব্দ যোগ করো, অথবা কাল আবার এসো।</p>
        <Link href="/dashboard/words/new" className="rounded bg-black px-4 py-2 text-white">
          শব্দ যোগ করো
        </Link>
      </div>
    );
  }

  return <ReviewSession words={dueWords} />;
}