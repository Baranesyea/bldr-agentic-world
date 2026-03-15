"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  BookOpen,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const mockCourses = [
  {
    id: "1",
    title: "Mastering Claude Code",
    status: "active" as const,
    chapters: 3,
    lessons: 10,
    students: 156,
  },
  {
    id: "2",
    title: "Vibe Coding Fundamentals",
    status: "active" as const,
    chapters: 4,
    lessons: 18,
    students: 89,
  },
  {
    id: "3",
    title: "AI Automation for Business",
    status: "draft" as const,
    chapters: 0,
    lessons: 0,
    students: 0,
  },
];

export default function AdminCoursesPage() {
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary">ניהול תוכן</h1>
          <p className="text-sm text-text-secondary mt-1">
            קורסים, פרקים ושיעורים
          </p>
        </div>
        <Button onClick={() => setShowNewCourse(!showNewCourse)}>
          <Plus className="h-4 w-4" />
          קורס חדש
        </Button>
      </motion.div>

      {/* New Course Form */}
      {showNewCourse && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6"
        >
          <Card glow>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="שם הקורס החדש..."
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm">צור קורס</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewCourse(false)}
                >
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Courses List */}
      <div className="space-y-3">
        {mockCourses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:border-surface-border-hover transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-4 w-4 text-text-muted cursor-grab flex-shrink-0" />

                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-light flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-primary-light" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-text-primary truncate">
                        {course.title}
                      </h3>
                      <Badge
                        variant={
                          course.status === "active" ? "success" : "secondary"
                        }
                      >
                        {course.status === "active" ? "פעיל" : "טיוטה"}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {course.chapters} פרקים · {course.lessons} שיעורים ·{" "}
                      {course.students} תלמידים
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="icon-sm" variant="ghost">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost">
                      {course.status === "active" ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button size="icon-sm" variant="ghost">
                      <Trash2 className="h-3.5 w-3.5 text-accent-red" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
