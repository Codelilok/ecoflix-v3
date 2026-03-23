import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("ecoflix_theme");
    if (stored === "light") return "light";
  } catch {}
  return "dark";
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem("ecoflix_theme", theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme, isDark: theme === "dark" };
}

export function initTheme() {
  try {
    const stored = localStorage.getItem("ecoflix_theme");
    applyTheme(stored === "light" ? "light" : "dark");
  } catch {
    applyTheme("dark");
  }
}
