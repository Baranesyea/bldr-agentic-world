"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getTouristData } from "@/hooks/useUser";

export function TouristGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const tourist = getTouristData();
    if (!tourist) return;

    const type = tourist.type || "lesson";

    // Always allow profile
    if (pathname === "/profile" || pathname?.startsWith("/profile")) return;

    // Allow social and calendar (with pricing popup for interactions)
    if (pathname === "/social" || pathname?.startsWith("/social")) return;
    if (pathname === "/calendar" || pathname?.startsWith("/calendar")) return;

    // Type-specific access
    if (type === "lesson") {
      const lessonPath = `/courses/${tourist.courseId}/lessons/${tourist.lessonId}`;
      if (pathname === lessonPath || pathname?.startsWith(lessonPath)) return;
      router.replace(lessonPath);
      return;
    }

    if (type === "course") {
      const coursePath = `/courses/${tourist.courseId}`;
      if (pathname === coursePath || pathname?.startsWith(coursePath)) return;
      router.replace(coursePath);
      return;
    }

    if (type === "case_study") {
      if (pathname === "/case-studies" || pathname?.startsWith("/case-studies")) return;
      router.replace("/case-studies");
      return;
    }

    // Fallback
    router.replace("/profile");
  }, [pathname, router]);

  return <>{children}</>;
}
