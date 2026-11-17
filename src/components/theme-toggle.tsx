"use client";

import { useEffect, useSyncExternalStore } from "react";

const THEME_KEY = "orgfinance-theme";

type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Theme {
  const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem(THEME_KEY, nextTheme);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition hover:border-accent hover:text-accent"
      aria-label="Toggle theme"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-accent-strong" aria-hidden />
      <span>{theme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}
