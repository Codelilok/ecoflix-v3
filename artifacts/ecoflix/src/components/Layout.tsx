import { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative selection:bg-primary selection:text-white">
      <Navbar />
      <main className="flex-grow flex flex-col">
        {children}
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border mt-auto">
        <p>© {new Date().getFullYear()} ECOFLIX. Powered by XCASPER API.</p>
      </footer>
    </div>
  );
}
