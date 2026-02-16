"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  School,
  MapPin,
  RefreshCw,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth";

const navItems = [
  {
    label: "TAM Overview",
    href: "/dashboard",
    icon: BarChart3,
    adminOnly: false,
  },
  {
    label: "Schools",
    href: "/dashboard/schools",
    icon: School,
    adminOnly: false,
  },
  {
    label: "Regions",
    href: "/dashboard/regions",
    icon: MapPin,
    adminOnly: false,
  },
  {
    label: "CSV Upload",
    href: "/dashboard/schools/upload",
    icon: Upload,
    adminOnly: true,
  },
  {
    label: "AC Sync",
    href: "/dashboard/sync",
    icon: RefreshCw,
    adminOnly: true,
  },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-lg font-bold">The Ear Academy</h1>
        <p className="text-xs text-muted-foreground">Sales Dashboard</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || role === "admin")
          .map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
