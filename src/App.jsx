/**
 * App.jsx — CalmSpace (FULLY WIRED)
 * - Pointer velocity drives stress score in simulation mode
 * - Click bursts raise stress score
 * - BreathingOverlay fires when stress is high/moderate
 * - Sound plays automatically on start
 * - Orb click triggers guided breathing
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmotion } from './hooks/useEmotion';
import { useCalmSound } from './hooks/useCalmSound';
import ParticleCanvas from './components/ParticleCanvas';
import BreathingOrb from './components/BreathingOrb';
import PrivacyModal from './components/PrivacyModal';
import StatusPanel from './components/StatusPanel';
import BreathingOverlay from './components/BreathingOverlay';

const BG = {
  high: 'radial-gradient(circle at 25% 25%, #1a0050 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #200060 0%, transparent 55%)',
  moderate: 'radial-gradient(circle at 25% 25%, #002a4a 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #003060 0%, transparent 55%)',
  mild: 'radial-gradient(circle at 25% 25%, #001e2a 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #001a10 0%, transparent 55%)',
  calm: 'radial-gradient(circle at 25% 25%, #15003d 0%, #0a0814 55%), radial-gradient(circle at 75% 75%, #000830 0%, transparent 55%)',
};

function Ripple({ x, y, color = 'rgba(0,255,255,0.25)', onDone }) {
  return (
    <motion.div
      style={{
        position: 'fixed', left: x - 20, top: y - 20,
        width: 40, height: 40, borderRadius: '50%',
        background: color, zIndex: 9998, pointerEvents: 'none',
      }}
      initial={{ scale: 0.3, opacity: 0.8 }}
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
  const [soundOn, setSoundOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [prevStressState, setPrevStressState] = useState('calm');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const holdTimer = useRef(null);
  const gestureStart = useRef(null);
  const rippleId = useRef(0);
  const lastPointer = useRef(null);
  const lastPointerTime = useRef(Date.now());
  const velocitySmooth = useRef(0);

  const {
    stressScore, stressState, topEmotion, topEmoji,
    feedVelocity, feedClick
  } = useEmotion(videoRef, cameraEnabled && started);

  const { play, stopAll } = useCalmSound();

  // ── Auto sound based on state ──
  useEffect(() => {
    if (!started) return;
    if (soundOn) play(stressState);
    else stopAll();
  }, [stressState, soundOn, started, play, stopAll]);

  // ── Show breathing overlay when stress jumps HIGH or MODERATE ──
  useEffect(() => {
    if (!started) return;
    if (
      (stressState === 'high' && prevStressState !== 'high') ||
      (stressState === 'moderate' && prevStressState === 'calm')
    ) {
      setShowBreathing(true);
    }
    setPrevStressState(stressState);
  }, [stressState, prevStressState, started]);

  // ── Haptic pulses for high stress ──
  useEffect(() => {
    if (!started || stressState !== 'high') return;
    const t = setInterval(() => {
      if (navigator.vibrate) navigator.vibrate([60, 300, 60]);
    }, 4000);
    return () => clearInterval(t);
  }, [stressState, started]);

  // ── Camera ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }, audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
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

  // ── Ripples ──
  const addRipple = useCallback((x, y, color) => {
    const id = rippleId.current++;
    setRipples(r => [...r.slice(-8), { id, x, y, color }]);
  }, []);

  // ── Pointer velocity calculation ──
  const calcVelocity = useCallback((x, y) => {
    const now = Date.now();
    const dt = Math.max(1, now - lastPointerTime.current);
    if (lastPointer.current) {
      const dx = x - lastPointer.current.x;
      const dy = y - lastPointer.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rawVel = dist / dt * 1000; // pixels/sec
      velocitySmooth.current = velocitySmooth.current * 0.6 + rawVel * 0.4;
      feedVelocity(velocitySmooth.current);
    }
    lastPointer.current = { x, y };
    lastPointerTime.current = now;
  }, [feedVelocity]);

  // ── Global Gesture Handlers ──
  const onPointerDown = useCallback((e) => {
    const { clientX: x, clientY: y } = e.touches?.[0] ?? e;
    gestureStart.current = { x, y, t: Date.now() };

    // Feed click burst into emotion engine
    feedClick();

    // Color ripple by stress: stressed=red-tinted, calm=cyan
    const color = stressScore > 60
      ? 'rgba(139,92,246,0.35)'
      : stressScore > 35
        ? 'rgba(56,189,248,0.3)'
        : 'rgba(0,255,255,0.25)';
    addRipple(x, y, color);
    setPointer({ x, y });
    calcVelocity(x, y);

    holdTimer.current = setTimeout(() => {
      setIsHeld(true);
      if (navigator.vibrate) navigator.vibrate(60);
      // Big expand ripple on hold
      addRipple(x, y, 'rgba(167,139,250,0.3)');
    }, 500);
  }, [addRipple, feedClick, calcVelocity, stressScore]);

  const onPointerMove = useCallback((e) => {
    const { clientX: x, clientY: y } = e.touches?.[0] ?? e;
    setPointer({ x, y });
    calcVelocity(x, y);
  }, [calcVelocity]);

  const onPointerUp = useCallback((e) => {
    clearTimeout(holdTimer.current);
    setIsHeld(false);
    setPointer(null);
    velocitySmooth.current *= 0.3; // rapid decay on release
    feedVelocity(velocitySmooth.current);

    if (!gestureStart.current) return;
    const { clientX: ex, clientY: ey } = e.changedTouches?.[0] ?? e;
    const dx = ex - gestureStart.current.x;
    const dy = ey - gestureStart.current.y;
    const dt = Date.now() - gestureStart.current.t;
    gestureStart.current = null;

    // Swipe down = reset
    if (dy > 110 && Math.abs(dx) < 60 && dt < 500) {
      setShowBreathing(false); setShowPrivacy(true); setStarted(false);
      stopAll(); stopCamera();
    }
  }, [feedVelocity, stopAll, stopCamera]);

  return (
    <div
      className="app-container"
      style={{ background: BG[stressState] || BG.calm }}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      {/* Particles */}
      <ParticleCanvas stressScore={stressScore} pointerPos={pointer} />

      {/* Ambient blobs */}
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

      {/* Hidden video */}
      <video ref={videoRef} muted playsInline style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} aria-hidden="true" />

      {/* Ripples */}
      {ripples.map(r => (
        <Ripple key={r.id} x={r.x} y={r.y} color={r.color}
          onDone={() => setRipples(prev => prev.filter(p => p.id !== r.id))} />
      ))}

      {/* ── Main UI ── */}
      <AnimatePresence>
        {started && (
          <motion.div
            style={{
              position: 'relative', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '1.5rem', width: '100%', padding: '0 1.5rem', maxWidth: 440,
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="glass" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cameraEnabled ? '#34d399' : '#f59e0b' }} />
                <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                  {cameraEnabled ? '📷 Sensing' : '🖱️ Simulating'}
                </span>
              </div>
              <h1 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                CalmSpace
              </h1>
              <button
                className="glass"
                style={{ padding: '6px 12px', color: '#94a3b8', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
                onMouseDown={e => { e.stopPropagation(); setShowSettings(s => !s); }}
                onTouchStart={e => { e.stopPropagation(); setShowSettings(s => !s); }}
              >⚙️</button>
            </div>

            {/* Orb — clicking triggers breathing */}
            <div
              onMouseDown={e => { e.stopPropagation(); setShowBreathing(true); }}
              onTouchStart={e => { e.stopPropagation(); setShowBreathing(true); }}
            >
              <BreathingOrb stressScore={stressScore} stressState={stressState} isHeld={isHeld} />
            </div>

            {/* Status */}
            <StatusPanel
              stressScore={stressScore}
              stressState={stressState}
              topEmotion={topEmotion}
              topEmoji={topEmoji}
              onBreatheTap={() => setShowBreathing(true)}
            />

            <motion.p
              style={{ color: '#334155', fontSize: '0.72rem', textAlign: 'center' }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {cameraEnabled
                ? 'Look at camera · Hold orb to breathe · Swipe ↓ to reset'
                : 'Move mouse fast to raise stress · Hold orb to breathe · Swipe ↓ to reset'}
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
              justifyContent: 'center', gap: '1.5rem', textAlign: 'center', padding: '0 2rem',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="animate-float" style={{ fontSize: '4.5rem' }}>🌿</div>
            <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 700 }}>CalmSpace</h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: 260, lineHeight: 1.7 }}>
              Touch to begin your calm journey
            </p>
            <motion.button
              style={{
                marginTop: '0.5rem', padding: '1rem 2.5rem', borderRadius: 9999,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white', fontWeight: 600, fontSize: '1rem', border: 'none', cursor: 'pointer',
                boxShadow: '0 12px 40px rgba(99,102,241,0.4)',
              }}
              whileTap={{ scale: 0.96 }}
              onMouseDown={e => { e.stopPropagation(); setShowPrivacy(true); }}
              onTouchStart={e => { e.stopPropagation(); setShowPrivacy(true); }}
            >Begin ✨</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacy && <PrivacyModal onAccept={handleAccept} onDecline={handleDecline} />}
      </AnimatePresence>

      {/* ── Breathing Overlay ── */}
      <BreathingOverlay
        stressState={stressState}
        visible={showBreathing && started}
        onDismiss={() => setShowBreathing(false)}
      />

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '1rem' }}
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="glass-strong" style={{ padding: '1.5rem', width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ color: 'white', fontWeight: 600, textAlign: 'center', fontSize: '0.875rem' }}>Settings</h3>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>🔊 Ambient Sound</span>
                <div className="toggle-track" style={{ background: soundOn ? '#4f46e5' : '#334155' }}
                  onMouseDown={e => { e.stopPropagation(); setSoundOn(s => !s); }}
                  onTouchStart={e => { e.stopPropagation(); setSoundOn(s => !s); }}>
                  <div className="toggle-thumb" style={{ transform: soundOn ? 'translateX(1.5rem)' : 'translateX(2px)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>📷 Camera Sensing</span>
                <div className="toggle-track" style={{ background: cameraEnabled ? '#4f46e5' : '#334155' }}
                  onMouseDown={e => { e.stopPropagation(); cameraEnabled ? stopCamera() : startCamera(); }}
                  onTouchStart={e => { e.stopPropagation(); cameraEnabled ? stopCamera() : startCamera(); }}>
                  <div className="toggle-thumb" style={{ transform: cameraEnabled ? 'translateX(1.5rem)' : 'translateX(2px)' }} />
                </div>
              </div>

              <button className="glass"
                style={{ padding: '0.625rem', color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', border: 'none', cursor: 'pointer', borderRadius: 9999 }}
                onMouseDown={e => { e.stopPropagation(); setShowSettings(false); }}
                onTouchStart={e => { e.stopPropagation(); setShowSettings(false); }}>
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
