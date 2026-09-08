import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "gold";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg active:scale-[0.98]";

    const variants = {
      primary:
        "bg-primary text-white font-semibold hover:bg-primary-hover shadow-md shadow-blue-500/20 active:shadow-sm",
      gold: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:brightness-110 shadow-md shadow-blue-500/25",
      secondary:
        "bg-white text-slate-700 hover:bg-slate-50 border border-surface-border shadow-sm",
      outline:
        "border border-surface-border text-slate-700 hover:bg-blue-50/60 hover:border-primary/50",
      danger:
        "bg-status-danger text-white hover:bg-red-600 focus:ring-status-danger/40 shadow-sm",
      ghost:
        "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
    };

    const sizes = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5 font-semibold",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
