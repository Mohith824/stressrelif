/**
 * useCalmSound.js
 * Generative ambient soundscape using the Web Audio API.
 * No external assets needed — all audio is procedurally generated.
 */
import { useRef, useEffect, useCallback } from 'react';

export function useCalmSound() {
    const ctxRef = useRef(null);
    const nodesRef = useRef([]);
    const activeRef = useRef(false);

    const getCtx = () => {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctxRef.current;
    };

    const stopAll = useCallback(() => {
        nodesRef.current.forEach(n => {
            try { n.stop(); } catch (_) { }
        });
        nodesRef.current = [];
        activeRef.current = false;
    }, []);

    /** Create a sine oscillator with slow LFO tremolo */
    const makeTremoloOsc = (ctx, freq, gain, lfoFreq = 0.08) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        lfo.type = 'sine';
        lfo.frequency.value = lfoFreq;
        lfoGain.gain.value = gain * 0.4;
        gainNode.gain.value = gain;

        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        lfo.start();
        nodesRef.current.push(osc, lfo);
        return gainNode;
    };

    /** Pink-ish noise via many oscillators (simple) */
    const makeNoise = (ctx, volume = 0.015) => {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
        nodesRef.current.push(src);
        return gain;
    };

    /** Play soundscape based on state */
    const play = useCallback((stressState) => {
        stopAll();
        const ctx = getCtx();
        if (ctx.state === 'suspended') ctx.resume();
        activeRef.current = true;

        if (stressState === 'calm') {
            // Soft wind chime tones + pink noise breath
            makeTremoloOsc(ctx, 220, 0.04, 0.05);
            makeTremoloOsc(ctx, 330, 0.025, 0.07);
            makeTremoloOsc(ctx, 440, 0.015, 0.04);
            makeNoise(ctx, 0.012);
        } else if (stressState === 'mild') {
            // Nature ambience: deeper resonant tones, waves
            makeTremoloOsc(ctx, 174, 0.05, 0.06);
            makeTremoloOsc(ctx, 261.6, 0.035, 0.09);
            makeNoise(ctx, 0.02);
        } else if (stressState === 'moderate') {
            // Grounding rhythm — low binaural-like tone
            makeTremoloOsc(ctx, 110, 0.06, 0.1);
            makeTremoloOsc(ctx, 146.8, 0.04, 0.13);
            makeNoise(ctx, 0.018);
        } else {
            // High stress — slow deep bass drone to entrain to slower breathing
            makeTremoloOsc(ctx, 55, 0.08, 0.04);
            makeTremoloOsc(ctx, 82.4, 0.05, 0.05);
            makeNoise(ctx, 0.025);
        }
    }, [stopAll]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAll();
            if (ctxRef.current) ctxRef.current.close();
        };
    }, [stopAll]);

    return { play, stopAll };
}
