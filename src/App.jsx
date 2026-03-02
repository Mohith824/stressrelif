/**
 * App.jsx — CalmSpace Single Page
 * Wildcard 2: Alternative UI — physical interaction without typing.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmotion } from './hooks/useEmotion';
import { useCalmSound } from './hooks/useCalmSound';
import ParticleCanvas from './components/ParticleCanvas';
import BreathingOrb from './components/BreathingOrb';
import PrivacyModal from './components/PrivacyModal';
import StatusPanel from './components/StatusPanel';

const BG = {
  high: 'radial-gradient(circle at 25% 25%, #1a0050 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #200060 0%, transparent 55%)',
  moderate: 'radial-gradient(circle at 25% 25%, #002a4a 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #003060 0%, transparent 55%)',
  mild: 'radial-gradient(circle at 25% 25%, #001e2a 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #001a10 0%, transparent 55%)',
  calm: 'radial-gradient(circle at 25% 25%, #15003d 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #000830 0%, transparent 55%)',
};

function Ripple({ x, y, onDone }) {
  return (
    <motion.div
      style={{
        position: 'fixed', left: x - 20, top: y - 20,
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(0,255,255,0.25)', zIndex: 9998, pointerEvents: 'none',
      }}
      initial={{ scale: 0.3, opacity: 0.7 }}
      animate={{ scale: 5, opacity: 0 }}
      transition={{ duration: 0.9, ease: [0, 0.55, 0.45, 1] }}
      onAnimationComplete={onDone}
    />
  );
}

export default function App() {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [started, setStarted] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [pointer, setPointer] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const holdTimer = useRef(null);
  const gestureStart = useRef(null);
  const rippleId = useRef(0);

  const { stressScore, stressState, topEmotion } = useEmotion(videoRef, cameraEnabled && started);
  const { play, stopAll } = useCalmSound();

  useEffect(() => {
    if (soundOn && started) play(stressState);
    else if (!soundOn) stopAll();
  }, [stressState, soundOn, started, play, stopAll]);

  useEffect(() => {
    if (!started || stressState !== 'high') return;
    const interval = setInterval(() => {
      if (navigator.vibrate) navigator.vibrate([80, 200, 80]);
    }, 4000);
    return () => clearInterval(interval);
  }, [stressState, started]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraEnabled(true);
    } catch { setCameraEnabled(false); }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraEnabled(false);
  }, []);

  const handleAccept = useCallback(async () => {
    setShowPrivacy(false); setStarted(true); setSoundOn(true);
    await startCamera();
  }, [startCamera]);

  const handleDecline = useCallback(() => {
    setShowPrivacy(false); setStarted(true); setSoundOn(true);
  }, []);

  const addRipple = useCallback((x, y) => {
    const id = rippleId.current++;
    setRipples(r => [...r.slice(-6), { id, x, y }]);
  }, []);

  const onPointerDown = useCallback((e) => {
    const { clientX: x, clientY: y } = e.touches?.[0] ?? e;
    gestureStart.current = { x, y, t: Date.now() };
    addRipple(x, y);
    setPointer({ x, y });
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
    setIsHeld(false); setPointer(null);
    if (!gestureStart.current) return;
    const { clientX: ex, clientY: ey } = e.changedTouches?.[0] ?? e;
    const dx = ex - gestureStart.current.x;
    const dy = ey - gestureStart.current.y;
    const dt = Date.now() - gestureStart.current.t;
    gestureStart.current = null;
    if (dy > 110 && Math.abs(dx) < 60 && dt < 500) {
      setShowPrivacy(true); setStarted(false); stopAll(); stopCamera();
    }
  }, [stopAll, stopCamera]);

  return (
    <div
      className="app-container"
      style={{ background: BG[stressState] || BG.calm }}
      onMouseDown={onPointerDown}
      onMouseMove={pointer ? onPointerMove : undefined}
      onMouseUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      {/* Particles */}
      <ParticleCanvas stressScore={stressScore} pointerPos={pointer} />

      {/* Ambient wave blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div
          style={{ position: 'absolute', width: 700, height: 700, left: -200, top: -200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(53,18,226,0.4), transparent 70%)', opacity: 0.12 }}
          animate={{ scale: [1, 1.08, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ position: 'absolute', width: 600, height: 600, right: -150, bottom: -150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,255,0.25), transparent 70%)', opacity: 0.12 }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
      </div>

      {/* Hidden video for face-api */}
      <video ref={videoRef} muted playsInline style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} aria-hidden="true" />

      {/* Ripples */}
      {ripples.map(r => (
        <Ripple key={r.id} x={r.x} y={r.y} onDone={() => setRipples(prev => prev.filter(p => p.id !== r.id))} />
      ))}

      {/* Main UI — started state */}
      <AnimatePresence>
        {started && (
          <motion.div
            style={{
              position: 'relative', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '2rem', width: '100%', padding: '0 1.5rem', maxWidth: 440,
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="glass" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cameraEnabled ? '#34d399' : '#475569' }} />
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{cameraEnabled ? 'Sensing' : 'Simulating'}</span>
              </div>
              <h1 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em' }}>CalmSpace</h1>
              <button
                className="glass"
                style={{ padding: '6px 14px', color: '#94a3b8', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
                onMouseDown={e => { e.stopPropagation(); setShowSettings(s => !s); }}
                onTouchStart={e => { e.stopPropagation(); setShowSettings(s => !s); }}
              >
                ⚙️
              </button>
            </div>

            <BreathingOrb stressScore={stressScore} stressState={stressState} isHeld={isHeld} />
            <StatusPanel stressScore={stressScore} stressState={stressState} topEmotion={topEmotion} />

            <motion.p
              style={{ color: '#334155', fontSize: '0.75rem', textAlign: 'center', marginTop: 8 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Touch & hold orb · Swipe down to reset
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome screen */}
      <AnimatePresence>
        {!started && !showPrivacy && (
          <motion.div
            style={{
              position: 'relative', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '2rem', textAlign: 'center', padding: '0 2rem',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="animate-float" style={{ fontSize: '4.5rem', marginBottom: 8 }}>🌿</div>
            <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>CalmSpace</h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: 260, lineHeight: 1.7 }}>
              Touch to begin your calm journey
            </p>
            <motion.button
              style={{
                marginTop: '1rem', padding: '1rem 2.5rem', borderRadius: 9999,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer',
                boxShadow: '0 12px 40px rgba(99,102,241,0.35)',
              }}
              whileTap={{ scale: 0.96 }}
              onMouseDown={e => { e.stopPropagation(); setShowPrivacy(true); }}
              onTouchStart={e => { e.stopPropagation(); setShowPrivacy(true); }}
            >
              Begin ✨
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacy && <PrivacyModal onAccept={handleAccept} onDecline={handleDecline} />}
      </AnimatePresence>

      {/* Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '1rem' }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="glass-strong" style={{ padding: '1.5rem', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '1.5rem' }}>
              <h3 style={{ color: 'white', fontWeight: 600, textAlign: 'center', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Settings</h3>

              {/* Sound */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>🔊 Ambient Sound</span>
                <div
                  className="toggle-track"
                  style={{ background: soundOn ? '#4f46e5' : '#334155', cursor: 'pointer' }}
                  onMouseDown={e => { e.stopPropagation(); setSoundOn(s => !s); }}
                  onTouchStart={e => { e.stopPropagation(); setSoundOn(s => !s); }}
                >
                  <div className="toggle-thumb" style={{ transform: soundOn ? 'translateX(1.5rem)' : 'translateX(2px)' }} />
                </div>
              </div>

              {/* Camera */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>📷 Camera Sensing</span>
                <div
                  className="toggle-track"
                  style={{ background: cameraEnabled ? '#4f46e5' : '#334155', cursor: 'pointer' }}
                  onMouseDown={e => { e.stopPropagation(); cameraEnabled ? stopCamera() : startCamera(); }}
                  onTouchStart={e => { e.stopPropagation(); cameraEnabled ? stopCamera() : startCamera(); }}
                >
                  <div className="toggle-thumb" style={{ transform: cameraEnabled ? 'translateX(1.5rem)' : 'translateX(2px)' }} />
                </div>
              </div>

              <button
                className="glass"
                style={{ padding: '0.625rem', color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', border: 'none', cursor: 'pointer', borderRadius: 9999 }}
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
