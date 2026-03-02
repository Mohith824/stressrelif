/**
 * useEmotion.js
 * Loads face-api.js models and runs real-time emotion detection on a video element.
 * Returns a smoothed stressScore (0–100) and the derived stressState label.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

// Maps face-api emotion labels to a stress contribution value
const EMOTION_STRESS_MAP = {
    angry: 95,
    disgusted: 80,
    fearful: 88,
    sad: 70,
    surprised: 55,
    neutral: 15,
    happy: 5,
};

function scoreFromExpressions(expressions) {
    if (!expressions) return 15;
    let total = 0;
    let weight = 0;
    for (const [emotion, confidence] of Object.entries(expressions)) {
        const stressVal = EMOTION_STRESS_MAP[emotion] ?? 20;
        total += stressVal * confidence;
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

export function useEmotion(videoRef, enabled) {
    const [stressScore, setStressScore] = useState(15);
    const [stressState, setStressState] = useState('calm');
    const [topEmotion, setTopEmotion] = useState('neutral');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const smoothedRef = useRef(15);
    const intervalRef = useRef(null);

    // Load models once
    useEffect(() => {
        let cancelled = false;
        async function loadModels() {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
                ]);
                if (!cancelled) setModelsLoaded(true);
            } catch (err) {
                console.warn('Face-API models not found — running in simulation mode.', err);
                if (!cancelled) setModelsLoaded(true); // allow app to function
            }
        }
        loadModels();
        return () => { cancelled = true; };
    }, []);

    // Detection loop
    const detect = useCallback(async () => {
        const video = videoRef?.current;
        if (!video || video.readyState < 2 || !enabled) return;
        try {
            const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
                .withFaceExpressions();

            if (detection?.expressions) {
                const rawScore = scoreFromExpressions(detection.expressions);
                // Exponential smoothing α = 0.15 for slow drift
                smoothedRef.current = smoothedRef.current * 0.85 + rawScore * 0.15;
                const finalScore = Math.round(smoothedRef.current);

                setStressScore(finalScore);
                setStressState(deriveState(finalScore));

                // Top emotion
                const top = Object.entries(detection.expressions).reduce(
                    (max, [e, c]) => (c > max[1] ? [e, c] : max),
                    ['neutral', 0]
                );
                setTopEmotion(top[0]);
            }
        } catch (_) {
            // silently skip frames with no face
        }
    }, [videoRef, enabled]);

    useEffect(() => {
        if (!modelsLoaded || !enabled) return;
        intervalRef.current = setInterval(detect, 600); // ~1.6 FPS — lightweight
        return () => clearInterval(intervalRef.current);
    }, [modelsLoaded, enabled, detect]);

    // Simulation mode: gentle drift when camera is off
    useEffect(() => {
        if (!enabled) {
            const sim = setInterval(() => {
                const drift = (Math.random() - 0.5) * 4;
                smoothedRef.current = Math.min(100, Math.max(0, smoothedRef.current + drift));
                const s = Math.round(smoothedRef.current);
                setStressScore(s);
                setStressState(deriveState(s));
            }, 1200);
            return () => clearInterval(sim);
        }
    }, [enabled]);

    return { stressScore, stressState, topEmotion, modelsLoaded };
}
