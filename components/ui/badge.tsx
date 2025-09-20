import { HTMLAttributes } from "react";
import { cn } from "./lib/utils";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive";

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  destructive: "bg-destructive/10 text-destructive"
};

export function Badge({ className, variant = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
