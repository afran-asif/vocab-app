import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import CreateDeckForm from "./create-deck-form";

export default async function AdminDecksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isAdmin(session.user.email)) redirect("/dashboard");

  const decks = await prisma.deck.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { words: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin: প্যাক</h1>

      <ul className="flex flex-col divide-y rounded border">
        {decks.map((deck) => (
          <li key={deck.id}>
            <Link
              href={`/dashboard/admin/decks/${deck.slug}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-900"
            >
              <span className="font-medium">{deck.title}</span>
              <span className="text-sm text-gray-500">{deck._count.words} টা শব্দ</span>
            </Link>
          </li>
        ))}
      </ul>

      <CreateDeckForm />
    </div>
  );
}