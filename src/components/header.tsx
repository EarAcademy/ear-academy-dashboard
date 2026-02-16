"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";
import type { Role } from "@/lib/auth";

export function Header({ role }: { role: Role }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <Badge variant={role === "admin" ? "default" : "secondary"}>
          {role}
        </Badge>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>
    </header>
  );
}
