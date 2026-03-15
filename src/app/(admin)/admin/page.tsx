"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, HelpCircle, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "סה״כ משתמשים", value: "156", icon: Users, change: "+12 החודש" },
  { label: "קורסים פעילים", value: "2", icon: BookOpen, change: "1 בטיוטה" },
  { label: "שאלות ממתינות", value: "5", icon: HelpCircle, change: "3 חדשות היום" },
  { label: "אירועים קרובים", value: "2", icon: Calendar, change: "הבא: יום ג׳" },
];

const atRiskMembers = [
  { name: "דני כהן", lastActive: "לפני 14 יום", progress: "20%" },
  { name: "מיכל לוי", lastActive: "לפני 10 ימים", progress: "35%" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AdminDashboardPage() {
  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-text-primary">פאנל ניהול</h1>
        <p className="text-sm text-text-secondary mt-1">סקירה כללית של המערכת</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary-light" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-accent-green" />
                </div>
                <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted mt-1">{stat.label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* At-Risk Members */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent-amber" />
              <CardTitle className="text-base">משתמשים בסיכון</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskMembers.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between py-2 border-b border-surface-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{member.name}</p>
                    <p className="text-xs text-text-muted">פעילות אחרונה: {member.lastActive}</p>
                  </div>
                  <p className="text-sm text-accent-amber">{member.progress} התקדמות</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
