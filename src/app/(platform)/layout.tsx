"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { NextEventBanner } from "@/components/layout/next-event-banner";

const mockEvent = {
  title: "Office Hours",
  date: "יום שלישי, 18 מרץ",
  time: "19:00",
  hasRsvped: false,
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#050510" }}>
      <Sidebar />
      <main style={{ marginRight: "240px", minHeight: "100vh", paddingBottom: "64px" }}>
        {children}
      </main>
      <NextEventBanner event={mockEvent} />
    </div>
  );
}
