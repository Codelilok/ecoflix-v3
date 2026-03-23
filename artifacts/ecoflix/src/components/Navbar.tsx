import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Heart, Menu, X, History, Home, BarChart2, Grid, Clock, Users, Dice6, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { SurpriseMe } from "./SurpriseMe";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [location] = useLocation();
  const { canInstall, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Browse", path: "/browse", icon: Grid },
    { name: "Rankings", path: "/ranking", icon: BarChart2 },
  ];

  const menuLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Browse", path: "/browse", icon: Grid },
    { name: "Rankings", path: "/ranking", icon: BarChart2 },
    { name: "My Wishlist", path: "/wishlist", icon: Heart },
    { name: "Watch History", path: "/history", icon: Clock },
    { name: "Watch Party", path: "/watch-party", icon: Users },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300 ease-in-out px-4 md:px-12 py-4",
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-md"
            : "bg-transparent"
        )}
      >
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-baseline gap-0.5 hover:scale-105 transition-transform">
              <span className="text-3xl font-display font-bold text-primary tracking-wider">ECOFLIX</span>
              <span className="text-sm font-bold text-primary/70 tracking-widest ml-1">3.0</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location === link.path ? "text-foreground font-semibold" : "text-muted-foreground"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-5">
            <Link href="/search" className="text-muted-foreground hover:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/wishlist" className="text-muted-foreground hover:text-primary transition-colors">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href="/history" className="hidden md:flex text-muted-foreground hover:text-primary transition-colors">
              <History className="h-5 w-5" />
            </Link>

            {canInstall && !isInstalled && (
              <button
                onClick={install}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Install ECOFLIX App"
              >
                <Download className="h-5 w-5" />
              </button>
            )}

            <button
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-background/98 backdrop-blur-xl border-t border-border shadow-2xl">
            <div className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-col gap-1">
              {menuLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 text-base font-medium p-3 rounded-xl transition-colors",
                      location === link.path
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {link.name}
                  </Link>
                );
              })}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSurpriseOpen(true);
                }}
                className="flex items-center gap-3 text-base font-medium p-3 rounded-xl transition-colors text-muted-foreground hover:bg-accent hover:text-foreground w-full text-left"
              >
                <Dice6 className="h-5 w-5 flex-shrink-0 text-primary" />
                Surprise Me
              </button>

              {!isInstalled && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    install();
                  }}
                  className="flex items-center gap-3 text-base font-medium p-3 rounded-xl transition-colors text-muted-foreground hover:bg-accent hover:text-foreground w-full text-left"
                >
                  <Download className="h-5 w-5 flex-shrink-0 text-primary" />
                  Install App
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {surpriseOpen && <SurpriseMe onClose={() => setSurpriseOpen(false)} />}
    </>
  );
}
