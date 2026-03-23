import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const stored = localStorage.getItem("ecoflix_dark_mode");
const isDark = stored !== null ? JSON.parse(stored) : true;
document.documentElement.classList.add(isDark ? "dark-mode" : "light-mode");

createRoot(document.getElementById("root")!).render(<App />);
