/**
 * ParticleCanvas.jsx
 * Full-screen canvas particle system.
 * - stressScore drives turbulence (0=gentle flow, 100=chaotic scatter)
 * - touch/mouse pointer adds velocity impulse to nearby particles
 */
import React, { useRef, useEffect, useCallback } from 'react';

const NUM_PARTICLES = 140;
const MAX_SPEED = 3.5;

function lerp(a, b, t) { return a + (b - a) * t; }
function hsl(h, s, l) { return `hsl(${h},${s}%,${l}%)`; }

export default function ParticleCanvas({ stressScore = 15, pointerPos = null }) {
    const canvasRef = useRef(null);
    const stateRef = useRef({ particles: [], animId: null, pointer: null });
    const scoreRef = useRef(stressScore);

    useEffect(() => { scoreRef.current = stressScore; }, [stressScore]);
    useEffect(() => { stateRef.current.pointer = pointerPos; }, [pointerPos]);

    const buildParticles = useCallback((w, h) => {
        return Array.from({ length: NUM_PARTICLES }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: 1.5 + Math.random() * 2.5,
            baseX: Math.random() * w,
            baseY: Math.random() * h,
            phase: Math.random() * Math.PI * 2,
        }));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stateRef.current.particles = buildParticles(canvas.width, canvas.height);
        };

        resize();
        window.addEventListener('resize', resize);

        let t = 0;

        const loop = () => {
            const { width: W, height: H } = canvas;
            const score = scoreRef.current;
            const turbulence = score / 100;
            const pointer = stateRef.current.pointer;

            // Determine color palette from score
            // calm=240° blue, mild=160° teal, moderate=200° cyan, high=270° indigo
            const hue = lerp(240, 270, turbulence);
            const sat = lerp(60, 90, turbulence);
            const lightness = lerp(60, 45, turbulence);

            ctx.clearRect(0, 0, W, H);

            for (const p of stateRef.current.particles) {
                // Pointer repulsion impulse
                if (pointer) {
                    const dx = p.x - pointer.x;
                    const dy = p.y - pointer.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 130) {
                        const force = ((130 - dist) / 130) * turbulence * 2.5;
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                    }
                }

                // Turbulence noise (simplified Perlin-like)
                const nx = Math.sin(p.x * 0.005 + t * 0.3) * turbulence * 1.2;
                const ny = Math.cos(p.y * 0.005 + t * 0.25) * turbulence * 1.2;
                p.vx += nx * 0.05;
                p.vy += ny * 0.05;

                // Gentle return to base position when calm
                if (score < 30) {
                    const bx = p.baseX + Math.sin(t * 0.4 + p.phase) * 30;
                    const by = p.baseY + Math.cos(t * 0.35 + p.phase) * 20;
                    p.vx += (bx - p.x) * 0.002;
                    p.vy += (by - p.y) * 0.002;
                }

                // Damping
                p.vx *= lerp(0.97, 0.88, turbulence);
                p.vy *= lerp(0.97, 0.88, turbulence);

                // Clamp speed
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed > MAX_SPEED * (0.3 + turbulence * 0.7)) {
                    const r = (MAX_SPEED * (0.3 + turbulence * 0.7)) / speed;
                    p.vx *= r; p.vy *= r;
                }

                p.x += p.vx;
                p.y += p.vy;

                // Wrap
                if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

                // Draw
                const alpha = lerp(0.25, 0.65, turbulence);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = hsl(hue, sat, lightness);
                ctx.globalAlpha = alpha;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            t += 0.016;
            stateRef.current.animId = requestAnimationFrame(loop);
        };

        loop();
        return () => {
            cancelAnimationFrame(stateRef.current.animId);
            window.removeEventListener('resize', resize);
        };
    }, [buildParticles]);

    return (
        <canvas
            ref={canvasRef}
            id="particle-canvas"
            aria-hidden="true"
        />
    );
}
