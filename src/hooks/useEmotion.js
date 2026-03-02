/**
 * useEmotion.js — FIXED
 *
 * Two modes:
 * 1. CAMERA mode: uses face-api.js for real expression detection
 * 2. SIMULATION mode: pointer velocity + click rate drives the score
 *    (fast/frantic movement = high stress, stillness = calm)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

const EMOTION_STRESS_MAP = {
    angry: 95,
    disgusted: 80,
    fearful: 88,
    sad: 70,
    surprised: 55,
    neutral: 15,
    happy: 5,
};

const EMOTION_EMOJI = {
    angry: '😠',
    disgusted: '🤢',
    fearful: '😰',
    sad: '😞',
    surprised: '😲',
    neutral: '😐',
    happy: '😊',
};

function scoreFromExpressions(expressions) {
    if (!expressions) return 15;
    let total = 0, weight = 0;
    for (const [emotion, confidence] of Object.entries(expressions)) {
        total += (EMOTION_STRESS_MAP[emotion] ?? 20) * confidence;
        weight += confidence;
    }
    return weight > 0 ? Math.round(total / weight) : 15;
}

function deriveState(score) {
    if (score >= 80) return 'high';
    if (score >= 50) return 'moderate';
    if (score >= 20) return 'mild';
    return 'calm';
}

const MODELS_URL = '/models';

export function useEmotion(videoRef, cameraEnabled) {
    const [stressScore, setStressScore] = useState(15);
    const [stressState, setStressState] = useState('calm');
    const [topEmotion, setTopEmotion] = useState('neutral');
    const [topEmoji, setTopEmoji] = useState('😐');
    const [modelsLoaded, setModelsLoaded] = useState(false);

    const smoothedRef = useRef(15);
    const detectionInterval = useRef(null);
    const simInterval = useRef(null);

    // Shared velocity state (updated from App.jsx via ref)
    const velocityRef = useRef(0);    // pointer speed
    const clickBurstRef = useRef(0);  // recent click count

    // Expose refs so App can feed them
    const feedVelocity = useCallback((v) => { velocityRef.current = v; }, []);
    const feedClick = useCallback(() => { clickBurstRef.current = Math.min(clickBurstRef.current + 15, 100); }, []);

    // Load models
    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
                ]);
                if (!cancelled) { console.log('[face-api] models loaded ✓'); setModelsLoaded(true); }
            } catch (err) {
                console.warn('[face-api] model load failed, using simulation', err);
                if (!cancelled) setModelsLoaded(true);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    // Helper: commit a raw score with smoothing
    const commitScore = useCallback((rawScore) => {
        smoothedRef.current = smoothedRef.current * 0.82 + rawScore * 0.18;
        const final = Math.round(Math.min(100, Math.max(0, smoothedRef.current)));
        setStressScore(final);
        setStressState(deriveState(final));
    }, []);

    // ── CAMERA Detection Loop ──
    useEffect(() => {
        if (!modelsLoaded || !cameraEnabled) {
            clearInterval(detectionInterval.current);
            return;
        }
        detectionInterval.current = setInterval(async () => {
            const video = videoRef?.current;
            if (!video || video.readyState < 2) return;
            try {
                const det = await faceapi
                    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.35 }))
                    .withFaceExpressions();

                if (det?.expressions) {
                    commitScore(scoreFromExpressions(det.expressions));
                    const [top] = Object.entries(det.expressions).sort((a, b) => b[1] - a[1]);
                    if (top) {
                        setTopEmotion(top[0]);
                        setTopEmoji(EMOTION_EMOJI[top[0]] || '😐');
                    }
                }
            } catch (_) { }
        }, 500);   // detect every 500ms — responsive but lightweight
        return () => clearInterval(detectionInterval.current);
    }, [modelsLoaded, cameraEnabled, videoRef, commitScore]);

    // ── SIMULATION Mode (no camera or as supplement) ──
    useEffect(() => {
        if (cameraEnabled) {
            clearInterval(simInterval.current);
            return;
        }

        // Decay click burst over time
        const decayTick = setInterval(() => {
            clickBurstRef.current = Math.max(0, clickBurstRef.current - 3);
        }, 200);

        simInterval.current = setInterval(() => {
            const vel = velocityRef.current;     // 0–800 typical
            const clicks = clickBurstRef.current; // 0–100

            // Map to stress contribution
            const velScore = Math.min(100, vel / 5);        // fast mouse = stressed
            const clickScore = clicks;                        // rapid clicking = anxious
            const combined = Math.max(velScore, clickScore);

            // Slowly decay when idle
            const targetScore = combined > 5 ? combined : Math.max(0, smoothedRef.current - 0.8);
            commitScore(targetScore);

            // Infer simulated emotion from score
            const s = smoothedRef.current;
            let emotion = 'neutral', emoji = '😐';
            if (s >= 80) { emotion = 'angry'; emoji = '😠'; }
            else if (s >= 65) { emotion = 'fearful'; emoji = '😰'; }
            else if (s >= 50) { emotion = 'surprised'; emoji = '😲'; }
            else if (s >= 35) { emotion = 'sad'; emoji = '😞'; }
            else if (s >= 20) { emotion = 'neutral'; emoji = '😐'; }
            else { emotion = 'happy'; emoji = '😊'; }

            setTopEmotion(emotion);
            setTopEmoji(emoji);
        }, 150);   // 6+ Hz — smooth updates

        return () => {
            clearInterval(simInterval.current);
            clearInterval(decayTick);
        };
    }, [cameraEnabled, commitScore]);

    return { stressScore, stressState, topEmotion, topEmoji, modelsLoaded, feedVelocity, feedClick };
}
