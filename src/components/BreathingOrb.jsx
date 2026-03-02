/**
 * BreathingOrb.jsx — Inline Styles Version
 */
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const STATE_STYLES = {
    high: {
        gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed, #4c1d95)',
        ringColor: 'rgba(99,102,241,0.35)',
        ring2Color: 'rgba(99,102,241,0.55)',
        orbClass: 'orb-high',
        blurColor: 'rgba(99,102,241,0.15)',
        duration: 2,
    },
    moderate: {
        gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #1e40af)',
        ringColor: 'rgba(56,189,248,0.35)',
        ring2Color: 'rgba(56,189,248,0.55)',
        orbClass: 'orb-moderate',
        blurColor: 'rgba(56,189,248,0.15)',
        duration: 3,
    },
    mild: {
        gradient: 'linear-gradient(135deg, #34d399, #14b8a6, #0e7490)',
        ringColor: 'rgba(52,211,153,0.35)',
        ring2Color: 'rgba(52,211,153,0.55)',
        orbClass: 'orb-mild',
        blurColor: 'rgba(52,211,153,0.15)',
        duration: 4,
    },
    calm: {
        gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6, #4338ca)',
        ringColor: 'rgba(167,139,250,0.35)',
        ring2Color: 'rgba(167,139,250,0.55)',
        orbClass: 'orb-calm',
        blurColor: 'rgba(167,139,250,0.15)',
        duration: 5,
    },
};

const ICON = { high: '🌊', moderate: '🌬️', mild: '🌿', calm: '✨' };

export default function BreathingOrb({ stressScore = 15, stressState = 'calm', isHeld = false }) {
    const style = useMemo(() => STATE_STYLES[stressState] || STATE_STYLES.calm, [stressState]);
    const sizeBase = stressState === 'high' ? 176 : 168;
    const size = isHeld ? sizeBase + 28 : sizeBase;
    const container = size + 64;

    return (
        <div style={{ position: 'relative', width: container, height: container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Ambient blur */}
            <div style={{
                position: 'absolute',
                width: size + 60, height: size + 60,
                borderRadius: '50%',
                background: style.blurColor,
                filter: 'blur(50px)',
                opacity: 0.4 + (stressScore / 100) * 0.4,
                transition: 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }} />

            {/* Ring 1 */}
            <motion.div
                style={{
                    position: 'absolute', width: size + 48, height: size + 48,
                    borderRadius: '50%', border: `1px solid ${style.ringColor}`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />

            {/* Ring 2 — emotion ring */}
            <motion.div
                style={{
                    position: 'absolute', width: size + 18, height: size + 18,
                    borderRadius: '50%', border: `2px solid ${style.ring2Color}`,
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />

            {/* Core orb */}
            <motion.div
                className={style.orbClass}
                style={{
                    width: size, height: size,
                    borderRadius: '50%',
                    background: style.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                whileTap={{ scale: 0.96 }}
            >
                <span style={{ fontSize: '3rem' }} role="img" aria-label={stressState}>{ICON[stressState]}</span>

                {/* Score badge */}
                <div className="glass" style={{
                    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                    padding: '2px 10px', minWidth: 44,
                }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, display: 'block', textAlign: 'center' }}>
                        {stressScore}
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
