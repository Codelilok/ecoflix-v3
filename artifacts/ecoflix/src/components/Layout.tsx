import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { motion } from "framer-motion";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative selection:bg-primary selection:text-white">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow flex flex-col"
      >
        {children}
      </motion.main>

      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-white/5 mt-auto">
        <p>© {new Date().getFullYear()} ECOFLIX 3.0</p>
      </footer>
    </div>
  );
}
