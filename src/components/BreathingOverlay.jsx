/**
 * BreathingOverlay.jsx
 * Full-screen intervention that appears when stress is high or moderate.
 * Guides user through a breathing exercise with animated circle.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
    { label: 'Breathe In', duration: 4000, scale: 1.5 },
    { label: 'Hold', duration: 2000, scale: 1.5 },
    { label: 'Breathe Out', duration: 6000, scale: 0.85 },
    { label: 'Rest', duration: 2000, scale: 0.85 },
];

const STATE_CONFIG = {
    high: {
        title: '⚡ Take a deep breath',
        subtitle: 'Your tension is rising. Let\'s slow down together.',
        accentColor: '#818cf8',
        glowColor: 'rgba(99,102,241,0.4)',
        showBreathing: true,
    },
    moderate: {
        title: '🌊 Breathe with the waves',
        subtitle: 'Follow the ring. Inhale as it grows, exhale as it shrinks.',
        accentColor: '#38bdf8',
        glowColor: 'rgba(56,189,248,0.3)',
        showBreathing: true,
    },
};

export default function BreathingOverlay({ stressState, visible, onDismiss }) {
    const [phase, setPhase] = useState(0);
    const [cycleCount, setCycleCount] = useState(0);
    const config = STATE_CONFIG[stressState];

    // Advance breathing phases
    useEffect(() => {
        if (!visible || !config?.showBreathing) return;
        setPhase(0);
        setCycleCount(0);
    }, [visible, stressState, config]);

    useEffect(() => {
        if (!visible || !config?.showBreathing) return;
        const timer = setTimeout(() => {
            const next = (phase + 1) % PHASES.length;
            if (next === 0) setCycleCount(c => c + 1);
            setPhase(next);
        }, PHASES[phase].duration);
        return () => clearTimeout(timer);
    }, [phase, visible, config]);

    if (!config) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(10,8,20,0.82)',
                        backdropFilter: 'blur(30px)',
                        cursor: 'pointer',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    onClick={onDismiss}
                >
                    {/* Title */}
                    <motion.div
                        style={{ textAlign: 'center', marginBottom: 40 }}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>
                            {config.title}
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: 280, lineHeight: 1.6, textAlign: 'center' }}>
                            {config.subtitle}
                        </p>
                    </motion.div>

                    {/* Breathing ring */}
                    <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Outer glow */}
                        <motion.div
                            style={{
                                position: 'absolute', borderRadius: '50%',
                                width: 200, height: 200,
                                background: config.glowColor,
                                filter: 'blur(30px)',
                            }}
                            animate={{ scale: PHASES[phase].scale, opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: PHASES[phase].duration / 1000, ease: 'easeInOut' }}
                        />
                        {/* Ring */}
                        <motion.div
                            style={{
                                width: 160, height: 160, borderRadius: '50%',
                                border: `3px solid ${config.accentColor}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 0 30px ${config.glowColor}`,
                            }}
                            animate={{ scale: PHASES[phase].scale }}
                            transition={{ duration: PHASES[phase].duration / 1000, ease: 'easeInOut' }}
                        >
                            {/* Phase label */}
                            <motion.div
                                key={phase}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                style={{ textAlign: 'center' }}
                            >
                                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 600 }}>
                                    {PHASES[phase].label}
                                </div>
                                <div style={{ color: config.accentColor, fontSize: '1.4rem', fontWeight: 700, marginTop: 4 }}>
                                    {Math.ceil(PHASES[phase].duration / 1000)}s
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Cycle count */}
                    {cycleCount > 0 && (
                        <motion.p
                            style={{ color: '#34d399', fontSize: '0.875rem', marginTop: 24 }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                            ✓ {cycleCount} breath cycle{cycleCount > 1 ? 's' : ''} complete
                        </motion.p>
                    )}

                    <motion.p
                        style={{ color: '#475569', fontSize: '0.75rem', marginTop: 20 }}
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        Tap anywhere to dismiss
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
