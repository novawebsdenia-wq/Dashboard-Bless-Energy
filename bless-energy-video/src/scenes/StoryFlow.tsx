import React, { useMemo } from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, useVideoConfig, Sequence } from 'remotion';
import { PhoneFrame } from '../components/PhoneFrame';
import { KineticText } from '../components/KineticText';
import { Particles } from '../components/Particles';

// Assets mapping
// Assets mapping
const ASSETS = {
    logoHighlights: 'logos/bless-energy.png',
    logoNova: 'logos/nova-webs-ia.jpg',

    // Web assets (using existing shots, assuming 02 and 03 are calculator/form based on previous context)
    webHome: 'screenshots/shot_01.png',
    webCalc: 'screenshots/shot_02.png',
    webForm: 'screenshots/shot_03.png',
    webProj: 'screenshots/shot_04.png',
    webAbout: 'screenshots/shot_05.png',
    webServ: 'screenshots/shot_06.png',

    // New DASHBOARD Assets (Corrected)
    dashboard: 'screenshots/dash_main.png',
    leads: 'screenshots/dash_leads.png',
    status: 'screenshots/dash_main.png', // Main overview shows status/counters
    accounting: 'screenshots/dash_accounting.png',
};

export const StoryFlow: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#ffffff' }}> {/* White Global BG */}
            {/* 0. AMBIENCE (Global) */}
            <Particles />

            {/* 1. INTRO (0-4s / 0-120f) - Bless Energy Logo + Website */}
            <Sequence from={0} durationInFrames={120}>
                <IntroSection />
            </Sequence>

            {/* 2. WEB SHOWCASE (4-16s / 120-480f) - Extended to 12s for 6 slides (60f/2s each) */}
            <Sequence from={120} durationInFrames={360}>
                <WebShowcaseCarousel />
            </Sequence>

            {/* 3. SOLUTION REVEAL (16-20s / 480-600f) - Dashboard Intro */}
            <Sequence from={480} durationInFrames={120}>
                <DashboardReveal />
            </Sequence>

            {/* 4. FEATURES (20-32s / 600-960f) - The details */}
            <Sequence from={600} durationInFrames={360}>
                <FeaturesSection />
            </Sequence>

            {/* 5. OUTRO (32-39s / 960-1170f) - Nova Webs */}
            <Sequence from={960} durationInFrames={210}>
                <OutroSection />
            </Sequence>

        </AbsoluteFill>
    );
};

// --- SUB-COMPONENTS ---

const IntroSection = () => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 20], [0, 1]);
    const scale = interpolate(frame, [0, 120], [0.95, 1]);

    return (
        <AbsoluteFill style={{
            justifyContent: 'center',
            alignItems: 'center',
            // Transparent to let particles show through
        }}>
            <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center' }}>
                {/* Logo with slight shadow for depth */}
                <Img
                    src={staticFile('logos/bless-energy.png')}
                    style={{
                        width: 300,
                        height: 300,
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))'
                    }}
                />
                <div style={{ marginTop: 50 }}>
                    <KineticText text="BLESS ENERGY" color="#000000" />
                    <h3 className="shimmer-text" style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: 40,
                        marginTop: 20,
                        letterSpacing: 2,
                        fontWeight: 400
                    }}>
                        blessenergy.es
                    </h3>
                </div>
            </div>
        </AbsoluteFill>
    );
};

