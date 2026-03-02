/**
 * StatusPanel.jsx — Inline Styles Version
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = {
    high: {
        headline: "Let's breathe together.",
        sub: "Inhale slowly for 4 counts. Hold. Exhale for 6.",
        icons: ['💜', '🌊', '🕊️'],
        tag: 'High Stress',
        tagStyle: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' },
        barGradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    },
    moderate: {
        headline: "Touch the waves.",
        sub: "Slow your breath and let the rhythm guide you.",
        icons: ['🌬️', '💙', '🌀'],
        tag: 'Moderate',
        tagStyle: { background: 'rgba(56,189,248,0.15)', color: '#7dd3fc', border: '1px solid rgba(56,189,248,0.3)' },
        barGradient: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
    },
    mild: {
        headline: "You're doing great.",
        sub: "Keep your calm flow going. The water is still.",
        icons: ['🌿', '🌱', '💚'],
        tag: 'Mild Stress',
        tagStyle: { background: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.3)' },
        barGradient: 'linear-gradient(90deg, #34d399, #059669)',
    },
    calm: {
        headline: "You seem calm.",
        sub: "Enjoy your peace. You earned this moment.",
        icons: ['✨', '🌸', '🦋'],
        tag: 'Calm',
        tagStyle: { background: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.3)' },
        barGradient: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
    },
};

const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 280 } },
};

export default function StatusPanel({ stressState = 'calm', stressScore = 15, topEmotion = 'neutral' }) {
    const info = MESSAGES[stressState] || MESSAGES.calm;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={stressState}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', padding: '0 1rem', width: '100%' }}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -16 }}
            >
                {/* State tag */}
                <motion.div variants={itemVariants}>
                    <span style={{
                        padding: '4px 16px', borderRadius: 9999, fontSize: '0.7rem',
                        fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                        ...info.tagStyle,
                    }}>
                        {info.tag}
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    style={{ color: 'white', fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.25 }}
                    variants={itemVariants}
                >
                    {info.headline}
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: 280, lineHeight: 1.7 }}
                    variants={itemVariants}
                >
                    {info.sub}
                </motion.p>

                {/* Floating mood icons */}
                <motion.div style={{ display: 'flex', gap: '1rem', marginTop: 4 }} variants={itemVariants}>
                    {info.icons.map((icon, i) => (
                        <div
                            key={icon}
                            className="mood-icon"
                            style={{ animationDelay: `${i * 0.7}s`, animationDuration: `${4 + i * 0.8}s`, fontSize: '1.5rem' }}
                            role="img"
                            aria-label={icon}
                        >
                            {icon}
                        </div>
                    ))}
                </motion.div>

                {/* Stress score bar */}
                <motion.div style={{ width: '100%', maxWidth: 280 }} variants={itemVariants}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: 8 }}>
                        <span>Calm</span>
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Index: {stressScore}</span>
                        <span>Tense</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, overflow: 'hidden' }}>
                        <motion.div
                            style={{ height: '100%', borderRadius: 9999, background: info.barGradient }}
                            animate={{ width: `${stressScore}%` }}
                            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                    </div>
                </motion.div>

                {/* Emotion detected */}
                {topEmotion && topEmotion !== 'neutral' && (
                    <motion.p style={{ color: '#475569', fontSize: '0.75rem' }} variants={itemVariants}>
                        Detected: <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{topEmotion}</span>
                    </motion.p>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
