import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Heart, Menu, X } from "lucide-react";
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
    { name: "Home", path: "/" },
    { name: "Browse", path: "/browse" },
    { name: "Rankings", path: "/ranking" },
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
          <Link href="/" className="text-3xl font-display font-bold text-primary tracking-wider hover:scale-105 transition-transform">
            ECOFLIX
          </Link>
          
          {/* Desktop Nav */}
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
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-t border-border p-4 flex flex-col gap-4 shadow-xl">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "text-lg font-medium p-2 rounded-md transition-colors",
                location === link.path ? "bg-primary/20 text-primary" : "text-gray-300 hover:bg-white/5"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
