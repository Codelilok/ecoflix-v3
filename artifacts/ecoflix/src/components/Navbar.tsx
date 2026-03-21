import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Heart, Menu, X, History, Home, BarChart2, Grid, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

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
  ];

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 ease-in-out px-4 md:px-12 py-4",
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-md" : "bg-transparent"
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
                  location === link.path ? "text-white font-semibold" : "text-gray-300"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/search" className="text-gray-300 hover:text-primary transition-colors">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/wishlist" className="text-gray-300 hover:text-primary transition-colors">
            <Heart className="h-5 w-5" />
          </Link>
          <Link href="/history" className="hidden md:flex text-gray-300 hover:text-primary transition-colors">
            <History className="h-5 w-5" />
          </Link>

          <button
            className="text-gray-300 hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-zinc-950/98 backdrop-blur-xl border-t border-zinc-800 shadow-2xl">
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
                      ? "bg-red-600/20 text-primary"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
