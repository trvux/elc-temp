"use client";

import { Check, X } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/utils";

// Mirrors elc-go's domain.ValidatePassword (internal/auth/domain/types.ts) —
// kept in sync by hand; Go re-validates authoritatively on submit regardless.
const RULES = [
  { label: "Trên 8 ký tự", test: (p: string) => p.length > 8 },
  { label: "Có chữ hoa", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Có chữ thường", test: (p: string) => /[a-z]/.test(p) },
  { label: "Có chữ số", test: (p: string) => /[0-9]/.test(p) },
  { label: "Có ký tự đặc biệt", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

// Live password-strength checklist — the standard pattern for any
// account-creation/password-change form (GitHub, Microsoft, Dropbox, ...):
// show which requirements are met as the user types, rather than a single
// static hint line they only find out is wrong after submitting.
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {RULES.map((rule) => {
        const passed = password.length > 0 && rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              passed ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground",
            )}
          >
            {passed ? <Check className="size-3.5 shrink-0" weight="bold" /> : <X className="size-3.5 shrink-0" />}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
