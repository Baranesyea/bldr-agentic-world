"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { SearchIcon } from "@/components/ui/icons";

/* ─── Types ─── */
interface Subscriber {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  amount: number;
  status: string;
  subscription_start: string;
  last_payment_date: string;
  next_payment_date: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Payment {
  id: string;
  subscriber_id: string;
  amount: number;
  transaction_id: string;
  status: string;
  payment_date: string;
}

type UserStatus = "paying" | "trial" | "expired" | "blocked" | "admin";
type FilterTab = "all" | "paying" | "trial" | "blocked" | "inactive" | "tourist";
type SortKey = "joined" | "lastPayment" | "amount";

interface MergedUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  status: UserStatus;
  amount: number;
  joinedAt: string;
  lastPaymentDate: string | null;
  subscriptionStart: string | null;
  subscriberId: string | null;
  role: string;
  trialDaysRemaining?: number;
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

const STATUS_CONFIG: Record<UserStatus | "tourist", { label: string; color: string; bg: string }> = {
  paying: { label: "משלם", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  trial: { label: "ניסיון", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  expired: { label: "פג תוקף", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  blocked: { label: "חסום", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  admin: { label: "מנהל", color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
  tourist: { label: "תייר", color: "#FFB300", bg: "rgba(255,179,0,0.12)" },
};

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

/* ─── Component ─── */
export default function AdminUsersPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAmount, setNewAmount] = useState("99");
  const [addLoading, setAddLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profilesRes, subsRes, paysRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("subscribers").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("payment_date", { ascending: false }),
    ]);
    setProfiles(profilesRes.data || []);
    setSubscribers(subsRes.data || []);
    setPayments(paysRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Merge Logic ─── */
  const mergedUsers: MergedUser[] = useMemo(() => {
    const subsByEmail = new Map<string, Subscriber>();
    for (const s of subscribers) {
      if (s.email) subsByEmail.set(s.email.toLowerCase(), s);
    }

    const seen = new Set<string>();
    const result: MergedUser[] = [];

    // 1. All profiles — left join with subscribers
    for (const p of profiles) {
      const email = (p.email || "").toLowerCase();
      seen.add(email);
      const sub = subsByEmail.get(email);

      let status: UserStatus = "trial";
      if (p.role === "admin") {
        status = "admin";
      } else if (sub) {
        if (sub.status === "active") status = "paying";
        else if (sub.status === "cancelled" || sub.status === "overdue") status = "blocked";
        else if (sub.status === "trial") status = "trial";
        else status = "blocked";
      }

      result.push({
        id: p.id,
        email: p.email,
        fullName: sub?.full_name || p.full_name || "",
        phone: sub?.phone || "",
        status,
        amount: sub?.amount || 0,
        joinedAt: p.created_at || sub?.created_at || "",
        lastPaymentDate: sub?.last_payment_date || null,
        subscriptionStart: sub?.subscription_start || null,
        subscriberId: sub?.id || null,
        role: p.role || "member",
      });
    }

    // 2. Subscribers not in profiles
    for (const sub of subscribers) {
      const email = (sub.email || "").toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);

      let status: UserStatus = "paying";
      if (sub.status === "cancelled" || sub.status === "overdue") status = "blocked";
      else if (sub.status === "trial") status = "trial";
      else if (sub.status === "active") status = "paying";

      result.push({
        id: sub.id,
        email: sub.email,
        fullName: sub.full_name || "",
        phone: sub.phone || "",
        status,
        amount: sub.amount || 0,
        joinedAt: sub.created_at || "",
        lastPaymentDate: sub.last_payment_date || null,
        subscriptionStart: sub.subscription_start || null,
        subscriberId: sub.id,
        role: "member",
      });
    }

    // 3. Tourist users from localStorage
    try {
      const touristRaw = localStorage.getItem("bldr_tourist");
      if (touristRaw) {
        const t = JSON.parse(touristRaw);
        if (t.email && !seen.has(t.email.toLowerCase())) {
          seen.add(t.email.toLowerCase());
          result.push({
            id: `tourist_${t.email}`,
            email: t.email,
            fullName: t.name || "",
            phone: t.phone || "",
            status: "trial" as UserStatus,
            amount: 0,
            joinedAt: t.grantedAt || "",
            lastPaymentDate: null,
            subscriptionStart: null,
            subscriberId: null,
            role: "tourist",
          });
        }
      }
    } catch {}

    return result;
  }, [profiles, subscribers]);

  /* ─── Stats ─── */
  const totalUsers = mergedUsers.length;
  const activePaying = mergedUsers.filter((u) => u.status === "paying").length;
  const trialUsers = mergedUsers.filter((u) => u.status === "trial").length;
  const monthlyRevenue = mergedUsers
    .filter((u) => u.status === "paying")
    .reduce((sum, u) => sum + u.amount, 0);
  const totalPaymentsSum = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const payingCount = mergedUsers.filter((u) => u.subscriberId).length;
  const avgLtv = payingCount > 0 ? Math.round(totalPaymentsSum / payingCount) : 0;

  /* ─── Filter & Sort ─── */
  const filtered = useMemo(() => {
    let list = mergedUsers;

    // Tab filter
    if (filterTab === "paying") list = list.filter((u) => u.status === "paying");
    else if (filterTab === "trial") list = list.filter((u) => u.status === "trial" || u.status === "expired");
    else if (filterTab === "blocked") list = list.filter((u) => u.status === "blocked");
    else if (filterTab === "inactive") list = list.filter((u) => u.status === "expired" || u.status === "trial");
    else if (filterTab === "tourist") list = list.filter((u) => u.role === "tourist");

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "joined":
          cmp = new Date(a.joinedAt || 0).getTime() - new Date(b.joinedAt || 0).getTime();
          break;
        case "lastPayment":
          cmp =
            new Date(a.lastPaymentDate || 0).getTime() -
            new Date(b.lastPaymentDate || 0).getTime();
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [mergedUsers, filterTab, search, sortKey, sortAsc]);

  /* ─── Payments for user ─── */
  const getUserPayments = (subscriberId: string | null) => {
    if (!subscriberId) return [];
    return payments.filter((p) => p.subscriber_id === subscriberId);
  };

  /* ─── Add subscriber ─── */
  const handleAdd = async () => {
    if (!newEmail) return;
    setAddLoading(true);
    try {
      const now = new Date().toISOString();
      const nextPayment = new Date();
      nextPayment.setMonth(nextPayment.getMonth() + 1);

      const { error } = await supabase.from("subscribers").insert({
        email: newEmail.toLowerCase().trim(),
        full_name: newName,
        phone: newPhone,
        amount: parseFloat(newAmount) || 99,
        status: "active",
        subscription_start: now,
        last_payment_date: now,
        next_payment_date: nextPayment.toISOString(),
        password_token: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
      });

      if (error) {
        alert("שגיאה בהוספת המשתמש: " + error.message);
        return;
      }

      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewAmount("99");
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert("שגיאה לא צפויה, נסה שוב.");
      console.error(err);
    } finally {
      setAddLoading(false);
    }
  };

  /* ─── Update status ─── */
  const handleStatusChange = async (user: MergedUser, newStatus: string) => {
    if (!user.subscriberId) return;
    await supabase
      .from("subscribers")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", user.subscriberId);
    fetchData();
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortArrow = (key: SortKey) => (sortKey === key ? (sortAsc ? " ▲" : " ▼") : "");

  /* ─── Filter tabs ─── */
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
          <p style={{ color: "rgba(240,240,245,0.6)", marginTop: 6, fontSize: "14px", margin: "6px 0 0 0" }}>
            ניהול כל המשתמשים — מנויים, ניסיון ומנהלים
          </p>
        </div>
        <button style={BTN} onClick={() => setShowAddModal(true)}>
          + הוסף מנוי
        </button>
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
            <div style={{ fontSize: 12, color: "rgba(240,240,245,0.5)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {/* Filter Tabs */}
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

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 300, flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(240,240,245,0.35)", display: "flex" }}>
            <SearchIcon size={15} />
          </span>
          <input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...INPUT, paddingRight: 38 }}
          />
        </div>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{
            ...INPUT,
            width: "auto",
            minWidth: 140,
            cursor: "pointer",
            appearance: "none" as const,
            WebkitAppearance: "none" as const,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "left 12px center",
            paddingLeft: 32,
          }}
        >
          <option value="joined">Sort: Joined Date</option>
          <option value="lastPayment">Sort: Last Payment</option>
          <option value="amount">Sort: Amount</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "rgba(240,240,245,0.4)", fontSize: 14 }}>
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "rgba(240,240,245,0.4)", fontSize: 14 }}>
            No users found
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
                        color: "rgba(240,240,245,0.4)",
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
                  const statusInfo = user.role === "tourist" ? STATUS_CONFIG["tourist"] : STATUS_CONFIG[user.status];
                  const userPayments = getUserPayments(user.subscriberId);
                  const totalPaid = userPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

