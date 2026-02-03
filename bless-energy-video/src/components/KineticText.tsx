import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const KineticText: React.FC<{
    text: string;
    subtitle?: string;
    delay?: number;
    color?: string; // Allow override
    subColor?: string;
}> = ({
    text,
    subtitle,
    delay = 0,
    color = '#000000', // Black default for Light Mode
    subColor = '#d4af37' // Gold default
}) => {
        const frame = useCurrentFrame();

        const actualFrame = Math.max(0, frame - delay);

        // Scale / Zoom out effect (more elegant than zoom in)
        const scale = interpolate(actualFrame, [0, 30], [1.1, 1], {
            extrapolateRight: 'clamp',
        });

        // Opacity fade in
        const opacity = interpolate(actualFrame, [0, 15], [0, 1], {
            extrapolateRight: 'clamp',
        });

        const translateY = interpolate(actualFrame, [0, 15], [20, 0], {
            extrapolateRight: 'clamp',
        });

        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity,
            }}>
                <h1 style={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 700,
                    fontSize: 90,
                    color: color,
                    textTransform: 'uppercase',
                    letterSpacing: '-1px',
                    lineHeight: 1,
                    textAlign: 'center',
                    margin: 0,
                }}>
                    {text}
                </h1>
                {subtitle && (
                    <h2 style={{
                        fontFamily: '"Playfair Display", serif',
                        fontWeight: 400,
                        fontStyle: 'italic',
                        fontSize: 45,
                        color: subColor,
                        marginTop: 15,
                        letterSpacing: '1px',
                    }}>
                        {subtitle}
                    </h2>
                )}
            </div>
        );
    };
