import React, { useMemo } from 'react';
import { random, useCurrentFrame, useVideoConfig } from 'remotion';

export const Particles: React.FC = () => {
    const { width, height, durationInFrames } = useVideoConfig();
    const frame = useCurrentFrame();

    const particles = useMemo(() => {
        return new Array(20).fill(0).map((_, i) => {
            const x = random(`x-${i}`) * width;
            const y = random(`y-${i}`) * height;
            const size = random(`size-${i}`) * 3 + 1; // 1 to 4px
            const speed = random(`speed-${i}`) * 0.5 + 0.2;
            return { x, y, size, speed };
        });
    }, [width, height]);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
            {particles.map((p, i) => {
                const yPos = (p.y - frame * p.speed) % height;
                const actualY = yPos < 0 ? yPos + height : yPos;
                const opacity = Math.abs(Math.sin((frame + i * 10) / 60)) * 0.5; // Blink effect

                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: p.x,
                            top: actualY,
                            width: p.size,
                            height: p.size,
                            borderRadius: '50%',
                            backgroundColor: '#d4af37', // Gold
                            opacity: opacity,
                            boxShadow: `0 0 ${p.size * 2}px #d4af37`,
                        }}
                    />
                );
            })}
        </div>
    );
};
