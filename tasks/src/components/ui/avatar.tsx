import * as React from "react";
import { cn } from "../../lib/cn";

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary", className)}>
      {initials || "?"}
    </div>
  );
}
