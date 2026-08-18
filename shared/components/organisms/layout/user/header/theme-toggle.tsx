"use client";

import { Button } from "@/shared/components/ui/button";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

interface ThemeToggleProps {
  variant?: "outline" | "ghost" | "default";
  className?: string;
}

export function ThemeToggle({ variant = "outline", className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by rendering after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size="icon"
        className={cn("h-9 w-9 rounded-full opacity-0", className)}
        aria-label="Toggle theme"
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("text-foreground hover:bg-muted/80 transition-colors", className)}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={20} weight="regular" />
      ) : (
        <Moon size={20} weight="regular" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
