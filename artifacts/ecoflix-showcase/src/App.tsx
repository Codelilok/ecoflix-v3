import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Users, Trophy, Compass, Clock, Settings, ArrowRight } from "lucide-react";

// Types & Config
const SCENE_DURATIONS = [
  3000, // 0: Intro
  6000, // 1: Watch Party
  4000, // 2: Rankings
  4000, // 3: Content Discovery
  4000, // 4: Continue Watching
  4000, // 5: Quality & Subtitles
  3000, // 6: Outro
];

// Video Framework Component
export default function App() {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScene((prev) => (prev + 1) % SCENE_DURATIONS.length);
    }, SCENE_DURATIONS[currentScene]);

    return () => clearTimeout(timer);
  }, [currentScene]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">
      {/* Global Background Layer */}
      <Background currentScene={currentScene} />

      {/* Global Persistent Accent Layer */}
      <PersistentAccents currentScene={currentScene} />

      {/* Scene Content */}
      <AnimatePresence mode="wait">
        <Scene key={currentScene} index={currentScene} />
      </AnimatePresence>
    </div>
  );
}

// Global Background that persists across scenes
function Background({ currentScene }: { currentScene: number }) {
  return (
    <div className="absolute inset-0 z-0">
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay z-10" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      
      {/* Animated Gradients based on scene */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: currentScene === 0 
            ? "radial-gradient(circle at 50% 50%, #E5091420 0%, #000000 70%)" // Intro (Red)
            : currentScene === 1
            ? "radial-gradient(circle at 80% 20%, #8A2BE220 0%, #000000 80%)" // Watch Party (Purple)
            : currentScene === 2
            ? "radial-gradient(circle at 20% 80%, #FFD70020 0%, #000000 80%)" // Rankings (Gold)
            : currentScene === 3
            ? "radial-gradient(circle at 50% 0%, #00CED120 0%, #000000 80%)" // Discovery (Cyan)
            : currentScene === 4
            ? "radial-gradient(circle at 0% 50%, #FF450020 0%, #000000 80%)" // Continue (Orange)
            : currentScene === 5
            ? "radial-gradient(circle at 100% 50%, #4169E120 0%, #000000 80%)" // Quality (Blue)
            : "radial-gradient(circle at 50% 50%, #E5091430 0%, #000000 80%)" // Outro (Redder)
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Drifting subtle shapes */}
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full blur-[100px] bg-red-600/10"
        animate={{
          x: currentScene % 2 === 0 ? "10vw" : "60vw",
          y: currentScene % 3 === 0 ? "10vh" : "50vh",
          scale: currentScene % 2 === 0 ? 1 : 1.5,
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
      />
    </div>
  );
}

// Elements that move around between scenes
function PersistentAccents({ currentScene }: { currentScene: number }) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* Brand Line */}
      <motion.div
        className="absolute top-0 left-0 h-1 bg-[#E50914]"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ 
          duration: SCENE_DURATIONS.reduce((a,b)=>a+b,0) / 1000, 
          ease: "linear",
          repeat: Infinity 
        }}
      />
    </div>
  );
}

function Scene({ index }: { index: number }) {
  switch (index) {
    case 0: return <IntroScene />;
    case 1: return <WatchPartyScene />;
    case 2: return <RankingsScene />;
    case 3: return <DiscoveryScene />;
    case 4: return <ContinueWatchingScene />;
    case 5: return <QualityScene />;
    case 6: return <OutroScene />;
    default: return null;
  }
}

// --- SCENES ---

function IntroScene() {
  return (
    <motion.div 
      className="absolute inset-0 z-20 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h1 
        className="text-[12vw] font-black tracking-tighter text-[#E50914]"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
      >
        ECOFLIX
      </motion.h1>
      <motion.p
        className="text-[2vw] font-light tracking-[0.5em] text-gray-400 uppercase mt-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        Cinematic Streaming
      </motion.p>
    </motion.div>
  );
}

