"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className={cn("flex items-center gap-3", className)} {...props} ref={ref}>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-light">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-dark via-primary to-primary-light transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
          {percentage > 0 && (
            <div
              className="absolute top-0 h-full w-8 rounded-full bg-white/20 blur-sm"
              style={{ left: `${Math.max(percentage - 5, 0)}%` }}
            />
          )}
        </div>
        {showLabel && (
          <span className="text-xs font-medium text-text-secondary tabular-nums">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
