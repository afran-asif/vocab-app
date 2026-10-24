import Link from "next/link";
import { auth } from "@/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Vocab App
        </h1>
        <p className="text-gray-600 dark:text-neutral-400">
          ইংরেজি শব্দ শেখো, spaced repetition দিয়ে মনে রাখো।
        </p>
        <div className="flex gap-3">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-black px-5 py-2.5 font-medium text-white shadow-xs transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-black px-5 py-2.5 font-medium text-white shadow-xs transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
