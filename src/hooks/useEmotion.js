/**
 * useEmotion.js — HIGH ACCURACY VERSION
 *
 * Improvements:
 * 1. Uses SsdMobilenetv1 (more accurate face detector) + TinyFaceDetector fallback
 * 2. Loads faceLandmark68Net for eye-blink rate + brow position analysis
 * 3. Eye Aspect Ratio (EAR) detects drooping/rapid blinking (anxiety/sadness)
 * 4. Brow height ratio detects frown (anger) and raised brows (fear)
 * 5. Combines expression net + landmark analysis for composite score
 * 6. Hover DURATION tracking: continuous mouse movement > threshold raises stress
 * 7. Camera mode and simulation mode fully separated
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';

const MODELS_URL = '/models';

// Expression → base stress level
const EXPR_STRESS = {
    angry: 92, disgusted: 78, fearful: 85,
    sad: 68, surprised: 52, neutral: 14, happy: 4,
};

// Emoji per emotion
const EMOTION_EMOJI = {
    angry: '😠', disgusted: '🤢', fearful: '😰',
    sad: '😞', surprised: '😲', neutral: '😐', happy: '😊',
};

// ─── Landmark helpers ───────────────────────────────────────────────────────

/** Euclidean distance between two face-api points */
function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Eye Aspect Ratio (EAR) — Soukupová & Čech 2016
 * Low EAR = closed/drooping eyes (sadness).
 * Very rapid change in EAR = blink burst (anxiety).
 * Normal open eye EAR ≈ 0.25–0.40; below 0.20 = closed.
 */
function calcEAR(landmarks, isLeft) {
    const pts = landmarks.positions;
    // left eye: 36-41,  right eye: 42-47
    const offset = isLeft ? 36 : 42;
    const [p1, p2, p3, p4, p5, p6] = [pts[offset], pts[offset + 1], pts[offset + 2], pts[offset + 3], pts[offset + 4], pts[offset + 5]];
    return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
}

/**
 * Brow Droop / Raise Ratio
 * Compares left brow center to left eye center.
 * Negative = brow lowered below normal (frown/anger).
 * Positive large = brow raised (fear/surprise).
 */
function calcBrowRatio(landmarks) {
    const pts = landmarks.positions;
    // Left brow: 17-21, left eye: 36-41
    const browY = (pts[17].y + pts[18].y + pts[19].y + pts[20].y + pts[21].y) / 5;
    const eyeY = (pts[36].y + pts[37].y + pts[38].y + pts[39].y + pts[40].y + pts[41].y) / 6;
    const faceH = dist(pts[0], pts[16]);   // face width as normaliser
    return (eyeY - browY) / faceH;         // higher = brows more raised
}

/** Mouth openness ratio — jaw distance normalised by face height */
function calcMouthOpen(landmarks) {
    const pts = landmarks.positions;
    const mouthGap = dist(pts[62], pts[66]);      // inner lip top / bottom
    const faceH = dist(pts[8], pts[27]);        // chin to nose bridge
    return mouthGap / faceH;
}

/** Compute landmark stress modifier (-20 to +25) */
function landmarkModifier(landmarks, earHistory) {
    let mod = 0;

    const ear = (calcEAR(landmarks, true) + calcEAR(landmarks, false)) / 2;
    earHistory.push(ear);
    if (earHistory.length > 20) earHistory.shift();     // keep last 20 frames (~10s)

    // Drooping eyes = sadness indicator
    if (ear < 0.19) mod += 12;
    else if (ear < 0.23) mod += 6;

    // Blink rate: count rapid fluctuations in EAR
    let blinks = 0;
    for (let i = 1; i < earHistory.length; i++) {
        if (earHistory[i - 1] > 0.20 && earHistory[i] < 0.18) blinks++;
    }
    if (blinks >= 4) mod += 18;        // rapid blinking = anxiety
    else if (blinks >= 2) mod += 9;

    // Brow position
    const brow = calcBrowRatio(landmarks);
    if (brow < 0.18) mod += 15;        // furrowed brows = angry/tense
    else if (brow > 0.30) mod += 10;   // raised brows = fearful
    else mod -= 5;                      // neutral brow = slight calm bonus

    // Mouth open (screaming/gasping)
    const mouth = calcMouthOpen(landmarks);
    if (mouth > 0.20) mod += 8;

    return Math.max(-20, Math.min(25, mod));
}

/** Main emotion score from expression probabilities */
function scoreFromExpressions(expressions) {
    let total = 0, weight = 0;
    for (const [e, c] of Object.entries(expressions)) {
        total += (EXPR_STRESS[e] ?? 20) * c;
        weight += c;
    }
    return weight > 0 ? total / weight : 14;
}

function topEmotion(expressions) {
    return Object.entries(expressions).reduce(
        (max, [e, c]) => (c > max[1] ? [e, c] : max), ['neutral', 0]
    )[0];
}

