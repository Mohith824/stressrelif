/**
 * CalmDownBanner.jsx
 * A persistent top banner that appears when camera is on and stress is high/moderate.
 * Slides in from top, pulses gently, and shows a targeted message.
 * Stays visible until the user's stress actually drops.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CONFIGS = {
    high: {
        bg: 'linear-gradient(135deg, rgba(79,46,229,0.85), rgba(109,40,217,0.85))',
        borderColor: 'rgba(139,92,246,0.6)',
        emoji: '🌬️',
        title: 'You seem stressed — let\'s slow down',
        sub: 'Close your eyes. Take one deep breath. You\'ve got this.',
        soundNote: '🎵 Soothing music is playing for you',
    },
    moderate: {
        bg: 'linear-gradient(135deg, rgba(8,145,178,0.75), rgba(14,116,144,0.75))',
        borderColor: 'rgba(34,211,238,0.5)',
        emoji: '🌊',
        title: 'Feeling a little tense?',
        sub: 'Breathe with the orb. Slow your pace. The waves will calm you.',
        soundNote: '🎵 Calming tones are playing',
    },
};

export default function CalmDownBanner({ stressState, cameraEnabled, visible }) {
    const cfg = CONFIGS[stressState];
    // Only show if camera is on and stress is high or moderate
    const show = cameraEnabled && visible && !!cfg;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key={stressState}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0,
                        zIndex: 90, display: 'flex', justifyContent: 'center',
                        padding: '0.75rem 1rem', paddingTop: 'env(safe-area-inset-top, 0.75rem)',
                    }}
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                >
                    <motion.div
                        style={{
                            width: '100%', maxWidth: 420,
                            background: cfg.bg,
                            backdropFilter: 'blur(30px)',
                            border: `1px solid ${cfg.borderColor}`,
                            borderRadius: '1.2rem',
                            padding: '0.9rem 1.2rem',
                            display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                        }}
                        animate={{
                            boxShadow: [
                                '0 8px 40px rgba(99,102,241,0.2)',
                                '0 8px 60px rgba(99,102,241,0.5)',
                                '0 8px 40px rgba(99,102,241,0.2)',
                            ]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    >
                        {/* Icon */}
                        <div style={{ fontSize: '1.8rem', lineHeight: 1, flexShrink: 0 }}>{cfg.emoji}</div>

                        {/* Text */}
                        <div style={{ flex: 1 }}>
                            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: 3 }}>
                                {cfg.title}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: 4 }}>
                                {cfg.sub}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>{cfg.soundNote}</p>
                        </div>

                        {/* Pulse indicator */}
                        <motion.div
                            style={{ width: 8, height: 8, borderRadius: '50%', background: '#a5f3fc', flexShrink: 0, marginTop: 6 }}
                            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.4, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