function WatchPartyScene() {
  const [phase, setPhase] = useState(0); // 0: title, 1: code/lobby, 2: coin flip

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1500);
    const t2 = setTimeout(() => setPhase(2), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 z-20 p-16 flex items-center justify-between"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="w-1/2">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4 mb-6"
        >
          <Users className="w-12 h-12 text-[#8A2BE2]" />
          <h2 className="text-4xl font-bold text-[#8A2BE2]">Watch Party</h2>
        </motion.div>
        
        <motion.h3 
          className="text-6xl font-black leading-tight mb-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Watch together.<br/>Anywhere.
        </motion.h3>

        <motion.p
          className="text-2xl text-gray-400 max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Real-time sync, live chat, and a coin flip to decide what's next.
        </motion.p>
      </div>

      <div className="w-1/2 h-full flex items-center justify-center relative">
        {/* Abstract UI Representation */}
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <motion.div
              key="lobby"
              className="bg-gray-900/50 backdrop-blur-md border border-gray-800 p-8 rounded-2xl w-96 text-center"
              initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 1.2, opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-gray-400 mb-2 uppercase tracking-widest text-sm">Party Code</p>
              <div className="text-6xl font-mono font-bold tracking-widest text-white mb-8">
                8X9 2M4
              </div>
              <div className="flex justify-center gap-[-1rem]">
                <div className="w-16 h-16 rounded-full bg-blue-500 border-4 border-gray-900 z-20" />
                <div className="w-16 h-16 rounded-full bg-green-500 border-4 border-gray-900 z-10 -ml-4" />
                <div className="w-16 h-16 rounded-full bg-pink-500 border-4 border-gray-900 z-0 -ml-4" />
              </div>
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div
              key="flip"
              className="w-64 h-64 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(250,204,21,0.3)]"
              initial={{ scale: 0, rotateX: 720 }}
              animate={{ scale: 1, rotateX: 0 }}
              transition={{ type: "spring", damping: 12 }}
            >
              <span className="text-4xl font-bold text-black">FLIP</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function RankingsScene() {
  return (
    <motion.div 
      className="absolute inset-0 z-20 p-16 flex flex-col items-center justify-center"
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ duration: 0.8, ease: "circOut" }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4 mb-16"
      >
        <Trophy className="w-12 h-12 text-[#FFD700]" />
        <h2 className="text-5xl font-bold">Top Ranked</h2>
      </motion.div>

      <div className="flex gap-8 items-end h-[40vh]">
        {/* Silver */}
        <motion.div
          className="w-48 h-[60%] bg-gradient-to-t from-gray-900 to-gray-400 rounded-t-xl relative flex justify-center"
          initial={{ height: 0 }}
          animate={{ height: "60%" }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <span className="absolute -top-12 text-4xl font-bold text-gray-300">#2</span>
        </motion.div>
        
        {/* Gold */}
        <motion.div
          className="w-56 h-[100%] bg-gradient-to-t from-yellow-900 to-yellow-400 rounded-t-xl relative flex justify-center shadow-[0_0_30px_rgba(255,215,0,0.2)]"
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <span className="absolute -top-16 text-6xl font-black text-yellow-400 drop-shadow-lg">#1</span>
        </motion.div>

        {/* Bronze */}
        <motion.div
          className="w-48 h-[40%] bg-gradient-to-t from-orange-950 to-orange-700 rounded-t-xl relative flex justify-center"
          initial={{ height: 0 }}
          animate={{ height: "40%" }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <span className="absolute -top-12 text-4xl font-bold text-orange-500">#3</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function DiscoveryScene() {
  return (
    <motion.div 
      className="absolute inset-0 z-20 p-16"
      initial={{ opacity: 0, clipPath: "circle(0% at 50% 50%)" }}
      animate={{ opacity: 1, clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
       <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-4 mb-12"
      >
        <Compass className="w-10 h-10 text-[#00CED1]" />
        <h2 className="text-4xl font-bold">Endless Discovery</h2>
      </motion.div>

      <div className="flex flex-col gap-8">
        {/* Row 1 */}
        <div>
          <motion.h4 
            className="text-xl text-gray-400 mb-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >Trending Now</motion.h4>
          <div className="flex gap-4">
            {[1,2,3,4].map((i) => (
              <motion.div
                key={`r1-${i}`}
                className="w-64 h-36 bg-gray-800 rounded-md"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + (i * 0.1) }}
              />
            ))}
          </div>
        </div>

         {/* Row 2 */}
         <div>
          <motion.h4 
            className="text-xl text-gray-400 mb-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          >K-Drama</motion.h4>
          <div className="flex gap-4">
            {[1,2,3,4].map((i) => (
              <motion.div
                key={`r2-${i}`}
                className="w-64 h-36 bg-gray-800/80 rounded-md"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.0 + (i * 0.1) }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ContinueWatchingScene() {
  return (
    <motion.div 
      className="absolute inset-0 z-20 flex items-center justify-center"
      initial={{ filter: "blur(20px)", opacity: 0 }}
      animate={{ filter: "blur(0px)", opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="w-[60vw] max-w-4xl">
         <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <Clock className="w-10 h-10 text-[#FF4500]" />
          <h2 className="text-4xl font-bold">Pick up right where you left off.</h2>
        </motion.div>

        <motion.div 
          className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl"
          initial={{ y: 50, opacity: 0, rotateX: 20 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ delay: 0.6, type: "spring", damping: 20 }}
          style={{ perspective: 1000 }}
        >
          {/* Mock Video Player */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-24 h-24 text-white/50" />
          </div>
          
          {/* Progress Bar Container */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent flex items-end p-6">
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#E50914]"
                initial={{ width: 0 }}
                animate={{ width: "65%" }}
                transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function QualityScene() {
  return (
    <motion.div 
      className="absolute inset-0 z-20 p-16 flex flex-col justify-center"
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0, filter: "brightness(0)" }}
      transition={{ duration: 0.8, ease: "anticipate" }}
    >
       <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 mb-16"
        >
          <Settings className="w-10 h-10 text-[#4169E1]" />
          <h2 className="text-5xl font-bold">Your stream, your rules.</h2>
        </motion.div>

        <div className="flex gap-16 ml-14">
          <motion.div
             initial={{ y: 30, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.6 }}
          >
            <h3 className="text-2xl text-gray-400 mb-6">Quality</h3>
            <div className="flex flex-col gap-4 text-3xl font-light">
              <span className="text-white font-bold flex items-center gap-4"><ArrowRight className="w-6 h-6 text-[#4169E1]" /> 4K Ultra HD</span>
              <span className="text-gray-600 pl-10">1080p Full HD</span>
              <span className="text-gray-600 pl-10">720p HD</span>
            </div>
          </motion.div>

          <motion.div
             initial={{ y: 30, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.8 }}
          >
            <h3 className="text-2xl text-gray-400 mb-6">Subtitles</h3>
            <div className="flex flex-col gap-4 text-3xl font-light">
              <span className="text-gray-600 pl-10">Off</span>
              <span className="text-white font-bold flex items-center gap-4"><ArrowRight className="w-6 h-6 text-[#4169E1]" /> English (CC)</span>
              <span className="text-gray-600 pl-10">Spanish</span>
            </div>
          </motion.div>
        </div>
    </motion.div>
  );
}

function OutroScene() {
  return (
    <motion.div 
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.h1 
        className="text-[15vw] font-black tracking-tighter text-[#E50914]"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1.5, ease: "easeOut" }}
      >
        ECOFLIX
      </motion.h1>
      <motion.p
        className="text-2xl font-light text-white mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Start streaming today.
      </motion.p>
    </motion.div>
  );
}
