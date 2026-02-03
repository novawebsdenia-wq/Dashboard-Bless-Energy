import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, useVideoConfig, Sequence } from 'remotion';
import { PhoneFrame } from '../components/PhoneFrame';
import { KineticText } from '../components/KineticText';

const images = [
    'screenshots/shot_01.png',
    'screenshots/shot_02.png',
    'screenshots/shot_03.png',
    'screenshots/shot_04.png',
    'screenshots/shot_05.png',
    'screenshots/shot_06.png',
    'screenshots/shot_07.png',
    'screenshots/shot_08.png',
    'screenshots/shot_09.png',
    'screenshots/shot_10.png',
];

export const AdFlow: React.FC = () => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();

    // Background gradient animation
    const bgPos = interpolate(frame, [0, 900], [0, 100]);

    return (
        <AbsoluteFill style={{
            background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
        }}>
            {/* Animated Mesh Grid Background */}
            <AbsoluteFill style={{
                opacity: 0.3,
                backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                backgroundSize: '100px 100px',
                transform: `translateY(${bgPos}px) perspective(500px) rotateX(20deg)`,
            }} />

            {/* Intro Sequence (0-3s) */}
            <Sequence from={0} durationInFrames={90}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <KineticText text="¿TU NEGOCIO?" delay={10} />
                </AbsoluteFill>
            </Sequence>

            <Sequence from={50} durationInFrames={70}>
                <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <KineticText text="EN TU BOLSILLO" subtitle="CONTROL TOTAL" delay={0} />
                </AbsoluteFill>
            </Sequence>

            {/* Carousel Sequence (3s - 25s) */}
            {/* We show images in the phone frame, changing every 60 frames (2s) approx */}
            <Sequence from={110} durationInFrames={700}>
                <PhoneCarousel />
            </Sequence>

            {/* Outro (23s - 30s) */}
            <Sequence from={810} durationInFrames={90}>
                <AbsoluteFill style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.8)'
                }}>
                    <Img
                        src={staticFile('logos/nova-webs-ia.jpg')}
                        style={{
                            width: 300,
                            borderRadius: 20,
                            marginBottom: 20
                        }}
                    />
                    <KineticText text="BLESS ENERGY" subtitle="POWERED BY NOVA WEBS" />
                </AbsoluteFill>
            </Sequence>

        </AbsoluteFill>
    );
};

const PhoneCarousel: React.FC = () => {
    const frame = useCurrentFrame();
    const index = Math.floor(frame / 60) % images.length;
    const nextIndex = (index + 1) % images.length;

    // Transition logic
    const progress = (frame % 60) / 60; // 0 to 1

    // Slide up effect
    const translateY = interpolate(progress, [0.8, 1], [0, -1200], { extrapolateRight: 'clamp' });
    const nextTranslateY = interpolate(progress, [0.8, 1], [1200, 0], { extrapolateRight: 'clamp' });

    // Scale pulse on change
    const scale = interpolate(progress, [0.8, 0.9, 1], [1, 0.95, 1]);

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            {/* 3D Phone Rotation effect */}
            <div style={{
                transform: `scale(${scale}) rotateY(${Math.sin(frame / 50) * 10}deg)`,
                transition: 'transform 0.1s'
            }}>
                <PhoneFrame>
                    {/* Current Image */}
                    <Img
                        src={staticFile(images[index])}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${translateY}px)`,
                        }}
                    />

                    {/* Next Image */}
                    <Img
                        src={staticFile(images[nextIndex])}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${nextTranslateY}px)`,
                        }}
                    />
                </PhoneFrame>
            </div>

            <div style={{
                position: 'absolute',
                bottom: 150,
                background: 'rgba(0,0,0,0.7)',
                padding: '10px 30px',
                borderRadius: 30,
                border: '1px solid #d4af37',
            }}>
                <h3 style={{
                    color: '#fff',
                    fontFamily: 'Inter',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: 2
                }}>
                    {index < 3 ? 'Web Pública' : index < 6 ? 'Dashboard' : 'Gestión'}
                </h3>
            </div>
        </AbsoluteFill>
    );
};
