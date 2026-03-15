"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Palette,
  Code,
  Megaphone,
  Users,
  ArrowRight,
} from "lucide-react";

const adminNav = [
  { label: "סקירה כללית", href: "/admin", icon: LayoutDashboard },
  { label: "ניהול תוכן", href: "/admin/courses", icon: BookOpen },
  { label: "שאלות ותשובות", href: "/admin/qa", icon: HelpCircle },
  { label: "עדכונים", href: "/admin/activity-feed", icon: Megaphone },
  { label: "משתמשים", href: "/admin/users", icon: Users },
  { label: "מיתוג", href: "/admin/theme", icon: Palette },
  { label: "API Docs", href: "/admin/api-docs", icon: Code },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar */}
      <aside className="fixed top-0 right-0 z-40 h-screen w-[260px] flex flex-col border-l border-surface-border bg-surface/50 backdrop-blur-xl">
        <div className="flex items-center justify-between h-16 px-4 border-b border-surface-border">
          <Image src="/logo.png" alt="BLDR" width={80} height={32} />
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary"
          >
            חזרה לאתר
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="px-4 py-3 border-b border-surface-border">
          <p className="text-xs text-text-muted">פאנל ניהול</p>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary/12 text-white font-bold border border-primary/25"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-light/50 font-normal"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0",
                    isActive ? "text-primary-light" : "text-text-muted"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="mr-[260px] flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