function deriveState(score) {
    if (score >= 80) return 'high';
    if (score >= 50) return 'moderate';
    if (score >= 20) return 'mild';
    return 'calm';
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useEmotion(videoRef, cameraEnabled) {
    const [stressScore, setStressScore] = useState(14);
    const [stressState, setStressState] = useState('calm');
    const [emotion, setEmotion] = useState('neutral');
    const [emoji, setEmoji] = useState('😐');
    const [modelsLoaded, setModelsLoaded] = useState(false);

    const smoothedRef = useRef(14);
    const earHistory = useRef([]);
    const detectionRef = useRef(null);
    const simRef = useRef(null);

    // Simulation inputs
    const velocityRef = useRef(0);
    const clickBurstRef = useRef(0);
    // Hover duration: ms of continuous mouse movement
    const hoverStartRef = useRef(null);
    const hoverDurRef = useRef(0);
    const lastMoveRef = useRef(Date.now());

    // ── Public setters called from App.jsx ──
    const feedVelocity = useCallback((v) => {
        velocityRef.current = v;
        // Track continuous hover duration
        const now = Date.now();
        if (now - lastMoveRef.current < 800) {
            // Mouse still moving — accumulate hover duration
            if (!hoverStartRef.current) hoverStartRef.current = now;
            hoverDurRef.current = now - hoverStartRef.current;
        } else {
            // Idle reset
            hoverStartRef.current = null;
            hoverDurRef.current = 0;
        }
        lastMoveRef.current = now;
    }, []);

    const feedClick = useCallback(() => {
        clickBurstRef.current = Math.min(clickBurstRef.current + 18, 100);
    }, []);

    // ── Commit score with exponential smoothing ──
    const commit = useCallback((raw) => {
        // α = 0.22 — responsive but not jittery
        smoothedRef.current = smoothedRef.current * 0.78 + raw * 0.22;
        const final = Math.round(Math.min(100, Math.max(0, smoothedRef.current)));
        setStressScore(final);
        setStressState(deriveState(final));
        return final;
    }, []);

    // ── Load Models ──
    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                // Primary: SSD Mobilenet (most accurate, ~5MB)
                // Secondary: expressions + landmarks
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL).catch(() =>
                        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL)
                    ),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
                ]);
                if (!cancelled) { console.log('[CalmSpace] Models loaded ✓'); setModelsLoaded(true); }
            } catch (err) {
                console.warn('[CalmSpace] Model load error — simulation only', err);
                if (!cancelled) setModelsLoaded(true);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    // ── Camera Detection Loop ──
    useEffect(() => {
        if (!modelsLoaded || !cameraEnabled) {
            clearInterval(detectionRef.current);
            return;
        }

        // Detect every 400ms — fast enough to feel responsive
        detectionRef.current = setInterval(async () => {
            const video = videoRef?.current;
            if (!video || video.readyState < 2 || video.paused) return;

            try {
                // Try SSD first (more accurate), fallback to Tiny
                let det;
                try {
                    det = await faceapi
                        .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                        .withFaceLandmarks()
                        .withFaceExpressions();
                } catch {
                    det = await faceapi
                        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
                        .withFaceLandmarks()
                        .withFaceExpressions();
                }

                if (!det) return; // no face found this frame

                const { expressions } = det;
                const landmarks = det.landmarks;

                // Base score from expressions
                let rawScore = scoreFromExpressions(expressions);

                // Apply landmark-based modifier for higher accuracy
                if (landmarks) {
                    const mod = landmarkModifier(landmarks, earHistory.current);
                    rawScore = Math.max(0, Math.min(100, rawScore + mod));
                }

                commit(rawScore);

                const top = topEmotion(expressions);
                setEmotion(top);
                setEmoji(EMOTION_EMOJI[top] || '😐');

            } catch (err) {
                // Skip frame silently
            }
        }, 400);

        return () => clearInterval(detectionRef.current);
    }, [modelsLoaded, cameraEnabled, videoRef, commit]);

    // ── Simulation Mode (camera off) ──
    useEffect(() => {
        if (cameraEnabled) { clearInterval(simRef.current); return; }

        // Decay click burst
        const decayTimer = setInterval(() => {
            clickBurstRef.current = Math.max(0, clickBurstRef.current - 4);
        }, 250);

        simRef.current = setInterval(() => {
            const vel = velocityRef.current;
            const clicks = clickBurstRef.current;
            const hover = Math.min(hoverDurRef.current / 1000, 30); // seconds, capped at 30

            // Velocity contribution: fast mouse = stress
            const velScore = Math.min(80, vel / 5);
            // Click burst
            const clickScore = clicks;
            // Hover duration: >5 seconds of continuous movement adds stress
            const hoverScore = hover > 5 ? Math.min(50, (hover - 5) * 3) : 0;

            const combined = Math.max(velScore, clickScore, hoverScore);
            const target = combined > 3 ? combined : Math.max(0, smoothedRef.current - 1.2);
            commit(target);

            // Map score to simulated emotion
            const s = smoothedRef.current;
            let em = 'neutral', ej = '😐';
            if (s >= 80) { em = 'angry'; ej = '😠'; }
            else if (s >= 65) { em = 'fearful'; ej = '😰'; }
            else if (s >= 50) { em = 'surprised'; ej = '😲'; }
            else if (s >= 35) { em = 'sad'; ej = '😞'; }
            else if (s >= 18) { em = 'neutral'; ej = '😐'; }
            else { em = 'happy'; ej = '😊'; }
            setEmotion(em); setEmoji(ej);
        }, 120);

        return () => { clearInterval(simRef.current); clearInterval(decayTimer); };
    }, [cameraEnabled, commit]);

    return {
        stressScore, stressState,
        topEmotion: emotion, topEmoji: emoji,
        modelsLoaded, feedVelocity, feedClick,
    };
}
