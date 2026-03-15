"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "./button";

const bannerVariants = cva(
  "relative overflow-hidden rounded-xl border shadow-lg text-sm",
  {
    variants: {
      variant: {
        default: "bg-surface-light/60 border-surface-border",
        info: "bg-primary/5 border-primary/20 text-primary-light",
        success:
          "bg-accent-green/5 border-accent-green/20 text-accent-green",
        warning:
          "bg-accent-amber/5 border-accent-amber/20 text-accent-amber",
        premium:
          "bg-gradient-to-r from-primary/10 to-primary-light/10 border-primary/30 text-primary-light",
      },
      size: {
        default: "py-2 px-3",
        sm: "text-xs py-1.5 px-2.5",
        lg: "text-base py-4 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type BannerProps = React.ComponentProps<"div"> &
  VariantProps<typeof bannerVariants> & {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    showShade?: boolean;
    show?: boolean;
    onHide?: () => void;
    action?: React.ReactNode;
    closable?: boolean;
    autoHide?: number;
  };

export function Banner({
  variant = "default",
  size = "default",
  title,
  description,
  icon,
  showShade = false,
  show = true,
  onHide,
  action,
  closable = false,
  className,
  autoHide,
  ...props
}: BannerProps) {
  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => onHide?.(), autoHide);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onHide]);

  if (!show) return null;

  return (
    <div
      className={cn(bannerVariants({ variant, size }), className)}
      role="status"
      {...props}
    >
      {showShade && (
        <div className="absolute inset-0 -z-10 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{title}</p>
            {description && (
              <p className="text-xs opacity-70 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {action}
          {closable && (
            <Button onClick={onHide} size="icon-sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
