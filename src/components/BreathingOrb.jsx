/**
 * BreathingOrb.jsx
 * The central living orb of CalmSpace.
 * Dynamically size, color, and pulsation speed respond to stressScore.
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const STATE_STYLES = {
    high: {
        gradient: 'from-indigo-600 via-violet-700 to-purple-900',
        ring1: 'border-indigo-500/40',
        ring2: 'border-indigo-400/60',
        orbClass: 'orb-high',
        blurColor: 'rgb(99,102,241)',
        duration: 2,
    },
    moderate: {
        gradient: 'from-sky-500 via-cyan-600 to-blue-800',
        ring1: 'border-cyan-500/40',
        ring2: 'border-cyan-400/60',
        orbClass: 'orb-moderate',
        blurColor: 'rgb(56,189,248)',
        duration: 3,
    },
    mild: {
        gradient: 'from-emerald-400 via-teal-500 to-cyan-700',
        ring1: 'border-emerald-500/40',
        ring2: 'border-emerald-400/60',
        orbClass: 'orb-mild',
        blurColor: 'rgb(52,211,153)',
        duration: 4,
    },
    calm: {
        gradient: 'from-violet-400 via-purple-500 to-indigo-700',
        ring1: 'border-violet-500/40',
        ring2: 'border-violet-400/60',
        orbClass: 'orb-calm',
        blurColor: 'rgb(167,139,250)',
        duration: 5,
    },
};

const ICON = {
    high: '🌊',
    moderate: '🌬️',
    mild: '🌿',
    calm: '✨',
};

export default function BreathingOrb({ stressScore = 15, stressState = 'calm', isHeld = false }) {
    const style = useMemo(() => STATE_STYLES[stressState] || STATE_STYLES.calm, [stressState]);

    // Orb size: 160px base, grows when held or high stress
    const sizeBase = stressState === 'high' ? 176 : stressState === 'moderate' ? 168 : 160;
    const size = isHeld ? sizeBase + 28 : sizeBase;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size + 64, height: size + 64 }}>
            {/* Outer ambient glow blur */}
            <div
                className="absolute rounded-full"
                style={{
                    width: size + 60,
                    height: size + 60,
                    background: style.blurColor,
                    opacity: 0.12 + (stressScore / 100) * 0.15,
                    filter: 'blur(50px)',
                    transition: 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
            />

            {/* Ring 1 */}
            <motion.div
                className={`absolute rounded-full border ${style.ring1}`}
                style={{ width: size + 48, height: size + 48 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />

            {/* Ring 2 — emotion status ring */}
            <motion.div
                className={`absolute rounded-full border-2 ${style.ring2}`}
                style={{ width: size + 18, height: size + 18 }}
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />

            {/* Core Orb */}
            <motion.div
                className={`relative rounded-full bg-gradient-to-tr ${style.gradient} flex items-center justify-center shadow-2xl cursor-pointer select-none ${style.orbClass}`}
                style={{
                    width: size,
                    height: size,
                    transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                whileTap={{ scale: 0.96 }}
            >
                {/* Icon */}
                <span className="text-5xl" role="img" aria-label={stressState}>
                    {ICON[stressState]}
                </span>

                {/* Score badge */}
                <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 glass px-2 py-0.5 rounded-full"
                    style={{ minWidth: 44 }}
                >
                    <span className="text-white/80 text-xs font-bold tracking-widest text-center block">
                        {stressScore}
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
