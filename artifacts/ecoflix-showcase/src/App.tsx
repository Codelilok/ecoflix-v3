import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Users, Trophy, Star, Clock, Subtitles, ChevronRight } from "lucide-react";

const SCENE_DURATIONS = [
  3500,  // 0: Intro
  7000,  // 1: Watch Party (hero feature)
  5000,  // 2: Rankings
  5000,  // 3: Content Discovery
  4500,  // 4: Continue Watching
  4500,  // 5: Quality & Subtitles
  4000,  // 6: Outro
];

const TOTAL = SCENE_DURATIONS.reduce((a, b) => a + b, 0);

const BRAND_RED = "#E50914";
const BRAND_PURPLE = "#7C3AED";
const BRAND_GOLD = "#F59E0B";
const BRAND_TEAL = "#0D9488";

const SCENE_COLORS: Record<number, string> = {
  0: BRAND_RED,
  1: BRAND_PURPLE,
  2: BRAND_GOLD,
  3: BRAND_TEAL,
  4: "#EA580C",
  5: "#3B82F6",
  6: BRAND_RED,
};

export default function App() {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScene((prev) => (prev + 1) % SCENE_DURATIONS.length);
    }, SCENE_DURATIONS[currentScene]);
    return () => clearTimeout(timer);
  }, [currentScene]);

  const accent = SCENE_COLORS[currentScene];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <GlobalBackground currentScene={currentScene} accent={accent} />
      <PersistentElements currentScene={currentScene} accent={accent} total={TOTAL} />

      <AnimatePresence mode="wait">
        {currentScene === 0 && <IntroScene key="intro" accent={accent} />}
        {currentScene === 1 && <WatchPartyScene key="party" accent={accent} />}
        {currentScene === 2 && <RankingsScene key="rankings" accent={accent} />}
        {currentScene === 3 && <DiscoveryScene key="discovery" accent={accent} />}
        {currentScene === 4 && <ContinueScene key="continue" accent={accent} />}
        {currentScene === 5 && <QualityScene key="quality" accent={accent} />}
        {currentScene === 6 && <OutroScene key="outro" accent={accent} />}
      </AnimatePresence>
    </div>
  );
}

