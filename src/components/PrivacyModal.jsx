/**
 * PrivacyModal.jsx
 * Consent dialog before camera activation.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrivacyModal({ onAccept, onDecline }) {
    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 modal-backdrop z-50 flex items-end sm:items-center justify-center p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="glass-strong rounded-2xl p-8 w-full max-w-sm text-center relative overflow-hidden"
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                >
                    {/* Decorative glow */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

                    <div className="text-5xl mb-4" role="img" aria-label="camera">📷</div>

                    <h2 className="text-xl font-bold text-white mb-2">
                        A gentle look at how you feel
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        We'll read only your <strong className="text-slate-300">facial expressions</strong>,
                        never record or store any video. All processing happens{' '}
                        <strong className="text-slate-300">only on your device</strong>.
                    </p>

                    <div className="flex flex-col gap-3">
                        <motion.button
                            onClick={onAccept}
                            className="w-full py-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-base shadow-lg shadow-indigo-500/30"
                            whileTap={{ scale: 0.97 }}
                        >
                            Enable — let's begin ✨
                        </motion.button>
                        <motion.button
                            onClick={onDecline}
                            className="w-full py-3 rounded-full glass text-slate-400 text-sm font-medium"
                            whileTap={{ scale: 0.97 }}
                        >
                            Continue without camera
                        </motion.button>
                    </div>

                    <p className="text-slate-600 text-xs mt-4">
                        You can turn off camera access anytime from the settings menu.
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
