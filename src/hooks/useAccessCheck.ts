"use client";

import { useEffect, useState } from "react";

export interface AccessStatus {
  expired: boolean;
  expiryMode: "full_lock" | "partial_lock" | null;
  expiresAt: string | null;
  availableCourseIds: string[];
  allCourseIds: string[];
  schoolId: string | null;
  loading: boolean;
}

const DEFAULT: AccessStatus = {
  expired: false,
  expiryMode: null,
  expiresAt: null,
  availableCourseIds: [],
  allCourseIds: [],
  schoolId: null,
  loading: true,
};

export function useAccessCheck(): AccessStatus {
  const [status, setStatus] = useState<AccessStatus>(DEFAULT);

  useEffect(() => {
    async function check() {
      try {
        const profile = JSON.parse(localStorage.getItem("bldr_profile_cache") || "{}");
        const userId = profile.id;
        if (!userId) {
          setStatus({ ...DEFAULT, loading: false });
          return;
        }

        // Admin sees everything
        if (profile.role === "admin") {
          setStatus({
            expired: false,
            expiryMode: null,
            expiresAt: null,
            availableCourseIds: [],
            allCourseIds: [],
            schoolId: null,
            loading: false,
          });
          return;
        }

        const schoolId = localStorage.getItem("bldr_active_school") || null;

        const params = new URLSearchParams({ userId });
        if (schoolId) params.set("schoolId", schoolId);

        const res = await fetch(`/api/access?${params}`);
        const data = await res.json();

        setStatus({
          expired: data.expired ?? false,
          expiryMode: data.expiryMode ?? null,
          expiresAt: data.expiresAt ?? null,
          availableCourseIds: data.availableCourseIds ?? [],
          allCourseIds: data.allCourseIds ?? [],
          schoolId,
          loading: false,
        });
      } catch {
        setStatus({ ...DEFAULT, loading: false });
      }
    }
    check();
  }, []);

  return status;
}

/**
 * Check if a specific course is available for the current user.
 * If availableCourseIds is empty (admin or no access control), returns true.
 */
export function isCourseAvailable(courseId: string, access: AccessStatus): boolean {
  if (access.loading) return true;
  // Admin or no access control configured
  if (access.availableCourseIds.length === 0 && access.allCourseIds.length === 0) return true;
  return access.availableCourseIds.includes(courseId);
}
