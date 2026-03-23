import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Users, Trophy, Compass, Zap } from "lucide-react";

const SITE = "https://1dce5dda-9a65-4198-8cc6-700829b3f35a-00-1qxz823skz12q.picard.replit.dev";

const SCENE_DURATIONS = [
  3000,  // 0: Intro
  7000,  // 1: Homepage
  6000,  // 2: Browse & Discover
  6000,  // 3: Rankings
  7000,  // 4: Watch Party
  4000,  // 5: Outro
];
const TOTAL = SCENE_DURATIONS.reduce((a, b) => a + b, 0);

type Scene = {
  path: string;
  scrollY?: number;
};

const PRELOADED: Scene[] = [
  { path: "/" },
  { path: "/browse" },
  { path: "/ranking" },
  { path: "/watch-party" },
];

export default function App() {
  const [currentScene, setCurrentScene] = useState(0);
  const [iframesReady, setIframesReady] = useState(false);
  const loadCount = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScene((p) => (p + 1) % SCENE_DURATIONS.length);
    }, SCENE_DURATIONS[currentScene]);
    return () => clearTimeout(timer);
  }, [currentScene]);

  const handleLoad = () => {
    loadCount.current += 1;
    if (loadCount.current >= PRELOADED.length) setIframesReady(true);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Pre-load all iframes silently in background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {PRELOADED.map(({ path }) => (
          <iframe
            key={path}
            src={SITE + path}
            onLoad={handleLoad}
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
            title={`preload-${path}`}
          />
        ))}
      </div>

      {/* Global persistent background */}
      <GlobalBg currentScene={currentScene} />

      {/* Progress bar + logo always visible */}
      <HUD currentScene={currentScene} total={TOTAL} />

      {/* Scenes */}
      <AnimatePresence mode="wait">
        {currentScene === 0 && <IntroScene key="intro" />}
        {currentScene === 1 && <SiteScene key="home"
          path="/"
          icon={<Play className="w-6 h-6" />}
          tag="Your Streaming Home"
          title={<>Watch anything.<br /><span className="text-[#E50914]">Anytime.</span></>}
          description="A curated homepage with trending series, hot picks, and your continue-watching row — all in one place."
          accentColor="#E50914"
          panFrom={{ y: 0 }} panTo={{ y: -120 }}
        />}
        {currentScene === 2 && <SiteScene key="browse"
          path="/browse"
          icon={<Compass className="w-6 h-6" />}
          tag="Browse & Discover"
          title={<>Every genre.<br /><span className="text-[#0D9488]">One platform.</span></>}
          description="Action, K-Drama, Nollywood, Anime — filter by genre and explore thousands of titles with ratings."
          accentColor="#0D9488"
          panFrom={{ x: 0, y: 0 }} panTo={{ x: 0, y: -180 }}
        />}
        {currentScene === 3 && <SiteScene key="rankings"
          path="/ranking"
          icon={<Trophy className="w-6 h-6" />}
          tag="Top Rankings"
          title={<>What's #1<br /><span className="text-[#F59E0B]">right now?</span></>}
          description="See real-time rankings for the most-watched movies and TV shows. Gold, silver, bronze — know what's hot."
          accentColor="#F59E0B"
          panFrom={{ x: 0, y: 0 }} panTo={{ x: 0, y: -200 }}
        />}
        {currentScene === 4 && <SiteScene key="party"
          path="/watch-party"
          icon={<Users className="w-6 h-6" />}
          tag="Watch Party"
          title={<>Watch together.<br /><span className="text-[#7C3AED]">Anywhere.</span></>}
          description="Create a party, share the 6-digit code, let the coin flip decide the movie, and stream in sync with live chat."
          accentColor="#7C3AED"
          panFrom={{ x: 0, y: 0 }} panTo={{ x: 0, y: 0 }}
          highlight
        />}
        {currentScene === 5 && <OutroScene key="outro" />}
      </AnimatePresence>
    </div>
  );
}

