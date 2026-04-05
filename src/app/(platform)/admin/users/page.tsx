"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SearchIcon } from "@/components/ui/icons";

/* ─── Types ─── */
interface UserPayment {
  id: string;
  amount: number;
  date: string;
  status: "הצלחה" | "נכשל";
  transactionId?: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: "member" | "admin" | "tourist";
  status: "paying" | "trial" | "expired" | "blocked" | "admin";
  amount: number;
  joinedAt: string;
  lastPaymentDate: string | null;
  subscriptionStart: string | null;
  payments: UserPayment[];
  accessExpiresAt?: string | null;
}

type FilterTab = "all" | "paying" | "trial" | "blocked" | "inactive" | "tourist";
type SortKey = "joined" | "lastPayment" | "amount";

const LS_KEY = "bldr_users";

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(users));
}

/* ─── Styles ─── */
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "4px",
  padding: "24px",
};

const INPUT: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "4px",
  padding: "10px 14px",
  color: "#f0f0f5",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1aff, #4444ff)",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "10px 22px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  paying: { label: "משלם", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  trial: { label: "ניסיון", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  expired: { label: "פג תוקף", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  blocked: { label: "חסום", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  admin: { label: "מנהל", color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  tourist: { label: "תייר", color: "#FFB300", bg: "rgba(255,179,0,0.12)" },
};

const STATUS_OPTIONS: { value: User["status"]; label: string }[] = [
  { value: "paying", label: "משלם" },
  { value: "trial", label: "ניסיון" },
  { value: "expired", label: "פג תוקף" },
  { value: "blocked", label: "חסום" },
];

/* ─── Helpers ─── */
function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(n: number): string {
  return `₪${n.toLocaleString()}`;
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]) : parts[0][0];
}

function timeInSystem(joinedAt: string): string {
  const diff = Date.now() - new Date(joinedAt).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "היום";
  if (days < 7) return `${days} ימים`;
  if (days < 30) return `${Math.floor(days / 7)} שבועות`;
  if (days < 365) return `${Math.floor(days / 30)} חודשים`;
  return `${Math.floor(days / 365)} שנים`;
}

