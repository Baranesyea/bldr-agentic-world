"use client";

import React from "react";
import { Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NextEventBannerProps {
  event?: {
    title: string;
    date: string;
    time: string;
    hasRsvped?: boolean;
  } | null;
}

export function NextEventBanner({ event }: NextEventBannerProps) {
  if (!event) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-surface-border">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 animate-pulse-blue">
            <Calendar className="h-4 w-4 text-primary-light" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">
              האירוע הבא: {event.title}
            </p>
            <p className="text-xs text-text-muted">
              {event.date} — {event.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!event.hasRsvped && (
            <Button size="sm" variant="default">
              אישור הגעה
            </Button>
          )}
          <Button size="sm" variant="secondary">
            <ExternalLink className="h-3.5 w-3.5" />
            הוסף ליומן
          </Button>
        </div>
      </div>
    </div>
  );
}