const WebShowcaseCarousel = () => {
    // 360 frames total (12 seconds)
    // 6 items, 60 frames each (2 seconds per slide)

    return (
        <AbsoluteFill>
            {/* Shared Title */}
            <div style={{ position: 'absolute', top: 150, width: '100%', textAlign: 'center', zIndex: 10 }}>
                <KineticText text="PRESENCIA DIGITAL" subtitle="WEB CORPORATIVA" color="#000000" subColor="#d4af37" />
            </div>

            {/* 1. Inicio */}
            <Sequence from={0} durationInFrames={60}>
                <WebItem imgSrc={ASSETS.webHome} />
            </Sequence>
            {/* 2. Servicios */}
            <Sequence from={60} durationInFrames={60}>
                <WebItem imgSrc={ASSETS.webServ} />
            </Sequence>
            {/* 3. Proyectos */}
            <Sequence from={120} durationInFrames={60}>
                <WebItem imgSrc={ASSETS.webProj} />
            </Sequence>
            {/* 4. Nosotros */}
            <Sequence from={180} durationInFrames={60}>
                <WebItem imgSrc={ASSETS.webAbout} />
            </Sequence>
            {/* 5. Formulario */}
            <Sequence from={240} durationInFrames={60}>
                <WebItem imgSrc={ASSETS.webForm} />
            </Sequence>
            {/* 6. Calculadora */}
            <Sequence from={300} durationInFrames={60}>
                <WebItem imgSrc={ASSETS.webCalc} />
            </Sequence>
        </AbsoluteFill>
    );
};

const WebItem: React.FC<{ imgSrc: string }> = ({ imgSrc }) => {
    const frame = useCurrentFrame();
    // Adjusted timeline for 60 frames per slide
    const opacity = interpolate(frame, [0, 10, 50, 60], [0, 1, 1, 0]);
    // Added 3D rotation nuance
    const rotateY = interpolate(frame, [0, 60], [2, -2]);
    const translateY = interpolate(frame, [0, 60], [0, -15]); // Slow scroll effect

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity, perspective: 1000 }}>
            <div style={{ transform: `scale(0.9) translateY(${translateY}px) rotateY(${rotateY}deg)`, marginTop: 250 }}>
                <PhoneFrame>
                    <Img src={staticFile(imgSrc)} style={{ width: '100%' }} />
                </PhoneFrame>
            </div>
        </AbsoluteFill>
    )
}


const DashboardReveal = () => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 20], [0, 1]);
    const scale = interpolate(frame, [0, 40], [1.2, 1], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{
            justifyContent: 'center',
            alignItems: 'center',
            // Transparent to let particles show through
        }}>
            <div style={{ opacity, transform: `scale(${scale})` }}>
                {/* Updated copy to be more professional/clean */}
                <KineticText text="GESTIÓN INTEGRAL" subtitle="PANEL DE CONTROL" color="#000000" subColor="#d4af37" />
            </div>
        </AbsoluteFill>
    );
};

const FeaturesSection = () => {
    // 1. Leads
    // 2. States (Using Main Dashboard image for overview)
    // 3. Accounting
    return (
        <AbsoluteFill>
            <Sequence from={0} durationInFrames={120}>
                <FeatureItem
                    imgSrc={ASSETS.leads}
                    title="CENTRALIZACIÓN"
                    subtitle="Gestión de Leads"
                />
            </Sequence>
            <Sequence from={120} durationInFrames={120}>
                <FeatureItem
                    imgSrc={ASSETS.status}
                    title="CONTROL TOTAL"
                    subtitle="Estados de Cliente"
                />
            </Sequence>
            <Sequence from={240} durationInFrames={120}>
                <FeatureItem
                    imgSrc={ASSETS.accounting}
                    title="FINANZAS"
                    subtitle="Balance en Tiempo Real"
                />
            </Sequence>
        </AbsoluteFill>
    );
};

