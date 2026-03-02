/**
 * PrivacyModal.jsx — Inline Styles Version
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrivacyModal({ onAccept, onDecline }) {
    return (
        <AnimatePresence>
            <motion.div
                style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    padding: '1.5rem',
                }}
                className="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="glass-strong"
                    style={{
                        padding: '2rem', width: '100%', maxWidth: 380,
                        textAlign: 'center', position: 'relative', overflow: 'hidden',
                    }}
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                >
                    {/* Glow */}
                    <div style={{
                        position: 'absolute', top: -48, left: '50%', transform: 'translateX(-50%)',
                        width: 160, height: 160, borderRadius: '50%',
                        background: 'rgba(99,102,241,0.2)', filter: 'blur(40px)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
                        A gentle look at how you feel
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                        We'll read only your <strong style={{ color: '#cbd5e1' }}>facial expressions</strong>,
                        never record or store any video. All processing happens{' '}
                        <strong style={{ color: '#cbd5e1' }}>only on your device</strong>.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <motion.button
                            onClick={onAccept}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: 9999,
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                color: 'white', fontWeight: 600, fontSize: '1rem',
                                border: 'none', cursor: 'pointer',
                                boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
                            }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Enable — let's begin ✨
                        </motion.button>
                        <motion.button
                            onClick={onDecline}
                            className="glass"
                            style={{
                                width: '100%', padding: '0.75rem',
                                color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500,
                                border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer',
                            }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Continue without camera
                        </motion.button>
                    </div>

                    <p style={{ color: '#475569', fontSize: '0.7rem', marginTop: '1rem' }}>
                        You can turn off camera access anytime from the settings menu.
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
