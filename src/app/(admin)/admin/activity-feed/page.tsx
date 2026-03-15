"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Send, Megaphone, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const mockFeed = [
  { id: "1", type: "auto", trigger: "new_lesson", title: "שיעור חדש זמין: איך לכתוב CLAUDE.md", createdAt: "לפני 2 שעות" },
  { id: "2", type: "auto", trigger: "new_event", title: "אירוע חדש: Office Hours — יום שלישי", createdAt: "לפני 5 שעות" },
  { id: "3", type: "manual", trigger: "custom", title: "🔥 עדכון חשוב: גרסה חדשה של Claude Code יצאה!", createdAt: "אתמול" },
];

export default function AdminActivityFeedPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">ניהול עדכונים</h1>
        <p className="text-sm text-text-secondary mt-1">פרסם עדכונים ידניים וצפה בעדכונים אוטומטיים</p>
      </motion.div>

      {/* Publish Form */}
      <Card glow className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary-light" />
            <CardTitle className="text-base">פרסם עדכון חדש</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת העדכון..." />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="תוכן העדכון (אופציונלי)..."
            className="w-full h-20 rounded-xl border border-surface-border bg-surface/50 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
          />
          <Button size="sm">
            <Send className="h-4 w-4" />
            פרסם עדכון
          </Button>
        </CardContent>
      </Card>

      {/* Feed History */}
      <div className="mt-6 space-y-2">
        <h2 className="text-sm font-bold text-text-secondary mb-3">היסטוריית עדכונים</h2>
        {mockFeed.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-light">
                  {item.type === "auto" ? (
                    <Zap className="h-4 w-4 text-accent-amber" />
                  ) : (
                    <Megaphone className="h-4 w-4 text-primary-light" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-muted">{item.createdAt}</p>
                </div>
              </div>
              <Badge variant={item.type === "auto" ? "secondary" : "default"}>
                {item.type === "auto" ? "אוטומטי" : "ידני"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