/* ─── Component ─── */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAmount, setNewAmount] = useState("99");
  const [newStatus, setNewStatus] = useState<User["status"]>("paying");
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [deletedEmails, setDeletedEmails] = useState<Set<string>>(new Set());
  const [allCourses, setAllCourses] = useState<{ id: string; title: string }[]>([]);
  const [userAccessMap, setUserAccessMap] = useState<Record<string, { schoolIds: string[]; blockedCourseIds: string[] }>>({});

  // User detail panel state
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [userEmailLogs, setUserEmailLogs] = useState<Array<{ id: string; subject: string; status: string; templateSlug: string | null; openedAt: string | null; createdAt: string }>>([]);
  const [userSchools, setUserSchools] = useState<string[]>([]);
  const [userBlockedCourses, setUserBlockedCourses] = useState<string[]>([]);
  const [savingDetail, setSavingDetail] = useState(false);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");

  // Auto-format phone numbers once
  useEffect(() => {
    if (localStorage.getItem("bldr_phones_formatted")) return;
    fetch("/api/members/format-phones", { method: "POST" }).then(() => {
      localStorage.setItem("bldr_phones_formatted", "true");
    }).catch(() => {});
  }, []);

  const saveUserName = async (user: User) => {
    const newName = editingNameValue.trim();
    if (!newName || newName === user.fullName) { setEditingNameId(null); return; }
    // Update in UI
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, fullName: newName } : u));
    setEditingNameId(null);
    // Update in DB
    try {
      await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, fullName: newName }),
      });
    } catch {}
    // Update localStorage too
    try {
      const stored = loadUsers();
      const idx = stored.findIndex(u => u.id === user.id);
      if (idx !== -1) { stored[idx].fullName = newName; saveUsers(stored); }
    } catch {}
  };

  // Load schools, deleted emails, courses
  useEffect(() => {
    fetch("/api/schools").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setSchools(data);
    }).catch(() => {});
    // Get inactive members (not deleted_accounts, since users can be re-added)
    fetch("/api/members").then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const inactive = data.filter((m: { status: string }) => m.status === "inactive");
        setDeletedEmails(new Set(inactive.map((m: { email: string }) => m.email.toLowerCase())));
      }
    }).catch(() => {});
    fetch("/api/courses").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAllCourses(data.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })));
    }).catch(() => {});
    fetch("/api/users/access-map").then(r => r.json()).then(data => {
      if (data && typeof data === "object" && !data.error) setUserAccessMap(data);
    }).catch(() => {});
  }, []);

  // Load users from localStorage + database members
  useEffect(() => {
    const stored = loadUsers();

    // Inject tourist users from bldr_tourist
    try {
      const touristRaw = localStorage.getItem("bldr_tourist");
      if (touristRaw) {
        const t = JSON.parse(touristRaw);
        if (t.email && !stored.find((u) => u.email.toLowerCase() === t.email.toLowerCase())) {
          stored.push({
            id: `tourist_${t.email}`,
            email: t.email,
            fullName: t.name || "",
            phone: t.phone || "",
            role: "tourist",
            status: "trial",
            amount: 0,
            joinedAt: t.grantedAt || new Date().toISOString(),
            lastPaymentDate: null,
            subscriptionStart: null,
            payments: [],
          });
        }
      }
    } catch {}

    // Merge with database members
    fetch("/api/members").then(r => r.json()).then(data => {
      if (!Array.isArray(data)) { setUsers(stored); return; }
      const merged = [...stored];
      const existingEmails = new Set(merged.map(u => u.email.toLowerCase()));

      for (const m of data) {
        if (existingEmails.has(m.email.toLowerCase())) continue;
        const isExpired = m.accessExpiresAt && new Date(m.accessExpiresAt) < new Date();
        merged.push({
          id: m.id,
          email: m.email,
          fullName: m.fullName || m.email.split("@")[0],
          phone: m.phone || "",
          role: "member",
          status: isExpired ? "expired" : m.type === "paid" ? "paying" : "trial",
          amount: m.pricePaid || 0,
          joinedAt: m.createdAt || new Date().toISOString(),
          lastPaymentDate: null,
          subscriptionStart: null,
          payments: [],
          accessExpiresAt: m.accessExpiresAt || null,
        });
      }
      setUsers(merged);
    }).catch(() => {
      setUsers(stored);
    });
  }, []);

  /* ─── Stats ─── */
  const totalUsers = users.length;
  const activePaying = users.filter((u) => u.status === "paying").length;
  const trialUsers = users.filter((u) => u.status === "trial").length;
  const monthlyRevenue = users.filter((u) => u.status === "paying").reduce((s, u) => s + u.amount, 0);
  const allPayments = users.flatMap((u) => u.payments);
  const totalPaidAll = allPayments.reduce((s, p) => s + p.amount, 0);
  const payingCount = users.filter((u) => u.payments.length > 0).length;
  const avgLtv = payingCount > 0 ? Math.round(totalPaidAll / payingCount) : 0;

  /* ─── Filter & Sort ─── */
  const filtered = useMemo(() => {
    let list = [...users];

    if (filterTab === "paying") list = list.filter((u) => u.status === "paying");
    else if (filterTab === "trial") list = list.filter((u) => u.status === "trial");
    else if (filterTab === "blocked") list = list.filter((u) => u.status === "blocked");
    else if (filterTab === "inactive") list = list.filter((u) => u.status === "expired" || u.status === "trial");
    else if (filterTab === "tourist") list = list.filter((u) => u.role === "tourist");

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      );
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "joined") cmp = new Date(a.joinedAt || 0).getTime() - new Date(b.joinedAt || 0).getTime();
      else if (sortKey === "lastPayment") cmp = new Date(a.lastPaymentDate || 0).getTime() - new Date(b.lastPaymentDate || 0).getTime();
      else if (sortKey === "amount") cmp = a.amount - b.amount;
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [users, filterTab, search, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sortArrow = (key: SortKey) => (sortKey === key ? (sortAsc ? " ▲" : " ▼") : "");

  /* ─── Add user ─── */
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setAddLoading(true);
    setAddError("");

    const now = new Date().toISOString();
    const newUser: User = {
      id: `user_${Date.now()}`,
      email: newEmail.toLowerCase().trim(),
      fullName: newName.trim(),
      phone: newPhone.trim(),
      role: "member",
      status: newStatus,
      amount: parseFloat(newAmount) || 0,
      joinedAt: now,
      lastPaymentDate: null,
      subscriptionStart: newStatus === "paying" ? now : null,
      payments: [],
    };
    const updated = [...users, newUser];
    const toSave = updated.filter((u) => u.role !== "tourist");
    saveUsers(toSave);
    setUsers(updated);

    // Create member record in DB (required for login access)
    try {
      await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          fullName: newUser.fullName || newUser.email.split("@")[0],
          type: newStatus === "paying" ? "paid" : "free",
          pricePaid: parseFloat(newAmount) || 0,
        }),
      });
    } catch {}

    // Add to selected schools (will be linked after user logs in and gets a users table entry)
    // For now, store school IDs on the member record
    if (selectedSchools.length > 0) {
      try {
        await fetch("/api/members", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: undefined, // will match by email
            email: newUser.email,
            schoolId: selectedSchools[0], // primary school
          }),
        });
      } catch {}
    }

    // Send invite email
    try {
      const res = await fetch("/api/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUser.email, fullName: newUser.fullName }),
      });
      if (!res.ok) {
        const data = await res.json();
        // Not a fatal error — user was created, just invite failed
        setAddError(`המשתמש נוצר אך שליחת ההזמנה נכשלה: ${data.error}`);
        setAddLoading(false);
        return;
      }
    } catch {
      setAddError("המשתמש נוצר אך שליחת ההזמנה נכשלה");
      setAddLoading(false);
      return;
    }

    setNewName(""); setNewEmail(""); setNewPhone(""); setNewAmount("99"); setNewStatus("paying"); setSelectedSchools([]);
    setAddError("");
    setAddLoading(false);
    setShowAddModal(false);
  };

  /* ─── Update status ─── */
  const handleStatusChange = (userId: string, status: User["status"]) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status } : u));
    // Only update localStorage for users that originated from there
    try {
      const stored = loadUsers();
      const idx = stored.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        stored[idx].status = status;
        saveUsers(stored);
      }
    } catch {}
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "הכל" },
    { key: "tourist", label: "תיירים" },
    { key: "paying", label: "משלמים" },
    { key: "trial", label: "ניסיון" },
    { key: "blocked", label: "חסומים" },
    { key: "inactive", label: "לא פעילים" },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", direction: "rtl" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#fff", margin: 0 }}>משתמשים</h1>
          <p style={{ color: "rgba(240,240,245,0.7)", marginTop: 6, fontSize: "14px", margin: "6px 0 0 0" }}>
            ניהול כל המשתמשים — מנויים, ניסיון ומנהלים
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...BTN, background: "rgba(255,255,255,0.06)" }} onClick={() => window.location.href = "/admin/import-users"}>
            ייבוא משתמשים
          </button>
          <button style={BTN} onClick={() => setShowAddModal(true)}>
            + הוסף מנוי
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginTop: 24, marginBottom: 28 }}>
        {[
          { label: "סה״כ משתמשים", value: totalUsers.toString(), color: "#f0f0f5" },
          { label: "מנויים פעילים", value: activePaying.toString(), color: "#4ade80" },
          { label: "משתמשי ניסיון", value: trialUsers.toString(), color: "#60a5fa" },
          { label: "הכנסה חודשית", value: formatCurrency(monthlyRevenue), color: "#4ade80" },
          { label: "ממוצע LTV", value: formatCurrency(avgLtv), color: "#c084fc" },
        ].map((s) => (
          <div key={s.label} style={CARD}>
            <div style={{ fontSize: 12, color: "rgba(240,240,245,0.7)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              style={{
                padding: "8px 18px",
                borderRadius: 4,
                border: "1px solid",
                borderColor: filterTab === tab.key ? "rgba(100,100,255,0.4)" : "rgba(255,255,255,0.08)",
                background: filterTab === tab.key ? "rgba(100,100,255,0.15)" : "rgba(255,255,255,0.03)",
                color: filterTab === tab.key ? "#8888ff" : "rgba(240,240,245,0.5)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", maxWidth: 300, flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(240,240,245,0.7)", display: "flex" }}>
            <SearchIcon size={15} />
          </span>
          <input
            placeholder="חיפוש לפי שם, אימייל, טלפון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...INPUT, paddingRight: 38 }}
          />
        </div>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{
            ...INPUT,
            width: "auto",
            minWidth: 160,
            cursor: "pointer",
            appearance: "none" as const,
            WebkitAppearance: "none" as const,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "left 12px center",
            paddingLeft: 32,
          }}
        >
          <option value="joined">מיון: תאריך הצטרפות</option>
          <option value="lastPayment">מיון: תשלום אחרון</option>
          <option value="amount">מיון: סכום</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "rgba(240,240,245,0.7)", fontSize: 14 }}>
            לא נמצאו משתמשים
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {[
                    { label: "", width: "52px", sortable: false, key: null },
                    { label: "שם", width: undefined, sortable: false, key: null },
                    { label: "אימייל", width: undefined, sortable: false, key: null },
                    { label: "טלפון", width: "120px", sortable: false, key: null },
                    { label: "סטטוס", width: "120px", sortable: false, key: null },
                    { label: "סכום", width: "100px", sortable: true, key: "amount" as SortKey },
                    { label: "הצטרף", width: "110px", sortable: true, key: "joined" as SortKey },
                    { label: "זמן במערכת", width: "110px", sortable: false, key: null },
                    { label: "תשלום אחרון", width: "120px", sortable: true, key: "lastPayment" as SortKey },
                  ].map((col, i) => (
                    <th
                      key={i}
                      onClick={col.sortable && col.key ? () => handleSort(col.key!) : undefined}
                      style={{
                        padding: "14px 14px",
                        textAlign: "right",
                        color: "rgba(240,240,245,0.7)",
                        fontWeight: 600,
                        fontSize: 12,
                        letterSpacing: "0.3px",
                        whiteSpace: "nowrap",
                        width: col.width,
                        cursor: col.sortable ? "pointer" : "default",
                        userSelect: "none",
                      }}
                    >
                      {col.label}
                      {col.key ? sortArrow(col.key) : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => {
                  const isExpanded = expandedId === user.id;
                  const isDeleted = deletedEmails.has(user.email.toLowerCase());
                  const isExpiredUser = user.status === "expired" || (user.accessExpiresAt && new Date(user.accessExpiresAt) < new Date());
                  const statusKey = user.role === "tourist" ? "tourist" : isExpiredUser ? "expired" : user.status;
                  const statusInfo = STATUS_CONFIG[statusKey] || STATUS_CONFIG.trial;
                  const totalPaid = user.payments.reduce((s, p) => s + p.amount, 0);

                  return (
                    <React.Fragment key={user.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : user.id)}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          opacity: isDeleted ? 0.4 : isExpiredUser ? 0.5 : 1,
                          background: isExpanded ? "rgba(100,100,255,0.03)" : "transparent",
                        }}
                        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: GRADIENTS[idx % GRADIENTS.length],
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                          }}>
                            {getInitials(user.fullName)}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f5", fontWeight: 600 }}>
                          {editingNameId === user.id ? (
                            <input
                              autoFocus
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              onBlur={() => saveUserName(user)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveUserName(user); if (e.key === "Escape") setEditingNameId(null); }}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(0,0,255,0.4)",
                                borderRadius: 4, padding: "4px 8px", color: "#f0f0f5", fontSize: 14,
                                fontWeight: 600, outline: "none", width: "100%", boxSizing: "border-box",
                              }}
                            />
                          ) : (
                            <span
                              onClick={(e) => { e.stopPropagation(); setEditingNameId(user.id); setEditingNameValue(user.fullName || ""); }}
                              style={{ cursor: "pointer", borderBottom: "1px dashed transparent", transition: "border-color 0.2s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = "rgba(240,240,245,0.3)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
                              title="לחץ לעריכת שם"
                            >
                              {user.fullName || "—"}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.7)", direction: "ltr", textAlign: "right", fontSize: 13 }}>
                          {user.email}
                        </td>
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.7)", direction: "ltr", textAlign: "right", fontSize: 13 }}>
                          {user.phone || "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{
                              background: statusInfo.bg, color: statusInfo.color,
                              padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                            }}>
                              {statusInfo.label}
                            </span>
                            {(() => {
                              const access = userAccessMap[user.email.toLowerCase()];
                              if (!access) return null;
                              return access.schoolIds.map((sid) => {
                                const school = schools.find((s) => s.id === sid);
                                return school ? (
                                  <span key={sid} style={{
                                    background: "rgba(0,0,255,0.1)", color: "#6666FF",
                                    padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
                                  }}>
                                    {school.name}
                                  </span>
                                ) : null;
                              });
                            })()}
                            {(() => {
                              const access = userAccessMap[user.email.toLowerCase()];
                              if (!access || access.blockedCourseIds.length === 0) return null;
                              return (
                                <span style={{
                                  background: "rgba(255,59,48,0.1)", color: "#ff6b6b",
                                  padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
                                }}>
                                  {access.blockedCourseIds.length} קורסים חסומים
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#f0f0f5", fontWeight: 600, fontSize: 13 }}>
                          {user.amount > 0 ? formatCurrency(user.amount) : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.7)", fontSize: 13 }}>
                          {formatDate(user.joinedAt)}
                        </td>
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.7)", fontSize: 13 }}>
                          {user.joinedAt ? timeInSystem(user.joinedAt) : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.7)", fontSize: 13 }}>
                          {formatDate(user.lastPaymentDate)}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={9} style={{ padding: 0 }}>
                            <div style={{
                              background: "rgba(100,100,255,0.02)",
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                              padding: "24px 28px",
                            }}>
                              {/* User Info Header */}
                              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 24 }}>
                                <div style={{
                                  width: 52, height: 52, borderRadius: "50%",
                                  background: GRADIENTS[idx % GRADIENTS.length],
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0,
                                }}>
                                  {getInitials(user.fullName)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                                      {user.fullName || "—"}
                                    </span>
                                    <span style={{
                                      background: statusInfo.bg, color: statusInfo.color,
                                      padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                    }}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", direction: "ltr", textAlign: "right" }}>
                                    {user.email}
                                    {user.phone && <span style={{ marginLeft: 16 }}>{user.phone}</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Summary Cards */}
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                                {[
                                  { label: "סה״כ שולם (LTV)", value: formatCurrency(totalPaid) },
                                  { label: "תשלום חודשי", value: user.amount > 0 ? formatCurrency(user.amount) : "—" },
                                  { label: "תחילת מנוי", value: formatDate(user.subscriptionStart) },
                                  { label: "מספר תשלומים", value: user.payments.length.toString() },
                                ].map((s) => (
                                  <div key={s.label} style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: 4, padding: 14,
                                  }}>
                                    <div style={{ fontSize: 11, color: "rgba(240,240,245,0.7)", marginBottom: 4 }}>{s.label}</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Payment History */}
                              <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,240,245,0.7)", marginBottom: 12 }}>
                                  היסטוריית תשלומים ({user.payments.length})
                                </div>
                                {user.payments.length === 0 ? (
                                  <div style={{ color: "rgba(240,240,245,0.7)", fontSize: 13 }}>
                                    אין תשלומים רשומים
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {user.payments.map((p) => (
                                      <div key={p.id} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "10px 14px", background: "rgba(255,255,255,0.02)",
                                        borderRadius: 4, border: "1px solid rgba(255,255,255,0.04)",
                                      }}>
                                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                          <span style={{ color: "#f0f0f5", fontWeight: 600, fontSize: 13 }}>
                                            {formatCurrency(p.amount)}
                                          </span>
                                          <span style={{ color: "rgba(240,240,245,0.7)", fontSize: 12 }}>
                                            {formatDate(p.date)}
                                          </span>
                                        </div>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                          {p.transactionId && (
                                            <span style={{ color: "rgba(240,240,245,0.7)", fontSize: 11, fontFamily: "monospace", direction: "ltr" }}>
                                              #{p.transactionId}
                                            </span>
                                          )}
                                          <span style={{
                                            background: p.status === "הצלחה" ? "rgba(0,200,83,0.1)" : "rgba(255,59,48,0.1)",
                                            color: p.status === "הצלחה" ? "#00C853" : "#ff6b6b",
                                            padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                                          }}>
                                            {p.status}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Change Status */}
                              {user.role !== "tourist" && (
                                <div style={{ display: "flex", gap: 10, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", alignItems: "center", flexWrap: "wrap" }}>
                                  <div style={{ fontSize: 12, color: "rgba(240,240,245,0.7)", marginLeft: 8 }}>
                                    שינוי סטטוס:
                                  </div>
                                  {STATUS_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      onClick={(e) => { e.stopPropagation(); handleStatusChange(user.id, opt.value); }}
                                      style={{
                                        padding: "6px 14px", borderRadius: 6,
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        background: user.status === opt.value ? "rgba(100,100,255,0.15)" : "rgba(255,255,255,0.03)",
                                        color: user.status === opt.value ? "#8888ff" : "rgba(240,240,245,0.6)",
                                        fontSize: 12, cursor: "pointer", transition: "all 0.15s",
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDetailUser(user);
                                      setUserSchools([]);
                                      setUserBlockedCourses([]);
                                      setUserEmailLogs([]);
                                      // Load email logs
                                      fetch(`/api/email-logs?email=${encodeURIComponent(user.email)}`)
                                        .then(r => r.json())
                                        .then(data => { if (Array.isArray(data)) setUserEmailLogs(data); })
                                        .catch(() => {});
                                      // Load all access data in one call
                                      fetch(`/api/users/by-email?email=${encodeURIComponent(user.email)}`)
                                        .then(r => r.json())
                                        .then(data => {
                                          if (data.schoolIds) setUserSchools(data.schoolIds);
                                          if (data.blockedCourseIds) setUserBlockedCourses(data.blockedCourseIds);
                                        }).catch(() => {});
                                    }}
                                    style={{
                                      padding: "6px 14px", borderRadius: 6, marginRight: "auto",
                                      border: "1px solid rgba(0,0,255,0.3)",
                                      background: "rgba(0,0,255,0.08)", color: "#6666FF",
                                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    }}
                                  >
                                    ניהול גישה
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!confirm(`לשלוח מייל איפוס סיסמה ל-${user.email}?`)) return;
                                      try {
                                        const res = await fetch("/api/auth/reset-user-password", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ email: user.email }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) {
                                          alert(data.error || "שגיאה בשליחת איפוס סיסמה");
                                        } else {
                                          alert("מייל איפוס סיסמה נשלח בהצלחה!");
                                        }
                                      } catch {
                                        alert("שגיאה בשליחת איפוס סיסמה");
                                      }
                                    }}
                                    style={{
                                      padding: "6px 14px", borderRadius: 6,
                                      border: "1px solid rgba(255,165,0,0.3)",
                                      background: "rgba(255,165,0,0.08)", color: "#FFA500",
                                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    }}
                                  >
                                    אפס סיסמה
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const newPass = prompt(`הזן סיסמה חדשה ל-${user.email}:`);
                                      if (!newPass) return;
                                      if (newPass.length < 6) { alert("הסיסמה חייבת להכיל לפחות 6 תווים"); return; }
                                      try {
                                        const res = await fetch("/api/auth/change-user-password", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ email: user.email, newPassword: newPass }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) {
                                          alert(data.error || "שגיאה בשינוי סיסמה");
                                        } else {
                                          alert("הסיסמה שונתה בהצלחה!");
                                        }
                                      } catch {
                                        alert("שגיאה בשינוי סיסמה");
                                      }
                                    }}
                                    style={{
                                      padding: "6px 14px", borderRadius: 6,
                                      border: "1px solid rgba(0,200,83,0.3)",
                                      background: "rgba(0,200,83,0.08)", color: "#00C853",
                                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    }}
                                  >
                                    שנה סיסמה
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!confirm(`למחוק את ${user.fullName || user.email}?`)) return;
                                      await fetch("/api/account/delete", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          email: user.email,
                                          fullName: user.fullName,
                                          userType: user.role,
                                          deletedBy: "admin",
                                        }),
                                      });
                                      // Update UI state
                                      setDeletedEmails(new Set([...deletedEmails, user.email.toLowerCase()]));
                                      // Also remove from localStorage
                                      const stored = loadUsers().filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
                                      saveUsers(stored);
                                      setUsers(prev => prev.filter(u => u.id !== user.id));
                                      setExpandedId(null);
                                    }}
                                    style={{
                                      padding: "6px 14px", borderRadius: 6,
                                      border: "1px solid rgba(255,59,48,0.3)",
                                      background: "rgba(255,59,48,0.08)", color: "#ff6b6b",
                                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    }}
                                  >
                                    מחק חשבון
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Subscriber Modal */}
      {/* Access Management Modal */}
      {detailUser && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)",
          }}
          onClick={() => setDetailUser(null)}
        >
          <div
            style={{
              background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6, padding: 32, maxWidth: 520, width: "90%", direction: "rtl",
              maxHeight: "80vh", overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 0, marginBottom: 8 }}>
              ניהול גישה — {detailUser.fullName || detailUser.email}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", marginBottom: 24, direction: "ltr", textAlign: "right" }}>
              {detailUser.email}
            </p>

            {/* Schools */}
            {schools.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(240,240,245,0.8)", marginBottom: 12 }}>
                  בתי ספר
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {schools.map((s) => (
                    <label
                      key={s.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", borderRadius: 4, cursor: "pointer",
                        background: userSchools.includes(s.id) ? "rgba(0,0,255,0.08)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${userSchools.includes(s.id) ? "rgba(0,0,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={userSchools.includes(s.id)}
                        onChange={() => {
                          setUserSchools((prev) =>
                            prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ color: "#f0f0f5", fontSize: 14 }}>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Courses */}
            {allCourses.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(240,240,245,0.8)", marginBottom: 4 }}>
                  חסימת קורסים
                </h3>
                <p style={{ fontSize: 12, color: "rgba(240,240,245,0.4)", marginBottom: 12 }}>
                  סמן קורסים שהמשתמש לא יוכל לגשת אליהם
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {allCourses.map((c) => (
                    <label
                      key={c.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", borderRadius: 4, cursor: "pointer",
                        background: userBlockedCourses.includes(c.id) ? "rgba(255,59,48,0.06)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${userBlockedCourses.includes(c.id) ? "rgba(255,59,48,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={userBlockedCourses.includes(c.id)}
                        onChange={() => {
                          setUserBlockedCourses((prev) =>
                            prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{
                        color: userBlockedCourses.includes(c.id) ? "#ff6b6b" : "#f0f0f5",
                        fontSize: 14,
                        textDecoration: userBlockedCourses.includes(c.id) ? "line-through" : "none",
                      }}>
                        {c.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Email History */}
            {userEmailLogs.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(240,240,245,0.8)", marginBottom: 12 }}>
                  היסטוריית מיילים
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {userEmailLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", borderRadius: 4,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#f0f0f5" }}>{log.subject}</div>
                        <div style={{ fontSize: 11, color: "rgba(240,240,245,0.4)", marginTop: 2 }}>
                          {new Date(log.createdAt).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {log.openedAt && (
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(156,39,176,0.1)", color: "#CE93D8" }}>
                            נפתח
                          </span>
                        )}
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 20,
                          background: log.status === "delivered" || log.status === "opened" ? "rgba(0,200,83,0.1)" : log.status === "bounced" ? "rgba(255,59,48,0.1)" : "rgba(68,136,255,0.1)",
                          color: log.status === "delivered" || log.status === "opened" ? "#00C853" : log.status === "bounced" ? "#ff6b6b" : "#4488FF",
                        }}>
                          {{ sent: "נשלח", delivered: "הגיע", opened: "נפתח", clicked: "נלחץ", bounced: "חזר", complained: "ספאם" }[log.status] || log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-start" }}>
              <button
                disabled={savingDetail}
                onClick={async () => {
                  setSavingDetail(true);
                  // Get DB user ID
                  let dbUserId: string | null = null;
                  try {
                    const res = await fetch(`/api/users/by-email?email=${encodeURIComponent(detailUser.email)}`);
                    const data = await res.json();
                    dbUserId = data.id || null;
                  } catch {}

                  if (!dbUserId) {
                    alert("משתמש לא נמצא במערכת");
                    setSavingDetail(false);
                    return;
                  }

                  // Save school memberships
                  for (const s of schools) {
                    if (userSchools.includes(s.id)) {
                      await fetch(`/api/schools/${s.id}/members`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: dbUserId }),
                      });
                    } else {
                      await fetch(`/api/schools/${s.id}/members`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "remove", userId: dbUserId }),
                      });
                    }
                  }

                  // Save course access
                  const courses = allCourses.map((c) => ({
                    courseId: c.id,
                    isAvailable: !userBlockedCourses.includes(c.id),
                  }));
                  await fetch("/api/user-course-access", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: detailUser.email,
                      courses,
                      schoolId: userSchools[0] || null,
                    }),
                  });

                  // Refresh access map
                  fetch("/api/users/access-map").then(r => r.json()).then(data => {
                    if (data && typeof data === "object" && !data.error) setUserAccessMap(data);
                  }).catch(() => {});

                  setSavingDetail(false);
                  setDetailUser(null);
                }}
                style={{
                  ...BTN,
                  opacity: savingDetail ? 0.6 : 1,
                }}
              >
                {savingDetail ? "שומר..." : "שמור"}
              </button>
              <button
                onClick={() => setDetailUser(null)}
                style={{ ...BTN, background: "rgba(255,255,255,0.06)" }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6, padding: 32, maxWidth: 440, width: "90%", direction: "rtl",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 0, marginBottom: 24 }}>
              הוספת מנוי חדש
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "שם מלא", value: newName, onChange: setNewName, placeholder: "שם מלא", type: "text", dir: "rtl" },
                { label: "אימייל *", value: newEmail, onChange: setNewEmail, placeholder: "email@example.com", type: "email", dir: "ltr" },
                { label: "טלפון", value: newPhone, onChange: setNewPhone, placeholder: "050-000-0000", type: "tel", dir: "ltr" },
              ].map((f) => (
                <div key={f.label}>
                  <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>{f.label}</label>
                  <input
                    style={{ ...INPUT, direction: f.dir as "rtl" | "ltr" }}
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                  תשלום חודשי (₪)
                </label>
                <input
                  style={{ ...INPUT, direction: "ltr" }}
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                  סטטוס
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as User["status"])}
                  style={{ ...INPUT, cursor: "pointer" }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {schools.length > 0 && (
                <div>
                  <label style={{ fontSize: 13, color: "rgba(240,240,245,0.7)", marginBottom: 6, display: "block" }}>
                    שיוך לבתי ספר
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {schools.map((s) => (
                      <label
                        key={s.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", borderRadius: 4, cursor: "pointer",
                          background: selectedSchools.includes(s.id) ? "rgba(0,0,255,0.08)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${selectedSchools.includes(s.id) ? "rgba(0,0,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSchools.includes(s.id)}
                          onChange={() => {
                            setSelectedSchools((prev) =>
                              prev.includes(s.id)
                                ? prev.filter((id) => id !== s.id)
                                : [...prev, s.id]
                            );
                          }}
                          style={{ width: 16, height: 16 }}
                        />
                        <span style={{ color: "#f0f0f5", fontSize: 14 }}>{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {addError && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 4, background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)", color: "#ff8080", fontSize: 13 }}>
                {addError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-start" }}>
              <button style={BTN} onClick={handleAdd} disabled={!newEmail.trim() || addLoading}>
                {addLoading ? "שולח הזמנה..." : "הוסף מנוי"}
              </button>
              <button style={{ ...BTN, background: "rgba(255,255,255,0.06)" }} onClick={() => setShowAddModal(false)}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
