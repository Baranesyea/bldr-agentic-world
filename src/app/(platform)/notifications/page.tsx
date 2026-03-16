"use client";

import React, { useState, useEffect } from "react";
import { FeedbackIcon, BeakerIcon, UsersIcon, GraduationIcon } from "@/components/ui/icons";

interface Notification {
  id: string;
  text: string;
  icon: "feedback" | "case_study" | "user" | "course";
  timeAgo: string;
  read: boolean;
  createdAt: string;
}

const STORAGE_KEY = "bldr_notifications";

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", text: "פידבק חדש התקבל", icon: "feedback", timeAgo: "לפני 5 דקות", read: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "n2", text: "בקשה חדשה למקרה בוחן", icon: "case_study", timeAgo: "לפני 12 דקות", read: false, createdAt: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: "n3", text: "משתמש חדש הצטרף", icon: "user", timeAgo: "לפני שעה", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "n4", text: "קורס חדש פורסם", icon: "course", timeAgo: "לפני 3 שעות", read: true, createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "n5", text: "פידבק חדש התקבל", icon: "feedback", timeAgo: "אתמול", read: true, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "n6", text: "משתמש חדש הצטרף", icon: "user", timeAgo: "לפני יומיים", read: true, createdAt: new Date(Date.now() - 48 * 3600000).toISOString() },
];

const iconComponents: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  feedback: FeedbackIcon,
  case_study: BeakerIcon,
  user: UsersIcon,
  course: GraduationIcon,
};

const iconColors: Record<string, string> = {
  feedback: "rgba(0,100,255,0.8)",
  case_study: "rgba(160,100,255,0.8)",
  user: "rgba(0,200,100,0.8)",
  course: "rgba(255,179,0,0.8)",
};

const iconBgs: Record<string, string> = {
  feedback: "rgba(0,100,255,0.1)",
  case_study: "rgba(160,100,255,0.1)",
  user: "rgba(0,200,100,0.1)",
  course: "rgba(255,179,0,0.1)",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications(MOCK_NOTIFICATIONS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_NOTIFICATIONS));
      }
    } catch {
      setNotifications(MOCK_NOTIFICATIONS);
    }
  }, []);

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
            התראות
          </h1>
          {unreadCount > 0 && (
            <p style={{ fontSize: 13, color: "rgba(240,240,245,0.4)" }}>
              {unreadCount} התראות שלא נקראו
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              padding: "8px 16px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(240,240,245,0.6)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            סמן הכל כנקרא
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {notifications.map((n) => {
          const Icon = iconComponents[n.icon] || FeedbackIcon;
          return (
            <div
              key={n.id}
              onClick={() => !n.read && markAsRead(n.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 4,
                background: n.read ? "transparent" : "rgba(0,0,255,0.04)",
                border: n.read ? "1px solid transparent" : "1px solid rgba(0,0,255,0.08)",
                cursor: n.read ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {/* Unread dot */}
              <div style={{ width: 8, flexShrink: 0 }}>
                {!n.read && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#0000FF",
                    boxShadow: "0 0 8px rgba(0,0,255,0.4)",
                  }} />
                )}
              </div>

              {/* Icon */}
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 4,
                background: iconBgs[n.icon] || "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={18} color={iconColors[n.icon] || "rgba(240,240,245,0.5)"} />
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: 14,
                  color: n.read ? "rgba(240,240,245,0.5)" : "#fff",
                  fontWeight: n.read ? 400 : 600,
                }}>
                  {n.text}
                </p>
              </div>

              {/* Time */}
              <span style={{ fontSize: 12, color: "rgba(240,240,245,0.25)", flexShrink: 0, whiteSpace: "nowrap" }}>
                {n.timeAgo}
              </span>
            </div>
          );
        })}
      </div>

      {notifications.length === 0 && (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 4,
          padding: "80px 32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🔔</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            אין התראות
          </h2>
          <p style={{ fontSize: 14, color: "rgba(240,240,245,0.4)" }}>
            כשיהיו התראות חדשות, הן יופיעו כאן
          </p>
        </div>
      )}
    </div>
  );
}
