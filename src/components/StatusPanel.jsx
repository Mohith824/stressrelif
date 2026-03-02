/**
 * StatusPanel.jsx — WITH EMOTION EMOJI + LIVE INDICATOR
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = {
    high: {
        headline: "Take a deep breath 🌬️",
        sub: "Inhale slowly for 4 counts. Hold. Exhale for 6.",
        icons: ['💜', '🌊', '🕊️'],
        tag: 'High Stress',
        tagStyle: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' },
        barGradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        breatheNudge: true,
    },
    moderate: {
        headline: "Slow your breath 🌊",
        sub: "Touch the waves. Match the rhythm. Feel the flow.",
        icons: ['🌬️', '💙', '🌀'],
        tag: 'Moderate',
        tagStyle: { background: 'rgba(56,189,248,0.15)', color: '#7dd3fc', border: '1px solid rgba(56,189,248,0.3)' },
        barGradient: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
        breatheNudge: true,
    },
    mild: {
        headline: "You're doing great 🌿",
        sub: "Keep your calm flow going. The water is still.",
        icons: ['🌿', '🌱', '💚'],
        tag: 'Mild Stress',
        tagStyle: { background: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.3)' },
        barGradient: 'linear-gradient(90deg, #34d399, #059669)',
        breatheNudge: false,
    },
    calm: {
        headline: "You seem calm ✨",
        sub: "Enjoy your peace. You've earned this moment.",
        icons: ['✨', '🌸', '🦋'],
        tag: 'Calm',
        tagStyle: { background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.3)' },
        barGradient: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
        breatheNudge: false,
    },
};

const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 280 } },
};

export default function StatusPanel({ stressState = 'calm', stressScore = 15, topEmotion = 'neutral', topEmoji = '😐', onBreatheTap }) {
    const info = MESSAGES[stressState] || MESSAGES.calm;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={stressState}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem', textAlign: 'center', padding: '0 1rem', width: '100%' }}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -16 }}
            >
                {/* State tag */}
                <motion.div variants={itemVariants}>
                    <span style={{ padding: '4px 16px', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', ...info.tagStyle }}>
                        {info.tag}
                    </span>
                </motion.div>

                {/* Detected emotion card */}
                <motion.div
                    variants={itemVariants}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 9999, padding: '6px 18px',
                    }}
                >
                    <span style={{ fontSize: '1.6rem' }}>{topEmoji}</span>
                    <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 500, textTransform: 'capitalize' }}>
                        Feeling {topEmotion}
                    </span>
                    {/* Live pulse dot */}
                    <motion.div
                        style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', marginLeft: 4 }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    />
                </motion.div>

                {/* Headline */}
                <motion.h1
                    style={{ color: 'white', fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.25 }}
                    variants={itemVariants}
                >
                    {info.headline}
                </motion.h1>

                {/* Sub */}
                <motion.p
                    style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: 280, lineHeight: 1.7 }}
                    variants={itemVariants}
                >
                    {info.sub}
                </motion.p>

                {/* Breathe button — only when stressed */}
                {info.breatheNudge && (
                    <motion.button
                        variants={itemVariants}
                        onClick={onBreatheTap}
                        style={{
                            padding: '10px 28px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(99,102,241,0.4)',
                            color: '#c4b5fd', fontSize: '0.875rem', fontWeight: 600,
                        }}
                        whileTap={{ scale: 0.95 }}
                        animate={{ boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 20px rgba(99,102,241,0.5)', '0 0 0px rgba(99,102,241,0)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        🌬️ Guide me to breathe
                    </motion.button>
                )}

                {/* Floating mood icons */}
                <motion.div style={{ display: 'flex', gap: '1rem', marginTop: 4 }} variants={itemVariants}>
                    {info.icons.map((icon, i) => (
                        <div key={icon} className="mood-icon"
                            style={{ animationDelay: `${i * 0.7}s`, animationDuration: `${4 + i * 0.8}s`, fontSize: '1.4rem' }}
                            role="img" aria-label={icon}>{icon}</div>
                    ))}
                </motion.div>

                {/* Score bar */}
                <motion.div style={{ width: '100%', maxWidth: 280 }} variants={itemVariants}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: 6 }}>
                        <span>😌 Calm</span>
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Stress: {stressScore}</span>
                        <span>😰 Tense</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, overflow: 'hidden' }}>
                        <motion.div
                            style={{ height: '100%', borderRadius: 9999, background: info.barGradient }}
                            animate={{ width: `${stressScore}%` }}
                            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
