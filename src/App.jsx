/**
 * App.jsx — CalmSpace
 * Wildcard 2: Alternative UI — physical interaction without typing.
 *
 * Architecture:
 * - Single page, no routing
 * - Gesture layer handles swipe/hold globally
 * - useEmotion processes webcam frames locally
 * - useCalmSound generates procedural audio
 * - Framer Motion handles all transitions
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmotion } from './hooks/useEmotion';
import { useCalmSound } from './hooks/useCalmSound';
import ParticleCanvas from './components/ParticleCanvas';
import BreathingOrb from './components/BreathingOrb';
import PrivacyModal from './components/PrivacyModal';
import StatusPanel from './components/StatusPanel';

// Touch ripple component
function Ripple({ x, y, id, onDone }) {
  return (
    <motion.div
      className="ripple pointer-events-none"
      style={{ left: x - 20, top: y - 20, width: 40, height: 40, position: 'fixed', zIndex: 9998 }}
      initial={{ scale: 0.3, opacity: 0.7 }}
      animate={{ scale: 5, opacity: 0 }}
      transition={{ duration: 0.9, ease: [0, 0.55, 0.45, 1] }}
      onAnimationComplete={onDone}
    />
  );
}

// Background gradient transition
const BG = {
  high: 'radial-gradient(circle at 25% 25%, #1a0050 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #200060 0%, transparent 55%)',
  moderate: 'radial-gradient(circle at 25% 25%, #002a4a 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #003060 0%, transparent 55%)',
  mild: 'radial-gradient(circle at 25% 25%, #001e2a 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #001a10 0%, transparent 55%)',
  calm: 'radial-gradient(circle at 25% 25%, #15003d 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #000830 0%, transparent 55%)',
};

export default function App() {
  /* ---- State ---- */
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [started, setStarted] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [pointer, setPointer] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /* ---- Refs ---- */
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const holdTimer = useRef(null);
  const gestureStart = useRef(null);
  const rippleId = useRef(0);

  /* ---- Hooks ---- */
  const { stressScore, stressState, topEmotion, modelsLoaded } = useEmotion(videoRef, cameraEnabled && started);
  const { play, stopAll } = useCalmSound();

  /* ---- Sound effect ---- */
  useEffect(() => {
    if (soundOn && started) play(stressState);
    else if (!soundOn) stopAll();
  }, [stressState, soundOn, started, play, stopAll]);

  /* ---- Haptic breathing pulse every ~4s when high stress ---- */
  useEffect(() => {
    if (!started || stressState !== 'high') return;
    const interval = setInterval(() => {
      if (navigator.vibrate) navigator.vibrate([80, 200, 80]);
    }, 4000);
    return () => clearInterval(interval);
  }, [stressState, started]);

  /* ---- Camera setup ---- */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraEnabled(true);
    } catch (err) {
      console.warn('Camera not available:', err);
      setCameraEnabled(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraEnabled(false);
  }, []);

  /* ---- Privacy modal handlers ---- */
  const handleAccept = useCallback(async () => {
    setShowPrivacy(false);
    setStarted(true);
    setSoundOn(true);
    await startCamera();
  }, [startCamera]);

  const handleDecline = useCallback(() => {
    setShowPrivacy(false);
    setStarted(true);
    setSoundOn(true);
  }, []);

  /* ---- Ripple factory ---- */
  const addRipple = useCallback((x, y) => {
    const id = rippleId.current++;
    setRipples(r => [...r.slice(-6), { id, x, y }]);
  }, []);

  /* ---- Gesture handlers ---- */
  const onPointerDown = useCallback((e) => {
    const { clientX: x, clientY: y } = e.touches?.[0] ?? e;
    gestureStart.current = { x, y, t: Date.now() };
    addRipple(x, y);
    setPointer({ x, y });

    // Hold detection
    holdTimer.current = setTimeout(() => {
      setIsHeld(true);
      if (navigator.vibrate) navigator.vibrate(60);
    }, 500);
  }, [addRipple]);

  const onPointerMove = useCallback((e) => {
    const { clientX: x, clientY: y } = e.touches?.[0] ?? e;
    setPointer({ x, y });
  }, []);

  const onPointerUp = useCallback((e) => {
    clearTimeout(holdTimer.current);
    setIsHeld(false);
    setPointer(null);

    if (!gestureStart.current) return;
    const { clientX: ex, clientY: ey } = e.changedTouches?.[0] ?? e;
    const dx = ex - gestureStart.current.x;
    const dy = ey - gestureStart.current.y;
    const dt = Date.now() - gestureStart.current.t;
    gestureStart.current = null;

    // Swipe Down = restart/show privacy
    if (dy > 110 && Math.abs(dx) < 60 && dt < 500) {
      setShowPrivacy(true);
      setStarted(false);
      stopAll();
      stopCamera();
    }
  }, [stopAll, stopCamera]);

  return (
    <div
      className="app-container relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
      style={{
        background: BG[stressState] || BG.calm,
        transition: 'background 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        minHeight: '100dvh',
      }}
      onMouseDown={onPointerDown}
      onMouseMove={pointer ? onPointerMove : undefined}
      onMouseUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      {/* ---- Particle field ---- */}
      <ParticleCanvas stressScore={stressScore} pointerPos={pointer} />

      {/* ---- Ambient wave layers ---- */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Wave 1 */}
        <motion.div
          className="absolute rounded-full opacity-10"
          style={{ width: 700, height: 700, left: -200, top: -200, background: 'radial-gradient(circle, rgba(53,18,226,0.5), transparent 70%)' }}
          animate={{ scale: [1, 1.08, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Wave 2 */}
        <motion.div
          className="absolute rounded-full opacity-10"
          style={{ width: 600, height: 600, right: -150, bottom: -150, background: 'radial-gradient(circle, rgba(0,200,255,0.3), transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
      </div>

      {/* ---- Hidden video (for face-api) ---- */}
      <video ref={videoRef} muted playsInline className="absolute w-0 h-0 opacity-0 pointer-events-none" aria-hidden="true" />

      {/* ---- Touch trail ripples ---- */}
      {ripples.map(r => (
        <Ripple key={r.id} x={r.x} y={r.y} id={r.id} onDone={() => setRipples(prev => prev.filter(p => p.id !== r.id))} />
      ))}

      {/* ---- Main content ---- */}
      <AnimatePresence>
        {started && (
          <motion.div
            className="relative z-10 flex flex-col items-center justify-center gap-8 w-full px-6 max-w-md"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header bar */}
            <div className="w-full flex items-center justify-between">
              <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cameraEnabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="text-slate-400 text-xs">{cameraEnabled ? 'Sensing' : 'Simulating'}</span>
              </div>
              <h1 className="text-white/80 text-base font-semibold tracking-wide">CalmSpace</h1>
              <button
                className="glass px-3 py-1.5 rounded-full text-slate-400 text-xs"
                onMouseDown={e => { e.stopPropagation(); setShowSettings(s => !s); }}
                onTouchStart={e => { e.stopPropagation(); setShowSettings(s => !s); }}
              >
                ⚙️
              </button>
            </div>

            {/* Breathing orb */}
            <BreathingOrb stressScore={stressScore} stressState={stressState} isHeld={isHeld} />

            {/* Status panel */}
            <StatusPanel stressScore={stressScore} stressState={stressState} topEmotion={topEmotion} />

            {/* Hold hint */}
            <motion.p
              className="text-slate-600 text-xs text-center mt-2"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Touch & hold orb · Swipe down to reset
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Welcome state (before start) ---- */}
      <AnimatePresence>
        {!started && !showPrivacy && (
          <motion.div
            className="relative z-10 flex flex-col items-center justify-center gap-8 text-center px-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="text-7xl mb-2 animate-float">🌿</div>
            <h1 className="text-white text-4xl font-bold tracking-tight">CalmSpace</h1>
            <p className="text-slate-400 text-base max-w-xs leading-relaxed">
              Touch to begin your calm journey
            </p>
            <motion.button
              className="mt-4 px-10 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-xl shadow-indigo-500/30"
              whileTap={{ scale: 0.96 }}
              onMouseDown={e => { e.stopPropagation(); setShowPrivacy(true); }}
              onTouchStart={e => { e.stopPropagation(); setShowPrivacy(true); }}
            >
              Begin ✨
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Privacy Modal ---- */}
      <AnimatePresence>
        {showPrivacy && (
          <PrivacyModal onAccept={handleAccept} onDecline={handleDecline} />
        )}
      </AnimatePresence>

      {/* ---- Settings Drawer ---- */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="glass-strong rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
              <h3 className="text-white font-semibold text-center text-sm tracking-wide">Settings</h3>

              {/* Sound toggle */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">🔊 Ambient Sound</span>
                <button
                  className={`w-12 h-6 rounded-full transition-colors ${soundOn ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  onMouseDown={e => { e.stopPropagation(); setSoundOn(s => !s); }}
                  onTouchStart={e => { e.stopPropagation(); setSoundOn(s => !s); }}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${soundOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Camera toggle */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">📷 Camera Sensing</span>
                <button
                  className={`w-12 h-6 rounded-full transition-colors ${cameraEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                  onMouseDown={e => { e.stopPropagation(); cameraEnabled ? stopCamera() : startCamera(); }}
                  onTouchStart={e => { e.stopPropagation(); cameraEnabled ? stopCamera() : startCamera(); }}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${cameraEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Close */}
              <button
                className="glass py-2.5 rounded-full text-slate-400 text-sm text-center"
                onMouseDown={e => { e.stopPropagation(); setShowSettings(false); }}
                onTouchStart={e => { e.stopPropagation(); setShowSettings(false); }}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
