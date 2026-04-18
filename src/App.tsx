import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Shield, Eye, EyeOff, Timer, Zap, Trophy, Skull, Activity } from 'lucide-react';
import { GameEngine, MAP_SIZE } from './game/GameEngine';
import { Renderer } from './game/Renderer';
import { GameStatus } from './game/types';
import { Joystick } from './components/Joystick';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new GameEngine());
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [isHidden, setIsHidden] = useState(false);
  const [isDetected, setIsDetected] = useState(false);
  
  const keys = useRef<Record<string, boolean>>({});
  const joystickVector = useRef({ x: 0, y: 0 });

  const drawMinimap = (ctx: CanvasRenderingContext2D) => {
    const isMobile = window.innerWidth < 768;
    const size = isMobile ? 80 : 150;
    const padding = 10;
    const scale = size / Math.max(MAP_SIZE.width, MAP_SIZE.height);
    
    ctx.save();
    ctx.translate(MAP_SIZE.width - size - padding, MAP_SIZE.height - size - padding);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeRect(0, 0, size, size);
    
    // Scale to map
    ctx.scale(scale, scale);
    
    // Draw Walls
    ctx.fillStyle = '#3f3f46';
    for (const wall of engine.walls) {
      if (wall.type === 'wall') ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }
    
    // Draw Seekers
    ctx.fillStyle = '#ef4444';
    for (const s of engine.seekers) {
      ctx.beginPath();
      ctx.arc(s.pos.x, s.pos.y, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw Player
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(engine.player.pos.x, engine.player.pos.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  const gameLoop = useCallback((time: number, lastTime: number) => {
    const deltaTime = Math.min(time - lastTime, 100); // Cap delta time
    
    engine.update(keys.current, deltaTime, joystickVector.current);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const renderer = new Renderer(ctx, engine);
        renderer.render();
        drawMinimap(ctx);
      }
    }

    // Update React state for HUD
    setTimer(Math.max(0, engine.timer));
    setScore(Math.floor(engine.score));
    setDifficulty(engine.difficulty);
    setIsHidden(engine.player.isHidden);
    setStatus(engine.status);

    // Check if any seeker is in CHASE mode (detected)
    const detected = engine.seekers.some(s => s.state === 'CHASE');
    setIsDetected(detected);

    if (engine.status === GameStatus.PLAYING) {
      requestAnimationFrame((t) => gameLoop(t, time));
    }
  }, [engine]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    engine.start();
    setStatus(GameStatus.PLAYING);
    requestAnimationFrame((t) => gameLoop(t, t));
  };

  const restart = () => {
    // Reset inputs
    keys.current = {};
    joystickVector.current = { x: 0, y: 0 };
    
    engine.generateMap(); // New map
    startGame();
  };

  const handleControlStart = (key: string) => { keys.current[key] = true; };
  const handleControlEnd = (key: string) => { keys.current[key] = false; };

  return (
    <div className={`relative w-screen h-screen flex flex-col items-center justify-center bg-black overflow-hidden font-sans transition-all duration-300 ${isDetected ? 'bg-red-950/20' : ''}`}>
      {/* Game Canvas */}
      <motion.div 
        animate={isDetected ? { x: [-2, 2, -2, 2, 0], y: [-1, 1, -1, 1, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.1 }}
        className="relative md:border-4 border-zinc-900 md:rounded-xl shadow-2xl overflow-hidden bg-zinc-950 flex flex-col w-full h-full md:w-auto md:h-auto"
      >
        <canvas
          ref={canvasRef}
          width={MAP_SIZE.width}
          height={MAP_SIZE.height}
          className="w-full h-full object-contain md:max-w-[95vw] md:max-h-[85vh]"
        />
        
        {/* HUD Layer */}
        <AnimatePresence>
          {status === GameStatus.PLAYING && (
            <>
              <div className="absolute top-0 left-0 w-full p-2 md:p-6 pointer-events-none flex justify-between items-start">
                <div />

                {/* Center: Timer */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-4 md:px-8 py-1 md:py-3 rounded-full flex items-center gap-2 md:gap-4 shadow-xl pointer-events-none"
                >
                  <Timer className="text-zinc-500 scale-75 md:scale-100" size={20} />
                  <span className="hud-font text-base md:text-2xl font-black text-white tabular-nums">
                    {timer.toFixed(1)}s
                  </span>
                  <span className="text-zinc-600 font-mono text-[8px] md:text-xs ml-1 md:ml-2">REMAINING</span>
                </motion.div>

                {/* Right: Score/Tips */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col items-end gap-1 md:gap-3"
                >
                  <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-2 md:p-4 rounded-lg flex items-center gap-2 md:gap-4 min-w-[80px] md:min-w-[150px] justify-end">
                     <div className="hud-font text-right text-white">
                      <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-zinc-500">Survival</p>
                      <p className="text-sm md:text-xl font-black">{score}s</p>
                    </div>
                    <div className="p-1 md:p-2 rounded-full bg-zinc-800 text-emerald-400">
                      <Trophy size={16} className="md:w-5 md:h-5" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Mobile Controls Overlay */}
              <div className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 pointer-events-auto flex justify-between items-end pb-28">
                {/* Movement Joystick */}
                <div className="relative group">
                  <div className="absolute -inset-4 bg-emerald-500/10 rounded-full blur-xl group-active:bg-emerald-500/20 transition-colors" />
                  <Joystick onMove={(v) => { joystickVector.current = v; }} size={90} />
                </div>

                {/* Sprint Button */}
                <div className="relative group">
                  <div className="absolute -inset-2 bg-emerald-500/20 rounded-full blur-lg opacity-0 group-active:opacity-100 transition-opacity" />
                  <button 
                    onPointerDown={(e) => { e.preventDefault(); handleControlStart('Shift'); }}
                    onPointerUp={(e) => { e.preventDefault(); handleControlEnd('Shift'); }}
                    onPointerLeave={() => handleControlEnd('Shift')}
                    className="relative w-16 h-16 bg-zinc-900/90 text-emerald-500 font-black rounded-xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-2xl select-none touch-none border-2 border-emerald-500/40 backdrop-blur-md overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-emerald-500/5 group-active:bg-emerald-500/20" />
                    <span className="text-[10px] leading-none mb-1 opacity-70">BOOST</span>
                    <span className="text-sm tracking-tighter">RUN</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Start Overlay */}
        <AnimatePresence>
          {status === GameStatus.START && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-start sm:justify-center p-4 sm:p-12 text-center overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md w-full py-8 sm:py-0"
              >
                <h1 className="text-4xl sm:text-7xl font-black tracking-tighter text-white mb-1 sm:mb-2 italic">
                  HIDE <span className="text-emerald-500">N</span> SEEK
                </h1>
                <p className="text-zinc-500 mb-6 sm:mb-12 text-[10px] sm:text-sm uppercase tracking-widest">Infiltration Mission: Sector 7</p>
                
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-12 text-left">
                    <div className="p-3 sm:p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                        <Eye className="text-emerald-500 mb-1 sm:mb-2" size={20} />
                        <h3 className="font-bold text-[10px] sm:text-sm text-zinc-200 uppercase">Shadows</h3>
                        <p className="text-[8px] sm:text-[10px] text-zinc-500">Hide in dark boxes or bushes to reduce detection.</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                        <Activity className="text-red-500 mb-1 sm:mb-2" size={20} />
                        <h3 className="font-bold text-[10px] sm:text-sm text-zinc-200 uppercase">Detection</h3>
                        <p className="text-[8px] sm:text-[10px] text-zinc-500">Avoid vision cones. Running creates noise ripples.</p>
                    </div>
                </div>

                <div className="mb-6 sm:mb-12 p-3 sm:p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-left">
                    <h3 className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1 sm:mb-2 text-center sm:text-left">Acoustic Signature</h3>
                    <ul className="text-[8px] sm:text-[10px] space-y-1 text-zinc-400">
                        <li>• <span className="text-zinc-200 font-bold">WALKING:</span> Low footprint</li>
                        <li>• <span className="text-zinc-200 font-bold">SPRINTING:</span> High footprint</li>
                        <li>• <span className="text-zinc-200 font-bold">DETECTION:</span> Seekers track noise.</li>
                    </ul>
                </div>

                <button 
                  onClick={startGame}
                  className="group relative flex items-center justify-center gap-2 sm:gap-3 bg-emerald-500 hover:bg-emerald-400 text-black px-8 sm:px-12 py-3 sm:py-5 rounded-full font-black text-sm sm:text-xl transition-all hover:scale-105 active:scale-95 w-full uppercase"
                >
                  <Play fill="currentColor" size={18} />
                  Begin mission
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over / Win Overlay */}
        <AnimatePresence>
          {(status === GameStatus.WON || status === GameStatus.CAUGHT) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-4 sm:p-8 text-center overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.8, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                className="flex flex-col items-center w-full max-w-sm py-12 sm:py-0"
              >
                <div className={`p-4 sm:p-5 rounded-full mb-3 sm:mb-6 ${status === GameStatus.WON ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                    {status === GameStatus.WON ? <Trophy className="w-10 h-10 sm:w-16 sm:h-16" /> : <Skull className="w-10 h-10 sm:w-16 sm:h-16" />}
                </div>

                <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter mb-1 uppercase">
                  {status === GameStatus.WON ? 'MISSION SUCCESS' : 'MISSION FAILED'}
                </h2>
                <p className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-4 sm:mb-6">
                   {status === GameStatus.WON ? 'Zone Extraction Secure' : 'Infiltrator Apprehended'}
                </p>

                <div className="bg-zinc-900/50 border border-zinc-800 p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 w-full max-w-xs">
                    <p className="text-[8px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-1 sm:mb-2 font-mono text-center">Final Report</p>
                    <div className="flex justify-between items-end border-b border-zinc-800/50 pb-2">
                        <span className="text-zinc-400 text-[10px] sm:text-xs">TIME SURVIVED</span>
                        <span className="text-xl sm:text-2xl font-black font-mono">{Math.floor(score)}S</span>
                    </div>
                </div>

                <button 
                  onClick={restart}
                  className="flex items-center gap-2 sm:gap-3 bg-white hover:bg-zinc-200 text-black px-8 sm:px-12 py-3 rounded-full font-black text-sm transition-all hover:scale-105 active:scale-95 uppercase w-full sm:w-auto justify-center"
                >
                  <RotateCcw size={16} />
                  Retry mission
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Background Ambience UI */}
      <div className="absolute top-10 left-10 pointer-events-none p-4 border-l border-emerald-500/20 opacity-20 hidden lg:block">
        <p className="hud-font text-[10px] uppercase font-bold text-emerald-500">System Link Active</p>
        <p className="hud-font text-xs text-white">LAT: 35.6895 N</p>
        <p className="hud-font text-xs text-white">LON: 139.6917 E</p>
      </div>

      <div className="absolute bottom-10 right-10 pointer-events-none p-4 border-r border-emerald-500/20 opacity-20 text-right hidden lg:block">
        <p className="hud-font text-[10px] uppercase font-bold text-emerald-500">Security Sector 7</p>
        <p className="hud-font text-xs text-white">ENCRYPTED CHANNEL 42</p>
      </div>
    </div>
  );
}
