"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface School {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  whatsappLink: string | null;
  settings: Record<string, unknown>;
}

interface SchoolMember {
  membership: {
    id: string;
    userId: string;
    role: string;
    accessExpiresAt: string | null;
    expiryMode: string;
  };
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

interface SchoolCourse {
  id: string;
  courseId: string;
  isAvailable: boolean;
  availableAfterExpiry: boolean;
}

interface Course {
  id: string;
  title: string;
  status: string;
}

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

const BTN_SECONDARY: React.CSSProperties = {
  ...BTN,
  background: "rgba(255,255,255,0.06)",
  color: "rgba(240,240,245,0.7)",
};

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [schoolCourses, setSchoolCourses] = useState<SchoolCourse[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "members" | "courses">("details");

  // Edit state
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [schoolRes, membersRes, coursesRes, allCoursesRes] = await Promise.all([
        fetch(`/api/schools/${id}`),
        fetch(`/api/schools/${id}/members`),
        fetch(`/api/schools/${id}/courses`),
        fetch("/api/courses"),
      ]);
      const schoolData = await schoolRes.json();
      const membersData = await membersRes.json();
      const coursesData = await coursesRes.json();
      const allCoursesData = await allCoursesRes.json();

      if (!schoolData.error) {
        setSchool(schoolData);
        setEditName(schoolData.name);
        setEditSlug(schoolData.slug || "");
        setEditWhatsapp(schoolData.whatsappLink || "");
      }
      if (Array.isArray(membersData)) setMembers(membersData);
      if (Array.isArray(coursesData)) setSchoolCourses(coursesData);
      if (Array.isArray(allCoursesData)) setAllCourses(allCoursesData);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      await fetch(`/api/schools/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          whatsappLink: editWhatsapp || null,
        }),
      });
      fetchAll();
    } catch {}
    setSaving(false);
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await fetch(`/api/schools/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", userId }),
      });
      fetchAll();
    } catch {}
  };

  const handleToggleCourse = async (courseId: string, currentlyAvailable: boolean) => {
    // Build full courses array with this one toggled
    const courseMap = new Map(schoolCourses.map((sc) => [sc.courseId, sc]));
    const updatedCourses = allCourses.map((c) => {
      if (c.id === courseId) {
        return { courseId: c.id, isAvailable: !currentlyAvailable, availableAfterExpiry: courseMap.get(c.id)?.availableAfterExpiry ?? false };
      }
      const existing = courseMap.get(c.id);
      return {
        courseId: c.id,
        isAvailable: existing?.isAvailable ?? true,
        availableAfterExpiry: existing?.availableAfterExpiry ?? false,
      };
    });

    try {
      await fetch(`/api/schools/${id}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses: updatedCourses }),
      });
      fetchAll();
    } catch {}
  };

  const handleToggleAfterExpiry = async (courseId: string, currentVal: boolean) => {
    const courseMap = new Map(schoolCourses.map((sc) => [sc.courseId, sc]));
    const updatedCourses = allCourses.map((c) => {
      if (c.id === courseId) {
        return { courseId: c.id, isAvailable: courseMap.get(c.id)?.isAvailable ?? true, availableAfterExpiry: !currentVal };
      }
      const existing = courseMap.get(c.id);
      return {
        courseId: c.id,
        isAvailable: existing?.isAvailable ?? true,
        availableAfterExpiry: existing?.availableAfterExpiry ?? false,
      };
    });

    try {
      await fetch(`/api/schools/${id}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses: updatedCourses }),
      });
      fetchAll();
    } catch {}
  };

  if (loading) {
    return <div style={{ padding: "40px", color: "rgba(240,240,245,0.7)", textAlign: "center" }}>טוען...</div>;
  }

  if (!school) {
    return <div style={{ padding: "40px", color: "rgba(240,240,245,0.7)", textAlign: "center" }}>בית ספר לא נמצא</div>;
  }

  const courseMap = new Map(schoolCourses.map((sc) => [sc.courseId, sc]));

  const tabStyle = (tab: string) => ({
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    color: activeTab === tab ? "#f0f0f5" : "rgba(240,240,245,0.5)",
    background: activeTab === tab ? "rgba(255,255,255,0.06)" : "transparent",
    border: "none",
    borderRadius: "4px 4px 0 0",
    cursor: "pointer" as const,
    borderBottom: activeTab === tab ? "2px solid #4444ff" : "2px solid transparent",
  });

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => router.push("/admin/schools")} style={{ ...BTN_SECONDARY, padding: "8px 14px", fontSize: "12px" }}>
          ← חזרה
        </button>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f0f0f5", margin: 0 }}>
          {school.name}
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => setActiveTab("details")} style={tabStyle("details")}>פרטים</button>
        <button onClick={() => setActiveTab("members")} style={tabStyle("members")}>חברים ({members.length})</button>
        <button onClick={() => setActiveTab("courses")} style={tabStyle("courses")}>קורסים</button>
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div style={CARD}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)", display: "block", marginBottom: "6px" }}>שם</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)", display: "block", marginBottom: "6px" }}>Slug</label>
              <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} style={{ ...INPUT, direction: "ltr" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "12px", color: "rgba(240,240,245,0.5)", display: "block", marginBottom: "6px" }}>קישור וואצאפ</label>
              <input value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} style={{ ...INPUT, direction: "ltr" }} />
            </div>
          </div>
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSaveDetails} disabled={saving} style={{ ...BTN, opacity: saving ? 0.6 : 1 }}>
              {saving ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div style={{ ...CARD, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["שם", "אימייל", "תפקיד", "תפוגה", "פעולות"].map((h) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "right", color: "rgba(240,240,245,0.7)", fontWeight: 500, fontSize: "12px" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "rgba(240,240,245,0.5)" }}>
                    אין חברים בבית ספר זה
                  </td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m.membership.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "14px 16px", color: "#f0f0f5", fontWeight: 500 }}>{m.user.fullName}</td>
                  <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)", direction: "ltr", textAlign: "right" }}>{m.user.email}</td>
                  <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)" }}>
                    {m.membership.role === "admin" ? "מנהל" : "סטודנט"}
                  </td>
                  <td style={{ padding: "14px 16px", color: "rgba(240,240,245,0.7)", fontSize: "13px" }}>
                    {m.membership.accessExpiresAt
                      ? new Date(m.membership.accessExpiresAt).toLocaleDateString("he-IL")
                      : "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => handleRemoveMember(m.membership.userId)}
                      style={{ ...BTN_SECONDARY, padding: "6px 14px", fontSize: "12px", color: "rgba(255,59,48,0.7)" }}
                    >
                      הסר
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === "courses" && (
        <div style={CARD}>
          <p style={{ fontSize: "13px", color: "rgba(240,240,245,0.5)", marginTop: 0, marginBottom: "20px" }}>
            סמן אילו קורסים זמינים בבית ספר זה. &quot;זמין לאחר תפוגה&quot; = קורס שנשאר פתוח גם אחרי שתקופת השימוש פגה.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {allCourses.map((course) => {
              const sc = courseMap.get(course.id);
              const isAvailable = sc?.isAvailable ?? true;
              const afterExpiry = sc?.availableAfterExpiry ?? false;

              return (
                <div
                  key={course.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.04)",
                    opacity: isAvailable ? 1 : 0.5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={() => handleToggleCourse(course.id, isAvailable)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <span style={{ color: "#f0f0f5", fontSize: "14px", fontWeight: 500 }}>
                      {course.title}
                    </span>
                    <span style={{ fontSize: "11px", color: "rgba(240,240,245,0.4)", padding: "2px 8px", background: "rgba(255,255,255,0.04)", borderRadius: "10px" }}>
                      {course.status === "active" ? "פעיל" : course.status === "draft" ? "טיוטה" : course.status}
                    </span>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(240,240,245,0.5)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={afterExpiry}
                      onChange={() => handleToggleAfterExpiry(course.id, afterExpiry)}
                      style={{ width: "14px", height: "14px" }}
                    />
                    זמין לאחר תפוגה
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
