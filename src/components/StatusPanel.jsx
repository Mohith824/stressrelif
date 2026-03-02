/**
 * StatusPanel.jsx
 * Shows the emotion state label, message, floating mood icons,
 * and the stress score bar — all animated with Framer Motion.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = {
    high: {
        headline: "Let's breathe together.",
        sub: "Inhale slowly for 4 counts. Hold. Exhale for 6.",
        icons: ['💜', '🌊', '🕊️'],
        tag: 'High Stress',
        tagColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    },
    moderate: {
        headline: "Touch the waves.",
        sub: "Slow your breath and let the rhythm guide you.",
        icons: ['🌬️', '💙', '🌀'],
        tag: 'Moderate',
        tagColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    },
    mild: {
        headline: "You're doing great.",
        sub: "Keep your calm flow going. The water is still.",
        icons: ['🌿', '🌱', '💚'],
        tag: 'Mild Stress',
        tagColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    calm: {
        headline: "You seem calm.",
        sub: "Enjoy your peace. You earned this moment.",
        icons: ['✨', '🌸', '🦋'],
        tag: 'Calm',
        tagColor: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
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
                className="flex flex-col items-center gap-4 text-center px-4 w-full"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -16 }}
            >
                {/* State tag */}
                <motion.div variants={itemVariants}>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${info.tagColor}`}>
                        {info.tag}
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    className="text-white text-3xl font-bold tracking-tight leading-tight"
                    variants={itemVariants}
                >
                    {info.headline}
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    className="text-slate-400 text-sm max-w-xs leading-relaxed"
                    variants={itemVariants}
                >
                    {info.sub}
                </motion.p>

                {/* Floating mood icons */}
                <motion.div className="flex gap-4 mt-1" variants={itemVariants}>
                    {info.icons.map((icon, i) => (
                        <div
                            key={icon}
                            className="mood-icon text-2xl"
                            style={{ animationDelay: `${i * 0.7}s`, animationDuration: `${4 + i * 0.8}s` }}
                            role="img"
                            aria-label={icon}
                        >
                            {icon}
                        </div>
                    ))}
                </motion.div>

                {/* Stress score bar */}
                <motion.div className="w-full max-w-xs" variants={itemVariants}>
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                        <span>Calm</span>
                        <span className="text-slate-400 font-semibold">Stress Index: {stressScore}</span>
                        <span>Tense</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                background: stressScore > 79
                                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                    : stressScore > 49
                                        ? 'linear-gradient(90deg, #38bdf8, #0ea5e9)'
                                        : stressScore > 19
                                            ? 'linear-gradient(90deg, #34d399, #059669)'
                                            : 'linear-gradient(90deg, #a78bfa, #7c3aed)',
                            }}
                            animate={{ width: `${stressScore}%` }}
                            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                    </div>
                </motion.div>

                {/* Emotion detected */}
                {topEmotion && topEmotion !== 'neutral' && (
                    <motion.p className="text-slate-600 text-xs" variants={itemVariants}>
                        Detected: <span className="text-slate-400 capitalize">{topEmotion}</span>
                    </motion.p>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
