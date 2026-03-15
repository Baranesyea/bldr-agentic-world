import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary-light border border-primary/20",
        secondary: "bg-surface-light text-text-secondary border border-surface-border",
        success: "bg-accent-green/15 text-accent-green border border-accent-green/20",
        warning: "bg-accent-amber/15 text-accent-amber border border-accent-amber/20",
        danger: "bg-accent-red/15 text-accent-red border border-accent-red/20",
        outline: "border border-surface-border text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
