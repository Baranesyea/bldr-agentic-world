"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary-light glow-blue hover:glow-blue-strong",
        secondary:
          "bg-surface-light text-text-primary border border-surface-border hover:border-surface-border-hover hover:bg-surface-light/80",
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-surface-light/50",
        outline:
          "border border-surface-border text-text-primary hover:border-primary/50 hover:bg-primary/5",
        danger:
          "bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20",
        success:
          "bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
