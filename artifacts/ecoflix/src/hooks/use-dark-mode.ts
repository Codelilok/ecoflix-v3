import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

export function useDarkMode() {
  const [isDark, setIsDark] = useLocalStorage<boolean>("ecoflix_dark_mode", true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark-mode");
      root.classList.remove("light-mode");
    } else {
      root.classList.add("light-mode");
      root.classList.remove("dark-mode");
    }
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);

  return { isDark, toggle };
}
