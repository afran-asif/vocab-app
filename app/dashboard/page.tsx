import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="text-gray-600">
        এখনো কোনো word যোগ করা হয়নি — Phase 5-এ এই জায়গায় word list আর review আসবে।
      </p>
    </div>
  );
}