function GlobalBackground({ currentScene, accent }: { currentScene: number; accent: string }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(ellipse at ${currentScene % 2 === 0 ? "70% 30%" : "30% 70%"}, ${accent}18 0%, #000 65%)`,
        }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full blur-[120px] float-anim"
        style={{ backgroundColor: `${accent}12` }}
        animate={{ x: currentScene % 2 === 0 ? "5vw" : "55vw", y: currentScene % 3 === 0 ? "5vh" : "45vh" }}
        transition={{ duration: 5, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[30vw] h-[30vw] rounded-full blur-[80px] float-anim-slow"
        style={{ backgroundColor: "#ffffff08" }}
        animate={{ x: currentScene % 2 === 0 ? "70vw" : "20vw", y: currentScene % 2 === 0 ? "60vh" : "20vh" }}
        transition={{ duration: 6, ease: "easeInOut" }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Scan line effect */}
      <div
        className="absolute left-0 w-full h-px scan-line"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}30, transparent)` }}
      />

      {/* Grid lines subtle */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}

function PersistentElements({ currentScene, accent, total }: { currentScene: number; accent: string; total: number }) {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Top-left logo */}
      <motion.div
        className="absolute top-8 left-10 font-display text-3xl tracking-widest"
        style={{ fontFamily: "'Bebas Neue', sans-serif", color: accent, textShadow: `0 0 30px ${accent}60` }}
        animate={{ color: accent }}
        transition={{ duration: 1.5 }}
      >
        ECOFLIX
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="absolute top-0 left-0 h-[3px]"
        style={{ backgroundColor: accent }}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: total / 1000, ease: "linear", repeat: Infinity }}
      />

      {/* Scene dots */}
      <div className="absolute top-6 right-10 flex gap-2 items-center">
        {SCENE_DURATIONS.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width: i === currentScene ? 24 : 6,
              height: 6,
              backgroundColor: i === currentScene ? accent : "rgba(255,255,255,0.2)",
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── SCENE 0: INTRO ───────────────────────────────────────────────────────────
function IntroScene({ accent }: { accent: string }) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.15, filter: "blur(20px)" }}
      transition={{ duration: 0.6 }}
    >
      {/* Big ECOFLIX text */}
      <div className="overflow-hidden">
        <motion.h1
          className="font-display text-[18vw] leading-none tracking-tight"
          style={{ fontFamily: "'Bebas Neue', sans-serif", color: accent, textShadow: `0 0 80px ${accent}50, 0 0 160px ${accent}20` }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          ECOFLIX
        </motion.h1>
      </div>

      <motion.div
        className="flex items-center gap-4 mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        <div className="h-px w-16 bg-white/30" />
        <p className="text-sm font-light tracking-[0.4em] text-white/60 uppercase">Your World. Your Stream.</p>
        <div className="h-px w-16 bg-white/30" />
      </motion.div>

      {/* Feature pills */}
      <motion.div
        className="flex gap-3 mt-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      >
        {["Watch Party", "Rankings", "4K Quality", "Anime · K-Drama · Nollywood"].map((label, i) => (
          <motion.div
            key={label}
            className="px-4 py-2 rounded-full text-xs font-medium border"
            style={{ borderColor: `${accent}40`, color: "rgba(255,255,255,0.6)", backgroundColor: `${accent}10` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 + i * 0.1 }}
          >
            {label}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── SCENE 1: WATCH PARTY ─────────────────────────────────────────────────────
function WatchPartyScene({ accent }: { accent: string }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1800);
    const t2 = setTimeout(() => setPhase(2), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center"
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      exit={{ clipPath: "inset(0 0% 0 100%)" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Left text */}
      <div className="w-1/2 px-16 flex flex-col justify-center">
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
            <Users style={{ color: accent }} className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: accent }}>Watch Party</span>
        </motion.div>

        <motion.h2
          className="text-6xl font-black leading-[1.05] mb-6"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Watch together.<br />
          <span style={{ color: accent }}>Anywhere.</span>
        </motion.h2>

        <motion.p
          className="text-lg text-white/50 max-w-xs leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Sync playback with friends in real-time. Live chat, typing indicators, and a coin flip to pick the movie.
        </motion.p>

        <motion.div
          className="flex flex-col gap-3 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          {["6-digit party code", "Real-time sync", "Live chat", "Coin flip picker"].map((feat, i) => (
            <div key={feat} className="flex items-center gap-3 text-sm text-white/60">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
              {feat}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right visual */}
      <div className="w-1/2 h-full flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.div
              key="phase0"
              className="relative"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-80 h-80 rounded-full border flex items-center justify-center" style={{ borderColor: `${accent}30` }}>
                <div className="w-64 h-64 rounded-full border flex items-center justify-center" style={{ borderColor: `${accent}20` }}>
                  <Users style={{ color: accent }} className="w-20 h-20 opacity-40" />
                </div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px solid ${accent}`, boxShadow: `0 0 60px ${accent}30` }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}

          {phase === 1 && (
            <motion.div
              key="phase1"
              className="rounded-2xl p-8 text-center w-80"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${accent}30`, backdropFilter: "blur(20px)", boxShadow: `0 0 40px ${accent}15` }}
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-xs tracking-widest uppercase text-white/40 mb-3">Party Code</p>
              <div className="text-5xl font-mono font-bold tracking-[0.2em] mb-8" style={{ color: accent, textShadow: `0 0 20px ${accent}50` }}>
                8X9 · 2M4
              </div>
              <div className="flex items-center justify-center gap-1 mb-6">
                {[{ bg: "#3B82F6", label: "A" }, { bg: "#10B981", label: "B" }].map(({ bg, label }, i) => (
                  <div
                    key={label}
                    className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: bg, marginLeft: i > 0 ? -8 : 0, zIndex: 2 - i }}
                  >
                    {label}
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-xs text-white/40" style={{ backgroundColor: "#1f1f1f", marginLeft: -8 }}>
                  +1
                </div>
              </div>
              <div className="text-xs text-white/30">Waiting for movie selection...</div>
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div
              key="phase2"
              className="flex flex-col items-center gap-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 120 }}
            >
              <div
                className="w-52 h-52 rounded-full flex flex-col items-center justify-center"
                style={{
                  background: `radial-gradient(circle, #F59E0B, #B45309)`,
                  boxShadow: `0 0 60px #F59E0B40, 0 0 120px #F59E0B20`,
                }}
              >
                <span className="text-4xl font-black text-black">FLIP</span>
                <span className="text-xs text-black/60 mt-1 font-medium">Choose the movie</span>
              </div>
              <motion.div
                className="text-sm text-white/40 tracking-wider"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Deciding fate...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── SCENE 2: RANKINGS ────────────────────────────────────────────────────────
function RankingsScene({ accent }: { accent: string }) {
  const ranks = [
    { pos: 2, label: "Silver", color: "#9CA3AF", height: "55%", delay: 0.7 },
    { pos: 1, label: "Gold",   color: accent,    height: "100%", delay: 0.4 },
    { pos: 3, label: "Bronze", color: "#B45309", height: "38%", delay: 0.9 },
  ];

  const movies = [
    { title: "Dark Throne", genre: "Thriller", rating: "9.2" },
    { title: "Echo of Lagos", genre: "Nollywood", rating: "8.8" },
    { title: "Sakura Storm", genre: "Anime", rating: "8.5" },
  ];

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center gap-16 px-16"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left: podium */}
      <div className="flex-1 flex flex-col">
        <motion.div
          className="flex items-center gap-3 mb-10"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Trophy style={{ color: accent }} className="w-8 h-8" />
          <h2 className="text-4xl font-black">Top Ranked</h2>
        </motion.div>

        <div className="flex items-end gap-3 h-52">
          {ranks.map((r) => (
            <div key={r.pos} className="flex-1 flex flex-col items-center justify-end">
              <motion.span
                className="text-4xl font-black mb-3"
                style={{ color: r.color, textShadow: `0 0 20px ${r.color}50` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: r.delay - 0.1, type: "spring", damping: 10 }}
              >
                #{r.pos}
              </motion.span>
              <motion.div
                className="w-full rounded-t-lg"
                style={{ background: `linear-gradient(to top, ${r.color}40, ${r.color}90)`, border: `1px solid ${r.color}50` }}
                initial={{ height: 0 }}
                animate={{ height: r.height }}
                transition={{ delay: r.delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right: movie list */}
      <div className="flex-1">
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {movies.map((m, i) => (
            <motion.div
              key={m.title}
              className="flex items-center gap-5 p-4 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? accent + "40" : "rgba(255,255,255,0.06)"}` }}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="text-3xl font-black w-10 text-center"
                style={{ color: i === 0 ? accent : i === 1 ? "#9CA3AF" : "#B45309" }}
              >
                {i + 1}
              </span>
              <div className="w-12 h-14 rounded-md bg-white/10 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accent}20, rgba(255,255,255,0.05))` }} />
              <div className="flex-1">
                <p className="font-semibold text-sm">{m.title}</p>
                <p className="text-xs text-white/40 mt-0.5">{m.genre}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-current" style={{ color: accent }} />
                <span className="text-sm font-semibold">{m.rating}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── SCENE 3: CONTENT DISCOVERY ───────────────────────────────────────────────
function DiscoveryScene({ accent }: { accent: string }) {
  const rows = [
    { label: "Trending Now", cards: 5 },
    { label: "🎌 Anime", cards: 5 },
    { label: "🇰🇷 K-Drama", cards: 5 },
  ];

  return (
    <motion.div
      className="absolute inset-0 z-20"
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0, clipPath: "circle(0% at 50% 50%)" }}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Hero banner mock */}
      <motion.div
        className="absolute top-12 left-0 right-0 h-32 px-16 flex items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div>
          <div className="text-xs tracking-widest uppercase mb-2" style={{ color: accent }}>Now Trending</div>
          <div className="text-5xl font-black leading-none">Discover What</div>
          <div className="text-5xl font-black leading-none" style={{ color: accent }}>the World Watches</div>
        </div>
      </motion.div>

      {/* Content rows */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-4 pb-6 px-16" style={{ top: "52%" }}>
        {rows.map((row, ri) => (
          <div key={row.label}>
            <motion.p
              className="text-sm font-semibold text-white/60 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + ri * 0.2 }}
            >
              {row.label}
            </motion.p>
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: row.cards }).map((_, ci) => (
                <motion.div
                  key={ci}
                  className="flex-shrink-0 h-16 w-28 rounded-md"
                  style={{
                    background: `linear-gradient(135deg, ${accent}${ci === 0 ? "30" : "10"}, rgba(255,255,255,0.05))`,
                    border: ci === 0 ? `1px solid ${accent}40` : "1px solid rgba(255,255,255,0.06)",
                  }}
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + ri * 0.2 + ci * 0.06 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Category pills bottom ticker */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-10 flex items-center overflow-hidden"
        style={{ backgroundColor: `${accent}08` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="ticker-track flex gap-8 whitespace-nowrap text-xs text-white/30 px-8">
          {["Nollywood", "K-Drama", "Anime", "South African Drama", "Bollywood", "Hollywood", "Trending", "Hot This Week", "Popular Movies",
            "Nollywood", "K-Drama", "Anime", "South African Drama", "Bollywood", "Hollywood", "Trending", "Hot This Week", "Popular Movies"].map((cat, i) => (
            <span key={i} className="tracking-widest uppercase">{cat}</span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── SCENE 4: CONTINUE WATCHING ───────────────────────────────────────────────
function ContinueScene({ accent }: { accent: string }) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center gap-16 px-16"
      initial={{ filter: "blur(30px)", opacity: 0 }}
      animate={{ filter: "blur(0px)", opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.9 }}
    >
      {/* Text */}
      <motion.div
        className="flex-1"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-5">
          <Clock style={{ color: accent }} className="w-7 h-7" />
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: accent }}>Continue Watching</span>
        </div>
        <h2 className="text-6xl font-black leading-tight mb-4">
          Right where<br />
          <span style={{ color: accent }}>you left off.</span>
        </h2>
        <p className="text-white/40 text-lg max-w-sm leading-relaxed">
          Your progress is always saved. Jump back in from any device, any time.
        </p>
      </motion.div>

      {/* Mock player */}
      <motion.div
        className="flex-1 flex flex-col gap-3"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", damping: 18 }}
      >
        {/* Main player */}
        <div
          className="relative w-full aspect-video rounded-xl overflow-hidden"
          style={{ border: `1px solid ${accent}30`, backgroundColor: "#111", boxShadow: `0 0 40px ${accent}15` }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accent}20`, border: `1px solid ${accent}40` }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Play style={{ color: accent }} className="w-7 h-7 ml-1" />
            </motion.div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-20 flex flex-col justify-end px-4 pb-3" style={{ background: "linear-gradient(to top, #000, transparent)" }}>
            <p className="text-xs text-white/60 mb-2">Episode 5 — "The Return" &nbsp;·&nbsp; S02E05</p>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: accent }}
                initial={{ width: "0%" }}
                animate={{ width: "65%" }}
                transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Small continue cards */}
        <div className="flex gap-3">
          {[{ title: "Dark Throne", pct: "65%", ep: "S02E05" }, { title: "Echo of Lagos", pct: "30%", ep: "S01E02" }].map((item) => (
            <div
              key={item.title}
              className="flex-1 flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="w-10 h-12 rounded-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accent}20, rgba(255,255,255,0.05))` }} />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold truncate">{item.title}</p>
                <p className="text-xs text-white/30 mt-0.5">{item.ep}</p>
                <div className="w-full h-1 bg-white/10 rounded mt-1.5 overflow-hidden">
                  <div className="h-full rounded" style={{ width: item.pct, backgroundColor: accent }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── SCENE 5: QUALITY & SUBTITLES ─────────────────────────────────────────────
function QualityScene({ accent }: { accent: string }) {
  const qualities = ["4K Ultra HD", "1080p Full HD", "720p HD", "480p SD"];
  const subs = ["Off", "English (CC)", "Spanish", "French", "Portuguese"];

  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center gap-12 px-16"
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Text */}
      <div className="flex-1">
        <motion.div
          className="flex items-center gap-3 mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Subtitles style={{ color: accent }} className="w-7 h-7" />
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: accent }}>Your Controls</span>
        </motion.div>
        <motion.h2
          className="text-6xl font-black leading-tight"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          Your stream,<br />
          <span style={{ color: accent }}>your rules.</span>
        </motion.h2>
        <motion.p
          className="text-white/40 mt-4 max-w-xs leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Choose quality and subtitles before every stream. Preferences saved automatically.
        </motion.p>
      </div>

      {/* Controls */}
      <div className="flex-1 flex gap-6">
        {/* Quality */}
        <motion.div
          className="flex-1 rounded-2xl p-6"
          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs tracking-widest uppercase text-white/40 mb-5">Quality</p>
          <div className="flex flex-col gap-3">
            {qualities.map((q, i) => (
              <motion.div
                key={q}
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{
                  backgroundColor: i === 0 ? `${accent}15` : "transparent",
                  border: i === 0 ? `1px solid ${accent}40` : "1px solid transparent",
                }}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.08 }}
              >
                <ChevronRight
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: i === 0 ? accent : "transparent" }}
                />
                <span className={`text-sm ${i === 0 ? "font-bold text-white" : "text-white/30"}`}>{q}</span>
                {i === 0 && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${accent}30`, color: accent }}>Active</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Subtitles */}
        <motion.div
          className="flex-1 rounded-2xl p-6"
          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          <p className="text-xs tracking-widest uppercase text-white/40 mb-5">Subtitles</p>
          <div className="flex flex-col gap-3">
            {subs.map((s, i) => (
              <motion.div
                key={s}
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{
                  backgroundColor: i === 1 ? `${accent}15` : "transparent",
                  border: i === 1 ? `1px solid ${accent}40` : "1px solid transparent",
                }}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.08 }}
              >
                <ChevronRight
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: i === 1 ? accent : "transparent" }}
                />
                <span className={`text-sm ${i === 1 ? "font-bold text-white" : "text-white/30"}`}>{s}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── SCENE 6: OUTRO ───────────────────────────────────────────────────────────
function OutroScene({ accent }: { accent: string }) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1 }}
    >
      {/* Glow ring */}
      <motion.div
        className="absolute w-[60vw] h-[60vw] rounded-full"
        style={{ border: `1px solid ${accent}20`, boxShadow: `0 0 120px ${accent}15` }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full"
        style={{ border: `1px solid ${accent}15` }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
      />

      <div className="overflow-hidden">
        <motion.h1
          className="font-display text-[16vw] leading-none tracking-tight text-center"
          style={{ fontFamily: "'Bebas Neue', sans-serif", color: accent, textShadow: `0 0 100px ${accent}60` }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          ECOFLIX
        </motion.h1>
      </div>

      <motion.p
        className="text-xl font-light tracking-[0.3em] text-white/50 mt-4 uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Start streaming today
      </motion.p>

      <motion.div
        className="flex items-center gap-3 mt-10 px-8 py-3 rounded-full font-semibold text-sm"
        style={{ backgroundColor: accent, color: "white" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Play className="w-4 h-4 fill-current" />
        Watch Now
      </motion.div>
    </motion.div>
  );
}
