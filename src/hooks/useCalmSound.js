/**
 * useCalmSound.js — IMPROVED
 * Richer generative soundscapes using Web Audio API.
 * Includes binaural-like tones to encourage calm brainwave states.
 */
import { useRef, useEffect, useCallback } from 'react';

export function useCalmSound() {
    const ctxRef = useRef(null);
    const masterGainRef = useRef(null);
    const nodesRef = useRef([]);
    const activeRef = useRef(false);
    const currentStateRef = useRef(null);

    const getCtx = () => {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            masterGainRef.current = ctxRef.current.createGain();
            masterGainRef.current.gain.value = 0.0;
            masterGainRef.current.connect(ctxRef.current.destination);
        }
        return ctxRef.current;
    };

    const stopAll = useCallback((fade = true) => {
        if (!ctxRef.current || !masterGainRef.current) return;
        if (fade) {
            masterGainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 1.5);
            setTimeout(() => {
                nodesRef.current.forEach(n => { try { n.stop(); } catch (_) { } });
                nodesRef.current = [];
                activeRef.current = false;
            }, 1600);
        } else {
            nodesRef.current.forEach(n => { try { n.stop(); } catch (_) { } });
            nodesRef.current = [];
            activeRef.current = false;
        }
        currentStateRef.current = null;
    }, []);

    /** Sine oscillator with slow tremolo LFO */
    const makeOsc = (ctx, dest, freq, gain, lfoFreq = 0.06, type = 'sine') => {
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;
        lfo.type = 'sine';
        lfo.frequency.value = lfoFreq;
        lfoGain.gain.value = gain * 0.3;
        gainNode.gain.value = gain;

        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        osc.connect(gainNode);
        gainNode.connect(dest);

        osc.start(); lfo.start();
        nodesRef.current.push(osc, lfo);
        return gainNode;
    };

    /** Pink noise for ocean/wind texture */
    const makePinkNoise = (ctx, dest, volume) => {
        const bufSize = ctx.sampleRate * 4;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufSize; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
            b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
            b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
            d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const g = ctx.createGain(); g.gain.value = volume;
        // Low pass filter for "ocean" character
        const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 800;
        src.connect(lpf); lpf.connect(g); g.connect(dest);
        src.start();
        nodesRef.current.push(src);
        return g;
    };

    /** Slow chord (stacked sine harmonics = pad sound) */
    const makePad = (ctx, dest, rootFreq, gainVal) => {
        const harmonics = [1, 1.5, 2, 2.67, 3];
        harmonics.forEach(h => makeOsc(ctx, dest, rootFreq * h, gainVal / harmonics.length, 0.05 + Math.random() * 0.04));
    };

    const play = useCallback((stressState) => {
        if (stressState === currentStateRef.current) return; // no re-trigger if same state
        currentStateRef.current = stressState;

        const prev = nodesRef.current.slice();
        const ctx = getCtx();
        const dest = masterGainRef.current;

        if (ctx.state === 'suspended') ctx.resume();

        // Fade out old sounds
        if (prev.length > 0) {
            masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
            setTimeout(() => { prev.forEach(n => { try { n.stop(); } catch (_) { } }); }, 900);
            nodesRef.current = [];
        }

        // Small delay before new sounds start (crossfade gap)
        setTimeout(() => {
            if (currentStateRef.current !== stressState) return; // state changed again
            activeRef.current = true;

            if (stressState === 'calm') {
                // 🌸 Crystal wind chimes + gentle ocean breath
                // Tuned to 432Hz for natural resonance feel
                makePad(ctx, dest, 108, 0.018);       // low warm pad
                makeOsc(ctx, dest, 432, 0.012, 0.04); // root tone
                makeOsc(ctx, dest, 540, 0.008, 0.06); // 5th
                makeOsc(ctx, dest, 648, 0.005, 0.07); // octave
                makePinkNoise(ctx, dest, 0.008);       // soft breath

            } else if (stressState === 'mild') {
                // 🌊 Warm nature ambience — grounding tones
                makePad(ctx, dest, 174.6, 0.022);     // F3 — solfeggio "Ut" healing freq
                makeOsc(ctx, dest, 261.6, 0.015, 0.08); // C4 middle
                makeOsc(ctx, dest, 349.2, 0.01, 0.1);  // F4
                makePinkNoise(ctx, dest, 0.014);

            } else if (stressState === 'moderate') {
                // 🌬️ Grounding rhythm — theta wave range (6Hz LFO) to entrain brain
                makePad(ctx, dest, 136.1, 0.025);     // OM tone (spiritual grounding)
                makeOsc(ctx, dest, 136.1, 0.018, 0.08, 'triangle');
                makeOsc(ctx, dest, 204.15, 0.012, 0.1, 'sine'); // 3/2 harmony
                makePinkNoise(ctx, dest, 0.018);

            } else {
                // ⚡ High stress — SLOW deep bass drone + alpha wave entrainment
                // Deep drone guides breathing to slow down involuntarily
                makePad(ctx, dest, 55, 0.03);         // very deep bass A1
                makeOsc(ctx, dest, 82.4, 0.02, 0.04, 'triangle'); // E2
                makeOsc(ctx, dest, 110, 0.015, 0.05, 'sine');     // A2
                makePinkNoise(ctx, dest, 0.022);
            }

            // Fade in
            masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
            masterGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
            masterGainRef.current.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.5);
        }, prev.length > 0 ? 400 : 0);

    }, []);

    useEffect(() => {
        return () => {
            stopAll(false);
            if (ctxRef.current) { try { ctxRef.current.close(); } catch (_) { } }
        };
    }, [stopAll]);

    return { play, stopAll };
}