                  return (
                    <React.Fragment key={user.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : user.id)}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          background: isExpanded ? "rgba(100,100,255,0.03)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {/* Avatar */}
                        <td style={{ padding: "12px 14px" }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: GRADIENTS[idx % GRADIENTS.length],
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(user.fullName)}
                          </div>
                        </td>
                        {/* Name */}
                        <td style={{ padding: "12px 14px", color: "#f0f0f5", fontWeight: 600 }}>
                          {user.fullName || "—"}
                        </td>
                        {/* Email */}
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.6)", direction: "ltr", textAlign: "right", fontSize: 13 }}>
                          {user.email}
                        </td>
                        {/* Phone */}
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.5)", direction: "ltr", textAlign: "right", fontSize: 13 }}>
                          {user.phone || "—"}
                        </td>
                        {/* Status Badge */}
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              padding: "4px 12px",
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusInfo.label}
                            {user.status === "trial" && user.trialDaysRemaining !== undefined && (
                              <span style={{ marginRight: 4, opacity: 0.7 }}>
                                ({user.trialDaysRemaining}d)
                              </span>
                            )}
                          </span>
                        </td>
                        {/* Amount */}
                        <td style={{ padding: "12px 14px", color: "#f0f0f5", fontWeight: 600, fontSize: 13 }}>
                          {user.amount > 0 ? formatCurrency(user.amount) : "—"}
                        </td>
                        {/* Joined */}
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.5)", fontSize: 13 }}>
                          {formatDate(user.joinedAt)}
                        </td>
                        {/* Time in system */}
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.5)", fontSize: 13 }}>
                          {user.joinedAt ? (() => {
                            const diff = Date.now() - new Date(user.joinedAt).getTime();
                            const days = Math.floor(diff / 86400000);
                            if (days === 0) return "היום";
                            if (days < 7) return `${days} ימים`;
                            if (days < 30) return `${Math.floor(days / 7)} שבועות`;
                            if (days < 365) return `${Math.floor(days / 30)} חודשים`;
                            return `${Math.floor(days / 365)} שנים`;
                          })() : "—"}
                        </td>
                        {/* Last Payment */}
                        <td style={{ padding: "12px 14px", color: "rgba(240,240,245,0.5)", fontSize: 13 }}>
                          {formatDate(user.lastPaymentDate)}
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} style={{ padding: 0 }}>
                            <div
                              style={{
                                background: "rgba(100,100,255,0.02)",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                padding: "24px 28px",
                              }}
                            >
                              {/* User Info Header */}
                              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 24 }}>
                                <div
                                  style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: "50%",
                                    background: GRADIENTS[idx % GRADIENTS.length],
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: "#fff",
                                    flexShrink: 0,
                                  }}
                                >
                                  {getInitials(user.fullName)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
                                      {user.fullName || "—"}
                                    </span>
                                    <span
                                      style={{
                                        background: statusInfo.bg,
                                        color: statusInfo.color,
                                        padding: "3px 10px",
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", direction: "ltr", textAlign: "right" }}>
                                    {user.email}
                                    {user.phone && <span style={{ marginLeft: 16 }}>{user.phone}</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Summary Cards */}
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                                {[
                                  { label: "Total Paid (LTV)", value: formatCurrency(totalPaid) },
                                  { label: "Monthly Amount", value: user.amount > 0 ? formatCurrency(user.amount) : "—" },
                                  { label: "Subscription Start", value: formatDate(user.subscriptionStart) },
                                  { label: "Payments Count", value: userPayments.length.toString() },
                                ].map((s) => (
                                  <div
                                    key={s.label}
                                    style={{
                                      background: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.05)",
                                      borderRadius: 4,
                                      padding: 14,
                                    }}
                                  >
                                    <div style={{ fontSize: 11, color: "rgba(240,240,245,0.4)", marginBottom: 4 }}>
                                      {s.label}
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Payment History */}
                              <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,240,245,0.7)", marginBottom: 12 }}>
                                  Payment History ({userPayments.length})
                                </div>
                                {userPayments.length === 0 ? (
                                  <div style={{ color: "rgba(240,240,245,0.3)", fontSize: 13 }}>
                                    No payments recorded
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {userPayments.map((p) => (
                                      <div
                                        key={p.id}
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          padding: "10px 14px",
                                          background: "rgba(255,255,255,0.02)",
                                          borderRadius: 4,
                                          border: "1px solid rgba(255,255,255,0.04)",
                                        }}
                                      >
                                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                          <span style={{ color: "#f0f0f5", fontWeight: 600, fontSize: 13 }}>
                                            {formatCurrency(p.amount || 0)}
                                          </span>
                                          <span style={{ color: "rgba(240,240,245,0.4)", fontSize: 12 }}>
                                            {formatDate(p.payment_date)}
                                          </span>
                                        </div>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                          {p.transaction_id && (
                                            <span
                                              style={{
                                                color: "rgba(240,240,245,0.3)",
                                                fontSize: 11,
                                                fontFamily: "monospace",
                                                direction: "ltr",
                                              }}
                                            >
                                              #{p.transaction_id}
                                            </span>
                                          )}
                                          <span
                                            style={{
                                              background:
                                                p.status === "success"
                                                  ? "rgba(0,200,83,0.1)"
                                                  : "rgba(255,59,48,0.1)",
                                              color: p.status === "success" ? "#00C853" : "#ff6b6b",
                                              padding: "2px 8px",
                                              borderRadius: 4,
                                              fontSize: 11,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {p.status}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              {user.subscriberId && (
                                <div style={{ display: "flex", gap: 10, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                  <div style={{ fontSize: 12, color: "rgba(240,240,245,0.4)", marginLeft: 8, display: "flex", alignItems: "center" }}>
                                    Change Status:
                                  </div>
                                  {["active", "cancelled", "overdue", "trial"].map((s) => (
                                    <button
                                      key={s}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(user, s);
                                      }}
                                      style={{
                                        padding: "6px 14px",
                                        borderRadius: 6,
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        background:
                                          (user.status === "paying" && s === "active") ||
                                          (user.status === "blocked" && (s === "cancelled" || s === "overdue")) ||
                                          (user.status === "trial" && s === "trial")
                                            ? "rgba(100,100,255,0.15)"
                                            : "rgba(255,255,255,0.03)",
                                        color: "rgba(240,240,245,0.6)",
                                        fontSize: 12,
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                      }}
                                    >
                                      {s}
                                    </button>
                                  ))}
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
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#0a0a1a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              padding: 32,
              maxWidth: 440,
              width: "90%",
              direction: "rtl",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 0, marginBottom: 24 }}>
              הוספת מנוי חדש
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.6)", marginBottom: 6, display: "block" }}>
                  שם מלא
                </label>
                <input
                  style={INPUT}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="שם מלא"
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.6)", marginBottom: 6, display: "block" }}>
                  אימייל
                </label>
                <input
                  style={{ ...INPUT, direction: "ltr" }}
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.6)", marginBottom: 6, display: "block" }}>
                  טלפון
                </label>
                <input
                  style={{ ...INPUT, direction: "ltr" }}
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="050-000-0000"
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "rgba(240,240,245,0.6)", marginBottom: 6, display: "block" }}>
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
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-start" }}>
              <button style={BTN} onClick={handleAdd} disabled={addLoading || !newEmail}>
                {addLoading ? "מוסיף..." : "הוסף מנוי"}
              </button>
              <button
                style={{ ...BTN, background: "rgba(255,255,255,0.06)" }}
                onClick={() => setShowAddModal(false)}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