const FeatureItem: React.FC<{ imgSrc: string, title: string, subtitle: string }> = ({
    imgSrc, title, subtitle
}) => {
    const frame = useCurrentFrame();
    const slideUp = interpolate(frame, [0, 25], [1000, 0], { extrapolateRight: 'clamp' });
    // Dynamic shadow breathing
    const shadowSpread = interpolate(frame, [0, 60, 120], [30, 60, 30]);

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>

            {/* Background Text Title - Adjusted to prevent clipping */}
            <div style={{
                position: 'absolute',
                top: 150,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                zIndex: 0
            }}>
                <h1 style={{
                    color: '#e0e0e0', // Darker gray for better visibility
                    fontSize: 90, // Reduced from 140 to fit screen width
                    margin: 0,
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                }}>
                    {title}
                </h1>
            </div>

            <div style={{
                position: 'relative', // Context for absolute positioning inside
                transform: `translateY(${slideUp}px) scale(0.9)`, // Moves entire group
                zIndex: 1,
                marginTop: 100,
                filter: `drop-shadow(0 30px ${shadowSpread}px rgba(0,0,0,0.15))`
            }}>
                <PhoneFrame>
                    <Img src={staticFile(imgSrc)} style={{ width: '100%' }} />
                </PhoneFrame>

                {/* Foreground Text Overlay - Positioned relative to PhoneFrame */}
                <div style={{
                    position: 'absolute',
                    bottom: 60, // Distance from bottom of phone
                    left: '50%',
                    transform: 'translateX(-50%)', // Center horizontally
                    zIndex: 2,
                    width: '90%' // Ensure it fits within phone width
                }}>
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.90)',
                        backdropFilter: 'blur(10px)',
                        padding: '15px 30px',
                        borderRadius: 20,
                        border: '1px solid #d4af37',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                        textAlign: 'center'
                    }}>
                        <h1 style={{
                            color: '#000',
                            fontSize: 45, // Slightly smaller to fit phone width perfectly
                            margin: 0,
                            fontFamily: '"Playfair Display", serif',
                            fontWeight: 700
                        }}>
                            {title}
                        </h1>
                        <h2 className="shimmer-text" style={{
                            fontSize: 26,
                            margin: '5px 0 0 0',
                            fontFamily: '"Playfair Display", serif',
                            fontStyle: 'italic',
                            fontWeight: 400
                        }}>
                            {subtitle}
                        </h2>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};

const OutroSection = () => {
    return (
        <AbsoluteFill style={{
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ffffff'
        }}>
            {/* Center Content Group */}
            <div style={{ transform: 'translateY(-60px)', textAlign: 'center' }}>
                <Img
                    src={staticFile(ASSETS.logoNova)}
                    style={{ width: 400, borderRadius: 20, marginBottom: 30, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}
                />
                <h3 style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: 50,
                    color: '#000000',
                    letterSpacing: 2,
                    fontWeight: 800,
                    margin: 0
                }}>
                    NOVAWEBS.EU
                </h3>
            </div>

            {/* Social Media Block - Single Row at Bottom */}
            <div style={{
                position: 'absolute',
                bottom: 80,
                width: '100%',
                display: 'flex',
                gap: 50,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <SocialItem type="instagram" handle="@novawebsia" />
                <SocialItem type="facebook" handle="NovaWebs.ia" />
                <SocialItem type="whatsapp" handle="+34 641 743 675" />
                <SocialItem type="youtube" handle="@NOVAWEBSIA" />
            </div>
        </AbsoluteFill>
    );
};

const SocialItem: React.FC<{ type: 'instagram' | 'facebook' | 'whatsapp' | 'youtube', handle: string }> = ({ type, handle }) => {

    // SVGs for official logos
    const getIcon = () => {
        switch (type) {
            case 'facebook':
                return (
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                );
            case 'instagram':
                return (
                    <svg width="60" height="60" viewBox="0 0 24 24">
                        <defs>
                            <radialGradient id="rg" r="150%" cx="30%" cy="107%">
                                <stop stopColor="#fdf497" offset="0" />
                                <stop stopColor="#fdf497" offset="0.05" />
                                <stop stopColor="#fd5949" offset="0.45" />
                                <stop stopColor="#d6249f" offset="0.6" />
                                <stop stopColor="#285AEB" offset="0.9" />
                            </radialGradient>
                        </defs>
                        <path fill="url(#rg)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                );
            case 'whatsapp':
                return (
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                );
            case 'youtube':
                return (
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="#FF0000">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                );
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            {getIcon()}
            <span style={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                color: '#333',
                fontSize: 16 // Smaller font for handles under icons
            }}>{handle}</span>
        </div>
    );
};
