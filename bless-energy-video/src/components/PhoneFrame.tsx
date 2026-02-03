import React from 'react';

export const PhoneFrame: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
}> = ({ children, style }) => {
    return (
        <div
            style={{
                width: 600,
                height: 1200,
                borderRadius: 50,
                backgroundColor: '#fff', // White body
                border: '4px solid #f0f0f0', // Very subtle border
                padding: 0, // Edge to edge screen
                // Elegant shadow for white background
                boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.2), 0 30px 60px -30px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                ...style,
            }}
        >
            {/* Dynamic Island / Notch Area */}
            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 120,
                    height: 35,
                    backgroundColor: '#000',
                    borderRadius: 20,
                    zIndex: 20,
                }}
            />

            {/* Screen Content */}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 48,
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    position: 'relative',
                }}
            >
                {children}
            </div>

            {/* Reflection Shine */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%)',
                    pointerEvents: 'none',
                    zIndex: 10
                }}
            />
        </div>
    );
};
