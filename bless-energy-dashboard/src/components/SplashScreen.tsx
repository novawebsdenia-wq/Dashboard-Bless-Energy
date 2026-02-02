'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
    onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // Initial delay before starting fade out
        const timeout = setTimeout(() => {
            setIsFadingOut(true);
            // Wait for fade out animation to finish
            const exitTimeout = setTimeout(() => {
                setIsVisible(false);
                if (onComplete) onComplete();
            }, 800);
            return () => clearTimeout(exitTimeout);
        }, 2000);

        return () => clearTimeout(timeout);
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-700 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
        >
            <div className="relative flex flex-col items-center">
                {/* Animated Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold/20 blur-[100px] rounded-full animate-pulse" />

                {/* Logo Container */}
                <div className="relative mb-8 animate-in zoom-in-50 duration-1000 flex flex-col items-center">
                    <Image
                        src="/logo.png"
                        alt="Bless Energy"
                        width={240}
                        height={80}
                        className="object-contain"
                        priority
                    />
                    <h1 className="mt-4 text-2xl font-black tracking-[0.3em] uppercase gold-text-gradient">
                        Bless Energy
                    </h1>
                </div>

                {/* Loading Indicator */}
                <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent w-full animate-loading-bar" />
                </div>

                <p className="mt-4 text-gold/60 text-[10px] uppercase font-black tracking-[0.4em] animate-pulse">
                    Cargando Sistema Inteligente
                </p>
            </div>
        </div>
    );
}
