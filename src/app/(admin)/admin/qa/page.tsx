"use client";

import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, Check, X, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pendingQuestions = [
  { id: "q3", title: "Vibe Coding — איפה מתחילים?", user: "יוסי אברהם", createdAt: "לפני שעה" },
  { id: "q4", title: "איך לחבר n8n ל-Claude?", user: "רונית שמש", createdAt: "לפני 3 שעות" },
];

const answeredQuestions = [
  { id: "q1", title: "איך להשתמש ב-MCP Servers?", user: "דני כהן", isPublished: true },
  { id: "q2", title: "איך לכתוב CLAUDE.md נכון?", user: "מיכל לוי", isPublished: true },
];

export default function AdminQAPage() {
  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">שאלות ותשובות</h1>
        <p className="text-sm text-text-secondary mt-1">ענה על שאלות ופרסם ל-Knowledge Base</p>
      </motion.div>

      <h2 className="text-sm font-bold text-accent-amber mt-6 mb-3">ממתינות לתשובה ({pendingQuestions.length})</h2>
      <div className="space-y-2 mb-8">
        {pendingQuestions.map((q) => (
          <Card key={q.id} className="border-accent-amber/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">{q.title}</h3>
                <p className="text-xs text-text-muted">{q.user} · {q.createdAt}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm">ענה</Button>
                <Button size="icon-sm" variant="ghost"><X className="h-4 w-4 text-accent-red" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-sm font-bold text-accent-green mb-3">נענו</h2>
      <div className="space-y-2">
        {answeredQuestions.map((q) => (
          <Card key={q.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-accent-green" />
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{q.title}</h3>
                  <p className="text-xs text-text-muted">{q.user}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {q.isPublished && <Badge variant="success">פורסם ב-KB</Badge>}
                <Button size="sm" variant="ghost"><Globe className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
