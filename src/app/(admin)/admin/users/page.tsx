"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Search, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

const users = [
  { id: "u1", name: "ערן בראון", email: "eran@bldr.co.il", role: "admin", level: "Architect", joined: "ינואר 2026", status: "active" },
  { id: "u2", name: "דני כהן", email: "dani@example.com", role: "member", level: "Builder", joined: "פברואר 2026", status: "at_risk" },
  { id: "u3", name: "מיכל לוי", email: "michal@example.com", role: "member", level: "Explorer", joined: "פברואר 2026", status: "at_risk" },
  { id: "u4", name: "יוסי אברהם", email: "yossi@example.com", role: "member", level: "Builder", joined: "מרץ 2026", status: "active" },
  { id: "u5", name: "רונית שמש", email: "ronit@example.com", role: "member", level: "Explorer", joined: "מרץ 2026", status: "active" },
];

export default function AdminUsersPage() {
  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">משתמשים</h1>
          <p className="text-sm text-text-secondary mt-1">{users.length} משתמשים רשומים</p>
        </div>
      </motion.div>

      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input placeholder="חפש לפי שם או אימייל..." className="pr-10 max-w-md" />
      </div>

      <div className="space-y-2">
        {users.map((user, i) => (
          <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="hover:border-surface-border-hover transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar fallback={user.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary text-sm">{user.name}</span>
                    {user.role === "admin" && (
                      <Shield className="h-3.5 w-3.5 text-primary-light" />
                    )}
                    {user.status === "at_risk" && (
                      <AlertTriangle className="h-3.5 w-3.5 text-accent-amber" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{user.email}</p>
                </div>
                <Badge variant="secondary">{user.level}</Badge>
                <span className="text-xs text-text-muted">{user.joined}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
