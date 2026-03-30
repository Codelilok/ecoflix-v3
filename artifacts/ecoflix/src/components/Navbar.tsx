import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Heart, Menu, X, History, Home, BarChart2, Grid, Clock, Users, Dice6, Download, Share, ArrowUpFromLine, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { SurpriseMe } from "./SurpriseMe";

function IOSInstallGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-zinc-900 rounded-t-3xl shadow-2xl border-t border-zinc-700 p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-6" />

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Install ECOFLIX</h2>
            <p className="text-xs text-zinc-400">Add to your Home Screen</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">1</div>
            <div className="flex-1">
              <p className="text-sm text-zinc-200 font-medium">Tap the Share button</p>
              <p className="text-xs text-zinc-500 mt-0.5">Find the <span className="text-zinc-300 font-medium">Share</span> icon at the bottom of your browser</p>
              <div className="mt-2 inline-flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-lg">
                <ArrowUpFromLine className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-zinc-300 font-medium">Share</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">2</div>
            <div className="flex-1">
              <p className="text-sm text-zinc-200 font-medium">Tap "Add to Home Screen"</p>
              <p className="text-xs text-zinc-500 mt-0.5">Scroll down in the share sheet to find this option</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">3</div>
            <div className="flex-1">
              <p className="text-sm text-zinc-200 font-medium">Tap "Add"</p>
              <p className="text-xs text-zinc-500 mt-0.5">ECOFLIX will appear on your Home Screen like a native app</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [location] = useLocation();
  const { canInstall, isInstalled, install, isIOS } = usePWAInstall();

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
    { name: "Sports", path: "/sports", icon: Wifi },
    { name: "My Wishlist", path: "/wishlist", icon: Heart },
    { name: "Watch History", path: "/history", icon: Clock },
    { name: "Watch Party", path: "/watch-party", icon: Users },
  ];

  const handleInstall = async () => {
    setMobileMenuOpen(false);
    if (isIOS) {
      setIosGuideOpen(true);
      return;
    }
    const result = await install();
    if (result === "unavailable") {
      setIosGuideOpen(true);
    }
  };

  const showInstallOption = !isInstalled;

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

            {(canInstall || isIOS) && showInstallOption && (
              <button
                onClick={handleInstall}
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
                <Dice6 className="h-5 w-5 flex-shrink-0" />
                Surprise Me
              </button>

              {showInstallOption && (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-3 text-base font-medium p-3 rounded-xl transition-colors text-muted-foreground hover:bg-accent hover:text-foreground w-full text-left"
                >
                  <Download className="h-5 w-5 flex-shrink-0" />
                  Install App
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {surpriseOpen && <SurpriseMe onClose={() => setSurpriseOpen(false)} />}
      {iosGuideOpen && <IOSInstallGuide onClose={() => setIosGuideOpen(false)} />}
    </>
  );
}
