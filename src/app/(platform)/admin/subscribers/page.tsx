"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px",
  padding: "28px",
  marginBottom: "24px",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#f0f0f5",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

const BTN_STYLE: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1aff, #4444ff)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 20px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(240,240,245,0.6)",
  marginBottom: "6px",
  display: "block",
};

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

interface Payment {
  id: string;
  subscriber_id: string;
  amount: number;
  transaction_id: string;
  status: string;
  payment_date: string;
}

type StatusFilter = "all" | "active" | "overdue" | "cancelled" | "trial";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(0,200,83,0.1)", color: "#00C853", label: "Active" },
  overdue: { bg: "rgba(255,59,48,0.1)", color: "#ff6b6b", label: "Overdue" },
  cancelled: { bg: "rgba(255,255,255,0.06)", color: "rgba(240,240,245,0.4)", label: "Cancelled" },
  trial: { bg: "rgba(0,100,255,0.1)", color: "#4488ff", label: "Trial" },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCurrency(n: number) {
  return `₪${n.toLocaleString()}`;
}

export default function SubscribersPage() {
  const supabase = createClient();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAmount, setNewAmount] = useState("99");
  const [addLoading, setAddLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [subsRes, paysRes] = await Promise.all([
      supabase.from("subscribers").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("payment_date", { ascending: false }),
    ]);
    setSubscribers(subsRes.data || []);
    setPayments(paysRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const activeSubs = subscribers.filter((s) => s.status === "active");
  const monthlyRevenue = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0);
  const avgLtv = subscribers.length
    ? subscribers.reduce((sum, s) => {
        const subPayments = payments.filter((p) => p.subscriber_id === s.id);
        return sum + subPayments.reduce((ps, p) => ps + (p.amount || 0), 0);
      }, 0) / subscribers.length
    : 0;

  // Filter
  const filtered = subscribers.filter((s) => {
    const matchSearch =
      !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = async () => {
    if (!newEmail) return;
    setAddLoading(true);
    const now = new Date().toISOString();
    const nextPayment = new Date();
    nextPayment.setMonth(nextPayment.getMonth() + 1);

    await supabase.from("subscribers").insert({
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

    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewAmount("99");
    setShowAddModal(false);
    setAddLoading(false);
    fetchData();
  };

  const getSubPayments = (subId: string) =>
    payments.filter((p) => p.subscriber_id === subId);

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto", direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#fff", margin: 0 }}>
            Subscribers
          </h1>
          <p style={{ color: "rgba(240,240,245,0.6)", marginTop: 6, fontSize: "14px" }}>
            CRM — Manage subscriptions, payment history, and revenue tracking
          </p>
        </div>
        <button
          style={BTN_STYLE}
          onClick={() => setShowAddModal(true)}
        >
          + Add Subscriber
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28, marginTop: 24 }}>
        {[
          { label: "Total Subscribers", value: subscribers.length.toString(), color: "#f0f0f5" },
          { label: "Monthly Revenue", value: formatCurrency(monthlyRevenue), color: "#00C853" },
          { label: "Average LTV", value: formatCurrency(Math.round(avgLtv)), color: "#4488ff" },
        ].map((stat) => (
          <div key={stat.label} style={CARD_STYLE}>
            <div style={{ fontSize: 13, color: "rgba(240,240,245,0.5)", marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...INPUT_STYLE, maxWidth: 320, direction: "ltr" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "active", "overdue", "cancelled", "trial"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: statusFilter === s ? "rgba(0,0,255,0.4)" : "rgba(255,255,255,0.08)",
                background: statusFilter === s ? "rgba(0,0,255,0.15)" : "rgba(255,255,255,0.03)",
                color: statusFilter === s ? "#6666ff" : "rgba(240,240,245,0.5)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s === "all" ? "All" : STATUS_COLORS[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "rgba(240,240,245,0.4)" }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "rgba(240,240,245,0.4)" }}>
            No subscribers found
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Name", "Email", "Phone", "Amount", "Status", "Start Date", "Last Payment"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 16px",
                        textAlign: "right",
                        color: "rgba(240,240,245,0.4)",
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => {
                  const isExpanded = expandedId === sub.id;
                  const subPayments = getSubPayments(sub.id);
                  const statusInfo = STATUS_COLORS[sub.status] || STATUS_COLORS.active;

                  return (
                    <React.Fragment key={sub.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          background: isExpanded ? "rgba(0,0,255,0.03)" : "transparent",
                        }}
                        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "14px 16px", color: "#f0f0f5", fontWeight: 600 }}>
                          {sub.full_name || "—"}
                        </td>
                        <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)", direction: "ltr", textAlign: "right" }}>
                          {sub.email}
                        </td>
                        <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.6)", direction: "ltr", textAlign: "right" }}>
                          {sub.phone || "—"}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#f0f0f5", fontWeight: 600 }}>
                          {formatCurrency(sub.amount || 0)}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.5)" }}>
                          {formatDate(sub.subscription_start)}
                        </td>
                        <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.5)" }}>
                          {formatDate(sub.last_payment_date)}
                        </td>
                      </tr>

                      {/* Expanded Payment History */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <div style={{
                              background: "rgba(0,0,255,0.02)",
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                              padding: "16px 24px",
                            }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,240,245,0.7)", marginBottom: 12 }}>
                                Payment History ({subPayments.length})
                              </div>
                              {subPayments.length === 0 ? (
                                <div style={{ color: "rgba(240,240,245,0.3)", fontSize: 13 }}>
                                  No payments recorded
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {subPayments.map((p) => (
                                    <div
                                      key={p.id}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "10px 14px",
                                        background: "rgba(255,255,255,0.02)",
                                        borderRadius: 8,
                                        border: "1px solid rgba(255,255,255,0.04)",
                                      }}
                                    >
                                      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                                        <span style={{ color: "#f0f0f5", fontWeight: 600 }}>
                                          {formatCurrency(p.amount || 0)}
                                        </span>
                                        <span style={{ color: "rgba(240,240,245,0.4)", fontSize: 12 }}>
                                          {formatDate(p.payment_date)}
                                        </span>
                                      </div>
                                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        {p.transaction_id && (
                                          <span style={{ color: "rgba(240,240,245,0.3)", fontSize: 11, fontFamily: "monospace", direction: "ltr" }}>
                                            #{p.transaction_id}
                                          </span>
                                        )}
                                        <span style={{
                                          background: p.status === "success" ? "rgba(0,200,83,0.1)" : "rgba(255,59,48,0.1)",
                                          color: p.status === "success" ? "#00C853" : "#ff6b6b",
                                          padding: "2px 8px",
                                          borderRadius: 4,
                                          fontSize: 11,
                                          fontWeight: 600,
                                        }}>
                                          {p.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Next payment date */}
                              {sub.next_payment_date && (
                                <div style={{ marginTop: 12, fontSize: 12, color: "rgba(240,240,245,0.4)" }}>
                                  Next payment: {formatDate(sub.next_payment_date)}
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
              borderRadius: 20,
              padding: "32px",
              maxWidth: 440,
              width: "90%",
              direction: "rtl",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginTop: 0, marginBottom: 24 }}>
              Add Subscriber
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={LABEL_STYLE}>Full Name</label>
                <input
                  style={INPUT_STYLE}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Email</label>
                <input
                  style={{ ...INPUT_STYLE, direction: "ltr" }}
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Phone</label>
                <input
                  style={{ ...INPUT_STYLE, direction: "ltr" }}
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="050-000-0000"
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Monthly Amount (₪)</label>
                <input
                  style={{ ...INPUT_STYLE, direction: "ltr" }}
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-start" }}>
              <button
                style={BTN_STYLE}
                onClick={handleAdd}
                disabled={addLoading || !newEmail}
              >
                {addLoading ? "Adding..." : "Add Subscriber"}
              </button>
              <button
                style={{ ...BTN_STYLE, background: "rgba(255,255,255,0.06)" }}
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
