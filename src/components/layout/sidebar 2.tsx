"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  StickyNote,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  Shield,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";

const mainNav = [
  { label: "דשבורד", href: "/dashboard", icon: LayoutDashboard },
  { label: "קורסים", href: "/courses", icon: BookOpen },
  { label: "מחברת", href: "/notebook", icon: StickyNote },
  { label: "לוח שנה", href: "/calendar", icon: Calendar },
  { label: "שאלות", href: "/qa", icon: HelpCircle },
  { label: "צ׳אט", href: "/chat", icon: MessageSquare },
  { label: "פרופיל", href: "/profile", icon: User },
];

const adminNav = [
  { label: "ניהול", href: "/admin/courses", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed top-0 right-0 z-40 h-screen flex flex-col border-l border-surface-border bg-surface/50 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <Spotlight size={200} color="rgba(0, 0, 255, 0.08)" />

      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-surface-border">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="BLDR"
            width={collapsed ? 36 : 100}
            height={collapsed ? 36 : 40}
            className="object-contain transition-all duration-300"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {mainNav.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative",
                isActive
                  ? "text-white font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-light/50 font-normal"
              )}
            >
              {/* Active background glow */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-primary/12 border border-primary/25"
                  style={{
                    boxShadow: "0 0 20px rgba(0, 0, 255, 0.1), inset 0 0 20px rgba(0, 0, 255, 0.05)",
                  }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 relative z-10",
                  isActive ? "text-primary-light" : "text-text-muted group-hover:text-text-secondary"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-3 border-t border-surface-border" />

        {adminNav.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative",
                isActive
                  ? "text-white font-bold"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-light/50 font-normal"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavAdmin"
                  className="absolute inset-0 rounded-xl bg-primary/12 border border-primary/25"
                  style={{
                    boxShadow: "0 0 20px rgba(0, 0, 255, 0.1), inset 0 0 20px rgba(0, 0, 255, 0.05)",
                  }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 relative z-10",
                  isActive ? "text-primary-light" : "text-text-muted group-hover:text-text-secondary"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-surface-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full h-9 rounded-xl text-text-muted hover:text-text-secondary hover:bg-surface-light/50 transition-colors"
        >
          {collapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
