import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import ThemeToggle from "@/components/ThemeToggle";
import NavLink from "@/components/NavLink";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80 sm:px-6">
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link
            href="/dashboard"
            className="text-lg font-black tracking-tight text-gray-900 transition hover:text-black dark:text-neutral-100 dark:hover:text-white sm:text-xl"
          >
            VOCAB
          </Link>
          <NavLink href="/dashboard/words">Words</NavLink>
          <NavLink href="/dashboard/review">Review</NavLink>
        </nav>
        <div className="flex items-center gap-2.5 sm:gap-4 text-sm">
          <span className="hidden text-gray-600 dark:text-neutral-400 md:inline">
            {session.user.email}
          </span>
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-gray-500 underline transition hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
