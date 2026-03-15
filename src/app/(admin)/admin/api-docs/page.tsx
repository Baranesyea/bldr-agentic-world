"use client";

import React from "react";
import { motion } from "framer-motion";
import { Code, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const endpoints = [
  { method: "GET", path: "/api/courses", description: "רשימת כל הקורסים", layer: "Content" },
  { method: "POST", path: "/api/courses", description: "יצירת קורס חדש", layer: "Content" },
  { method: "GET", path: "/api/questions", description: "רשימת שאלות (תומך ?status=pending)", layer: "Community" },
  { method: "GET", path: "/api/questions?format=md", description: "ייצוא שאלות כ-Markdown (לסוכנים)", layer: "Community" },
  { method: "POST", path: "/api/questions", description: "יצירת שאלה חדשה", layer: "Community" },
  { method: "GET", path: "/api/events", description: "רשימת אירועים", layer: "Community" },
  { method: "POST", path: "/api/events", description: "יצירת אירוע חדש", layer: "Community" },
  { method: "GET", path: "/api/activity-feed", description: "פיד עדכונים", layer: "Dashboard" },
  { method: "POST", path: "/api/activity-feed", description: "פרסום עדכון ידני", layer: "Dashboard" },
  { method: "GET", path: "/api/notes", description: "רשימת הערות", layer: "Content" },
  { method: "POST", path: "/api/notes", description: "יצירת הערה חדשה", layer: "Content" },
  { method: "GET", path: "/api/users", description: "רשימת משתמשים (admin)", layer: "Users" },
  { method: "POST", path: "/api/users", description: "הרשמת משתמש חדש", layer: "Users" },
];

const methodColors: Record<string, string> = {
  GET: "bg-accent-green/15 text-accent-green border-accent-green/20",
  POST: "bg-primary/15 text-primary-light border-primary/20",
  PUT: "bg-accent-amber/15 text-accent-amber border-accent-amber/20",
  DELETE: "bg-accent-red/15 text-accent-red border-accent-red/20",
};

export default function AdminApiDocsPage() {
  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Code className="h-5 w-5 text-primary-light" />
          <h1 className="text-2xl font-bold text-text-primary">API Documentation</h1>
        </div>
        <p className="text-sm text-text-secondary">
          כל ה-endpoints הזמינים — API-First לסוכנים ואינטגרציות
        </p>
      </motion.div>

      <div className="mt-6 space-y-2">
        {endpoints.map((ep, i) => (
          <motion.div
            key={`${ep.method}-${ep.path}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="hover:border-surface-border-hover transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <Badge className={methodColors[ep.method] || ""}>
                  {ep.method}
                </Badge>
                <code className="text-sm text-text-primary font-mono flex-1" dir="ltr">
                  {ep.path}
                </code>
                <span className="text-xs text-text-secondary hidden md:block">
                  {ep.description}
                </span>
                <Badge variant="secondary" className="text-xs hidden lg:flex">
                  {ep.layer}
                </Badge>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(ep.path)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
