"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: "admin" | "member" | "tourist";
  created_at: string;
}

export interface TouristData {
  type?: "lesson" | "course" | "case_study";
  courseId?: string;
  lessonId?: string;
  lessonTitle?: string;
  caseStudyId?: string;
  name: string;
  email: string;
  phone: string;
  tokenUsed: string;
  grantedAt: string;
}

export function getTouristData(): TouristData | null {
  try {
    const stored = localStorage.getItem("bldr_tourist");
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

const CACHE_KEY = "bldr_profile_cache";
const USER_ID_KEY = "bldr_current_user_id";

// Keys that contain user-specific data and must be cleared on user switch
const USER_DATA_KEYS = [
  "bldr_user_profile", "bldr_tourist", "bldr_active_school",
  "bldr_notes", "bldr_completed_lessons", "bldr_prompt_logs",
  "bldr_notifications", "bldr_trial", "bldr_user_settings",
  "bldr_login_count", "bldr_feedback", "bldr_questionnaire_done",
];

/**
 * Clear all user-specific localStorage when a different user logs in.
 * Prevents data leakage between users on the same browser.
 */
function clearStaleUserData(newUserId: string) {
  try {
    const previousUserId = localStorage.getItem(USER_ID_KEY);
    if (previousUserId && previousUserId !== newUserId) {
      USER_DATA_KEYS.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem(CACHE_KEY);
    }
    localStorage.setItem(USER_ID_KEY, newUserId);
  } catch {}
}

function getCachedProfile(): Profile | null {
  try {
    // Try sessionStorage first, then localStorage
    const cached = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

function setCachedProfile(profile: Profile | null) {
  try {
    if (profile) {
      const json = JSON.stringify(profile);
      sessionStorage.setItem(CACHE_KEY, json);
      localStorage.setItem(CACHE_KEY, json);
    } else {
      sessionStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_KEY);
    }
  } catch {}
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(getCachedProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        clearStaleUserData(user.id);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error) console.error("Profile fetch error:", error);
        else {
          setProfile(data as Profile);
          setCachedProfile(data as Profile);
        }
      }

      setLoading(false);
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          clearStaleUserData(session.user.id);
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setProfile(data as Profile | null);
          setCachedProfile(data as Profile | null);
        } else {
          setProfile(null);
          setCachedProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const touristData = typeof window !== "undefined" ? getTouristData() : null;
  const isTourist = profile?.role === "tourist" || !!touristData;

  return {
    user,
    profile,
    loading,
    isAdmin: profile?.role === "admin",
    isTourist,
    touristData,
  };
}
