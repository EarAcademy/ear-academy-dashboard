import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header role={session.role} />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
