import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold">Vocab App</h1>
      <p className="text-gray-600">ইংরেজি শব্দ শেখো, spaced repetition দিয়ে মনে রাখো।</p>
      <div className="flex gap-3">
        {session?.user ? (
          <Link href="/dashboard" className="rounded bg-black px-4 py-2 text-white">Dashboard</Link>
        ) : (
          <>
            <Link href="/login" className="rounded border px-4 py-2">Login</Link>
            <Link href="/register" className="rounded bg-black px-4 py-2 text-white">Register</Link>
          </>
        )}
      </div>
    </main>
  );
}