// ── GLOBAL BACKGROUND ────────────────────────────────────────────────────────

function GlobalBg({ currentScene }: { currentScene: number }) {
  const colors: Record<number, string> = {
    0: "#E50914",
    1: "#E50914",
    2: "#0D9488",
    3: "#F59E0B",
    4: "#7C3AED",
    5: "#E50914",
  };
  const c = colors[currentScene] ?? "#E50914";

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{ background: `radial-gradient(ellipse at 20% 50%, ${c}10 0%, #000 60%)` }}
        transition={{ duration: 2 }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

// ── HUD ──────────────────────────────────────────────────────────────────────

function HUD({ currentScene, total }: { currentScene: number; total: number }) {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Top progress bar */}
      <motion.div
        className="absolute top-0 left-0 h-[3px] bg-[#E50914]"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: total / 1000, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}

// ── BROWSER MOCKUP ────────────────────────────────────────────────────────────

const IFRAME_W = 1280;
const IFRAME_H = 720;
const CHROME_H = 32;

type BrowserProps = {
  path: string;
  accentColor: string;
  panFrom?: Record<string, number>;
  panTo?: Record<string, number>;
  highlight?: boolean;
};

function BrowserMockup({ path, accentColor, panFrom = {}, panTo = {}, highlight }: BrowserProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mockW, setMockW] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setMockW(entry.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scale = mockW / IFRAME_W;
  const mockH = Math.round(mockW * (IFRAME_H / IFRAME_W)) + CHROME_H;
  const contentH = mockH - CHROME_H;

  return (
    <div ref={containerRef} className="w-full">
      <motion.div
        className="relative rounded-lg overflow-hidden w-full"
        style={{
          height: mockH,
          boxShadow: highlight
            ? `0 0 0 2px ${accentColor}, 0 0 50px ${accentColor}40, 0 20px 60px rgba(0,0,0,0.9)`
            : `0 0 0 1px ${accentColor}30, 0 20px 60px rgba(0,0,0,0.9)`,
        }}
        initial={{ scale: 0.93, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Chrome bar */}
        <div
          className="flex items-center gap-2 px-3 flex-shrink-0"
          style={{ height: CHROME_H, backgroundColor: "#111", borderBottom: "1px solid #1e1e1e" }}
        >
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div
            className="flex-1 mx-3 h-[18px] rounded text-[10px] flex items-center justify-center text-gray-600"
            style={{ backgroundColor: "#181818" }}
          >
            ecoflix.app{path === "/" ? "" : path}
          </div>
        </div>

        {/* Viewport */}
        <div style={{ width: mockW, height: contentH, overflow: "hidden", backgroundColor: "#000" }}>
          <motion.div
            style={{ width: mockW, height: contentH }}
            animate={panTo}
            initial={panFrom}
            transition={{ delay: 1.8, duration: 3.5, ease: "easeInOut" }}
          >
            <iframe
              src={SITE + path}
              title={`ecoflix-${path}`}
              style={{
                width: IFRAME_W,
                height: IFRAME_H,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                border: "none",
                pointerEvents: "none",
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ── SCENE WRAPPER ─────────────────────────────────────────────────────────────

type SiteSceneProps = {
  path: string;
  icon: React.ReactNode;
  tag: string;
  title: React.ReactNode;
  description: string;
  accentColor: string;
  panFrom?: Record<string, number>;
  panTo?: Record<string, number>;
  highlight?: boolean;
};

function SiteScene({ path, icon, tag, title, description, accentColor, panFrom, panTo, highlight }: SiteSceneProps) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col md:flex-row items-stretch overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Text panel — top on mobile, left on desktop */}
      <div
        className="flex-shrink-0 flex flex-col justify-center px-6 py-5 md:px-10 md:py-10 md:w-[38%] md:h-full"
        style={{ borderBottom: `1px solid ${accentColor}15` }}
      >
        <motion.div
          className="flex items-center gap-2 mb-3 md:mb-5"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {icon}
          </div>
          <span className="text-[10px] md:text-xs font-semibold tracking-widest uppercase" style={{ color: accentColor }}>
            {tag}
          </span>
        </motion.div>

        <motion.h2
          className="text-3xl md:text-5xl font-black leading-tight md:leading-[1.08] mb-3 md:mb-5"
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {title}
        </motion.h2>

        <motion.p
          className="text-sm md:text-base text-white/50 leading-relaxed max-w-xs hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {description}
        </motion.p>

        <motion.div
          className="mt-4 md:mt-8 h-px"
          style={{ background: `linear-gradient(to right, ${accentColor}60, transparent)` }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.85, duration: 0.8 }}
        />

        <motion.div
          className="mt-3 md:mt-6 font-bold tracking-widest"
          style={{ color: accentColor, fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(14px, 2vw, 20px)", letterSpacing: "0.25em" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          ECOFLIX 3.0
        </motion.div>
      </div>

      {/* Browser panel — bottom on mobile, right on desktop */}
      <div
        className="flex-1 flex items-center justify-center p-3 md:p-6 lg:p-8 min-h-0"
        style={{ borderLeft: `1px solid ${accentColor}10` }}
      >
        <div className="w-full max-w-full">
          <BrowserMockup path={path} accentColor={accentColor} panFrom={panFrom} panTo={panTo} highlight={highlight} />
        </div>
      </div>
    </motion.div>
  );
}

// ── INTRO SCENE ───────────────────────────────────────────────────────────────

function IntroScene() {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(12px)" }}
      transition={{ duration: 0.7 }}
    >
      {/* Glow rings */}
      <motion.div
        className="absolute w-[55vw] h-[55vw] rounded-full"
        style={{ border: "1px solid #E5091415" }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2 }}
      />
      <motion.div
        className="absolute w-[38vw] h-[38vw] rounded-full"
        style={{ border: "1px solid #E5091420" }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, delay: 0.15 }}
      />

      <div style={{ overflow: "hidden" }}>
        <motion.h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "17vw",
            lineHeight: 1,
            color: "#E50914",
            textShadow: "0 0 100px #E5091460, 0 0 200px #E5091420",
          }}
          initial={{ y: "105%" }}
          animate={{ y: 0 }}
          exit={{ y: "-105%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          ECOFLIX
        </motion.h1>
      </div>

      <motion.div
        className="flex items-center gap-4 mt-3"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.8 }}
      >
        <div className="h-px w-12 bg-white/20" />
        <span className="text-xs tracking-[0.45em] text-white/40 uppercase">Version 3.0 · Feature Showcase</span>
        <div className="h-px w-12 bg-white/20" />
      </motion.div>

      <motion.div
        className="flex gap-3 mt-9 flex-wrap justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {["Watch Party", "Browse", "Rankings", "HD Quality"].map((f, i) => (
          <motion.span
            key={f}
            className="text-xs px-4 py-2 rounded-full border border-white/10 text-white/40"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 + i * 0.09 }}
          >
            {f}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── OUTRO SCENE ───────────────────────────────────────────────────────────────

function OutroScene() {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="absolute w-[60vw] h-[60vw] rounded-full"
        style={{ border: "1px solid #E5091420", boxShadow: "0 0 120px #E5091415" }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      />

      <div style={{ overflow: "hidden" }}>
        <motion.h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "15vw",
            lineHeight: 1,
            color: "#E50914",
            textShadow: "0 0 120px #E5091460",
          }}
          initial={{ y: "105%" }}
          animate={{ y: 0 }}
          exit={{ y: "-105%" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          ECOFLIX
        </motion.h1>
      </div>

      <motion.p
        className="text-lg text-white/40 mt-4 tracking-[0.25em] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Start streaming today
      </motion.p>

      <motion.div
        className="flex items-center gap-3 mt-10 px-8 py-3 rounded-full text-sm font-bold"
        style={{ backgroundColor: "#E50914" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        <Play className="w-4 h-4 fill-white" />
        Watch Now
      </motion.div>
    </motion.div>
  );
}
