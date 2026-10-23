import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcStreak } from "@/lib/streak";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const streakSince = new Date(now);
  streakSince.setDate(streakSince.getDate() - 90);

  const [total, due, reviewedToday, recentLogs] = await Promise.all([
    prisma.word.count({ where: { userId } }),
    prisma.word.count({ where: { userId, dueAt: { lte: now } } }),
    prisma.reviewLog.count({
      where: { userId, reviewedAt: { gte: startOfDay } },
    }),
    prisma.reviewLog.findMany({
      where: { userId, reviewedAt: { gte: streakSince } },
      select: { reviewedAt: true },
    }),
  ]);

  const streak = calcStreak(recentLogs.map((log) => log.reviewedAt), now);

  const stats = [
    { label: "মোট শব্দ", value: total },
    { label: "আজ due", value: due },
    { label: "আজ review", value: reviewedToday },
    { label: "Streak (দিন)", value: streak },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome{session.user.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-sm text-gray-600">আজকের অগ্রগতি এক নজরে</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border px-4 py-3">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {due > 0 ? (
          <Link
            href="/dashboard/review"
            className="rounded bg-black px-4 py-2 text-white"
          >
            Review শুরু করো ({due})
          </Link>
        ) : (
          <Link
            href="/dashboard/words/new"
            className="rounded bg-black px-4 py-2 text-white"
          >
            নতুন শব্দ যোগ করো
          </Link>
        )}
        <Link
          href="/dashboard/words"
          className="rounded border px-4 py-2"
        >
          আমার শব্দ
        </Link>
      </div>
    </div>
  );
}