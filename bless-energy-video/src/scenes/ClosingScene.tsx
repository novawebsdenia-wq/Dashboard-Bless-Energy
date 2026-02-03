import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLOR_BLACK, COLOR_GOLD, COLOR_WHITE } from '../constants';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '700'],
  subsets: ['latin'],
});

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo fade in + scale
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.85, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  // Text fade in (delayed)
  const textOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textY = interpolate(frame, [15, 30], [15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle gold glow pulse
  const glowPulse = interpolate(
    frame % 40,
    [0, 20, 40],
    [0.3, 0.6, 0.3],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BLACK,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Subtle gold radial glow */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(212,175,55,${glowPulse * 0.15}) 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: `0 10px 40px rgba(212,175,55,0.2)`,
          }}
        >
          <Img
            src={staticFile('logos/nova-webs-ia.jpg')}
            style={{
              width: 220,
              height: 220,
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Brand name */}
        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily,
              fontSize: 48,
              fontWeight: 700,
              color: COLOR_WHITE,
              letterSpacing: 2,
            }}
          >
            Nova webs IA
          </span>
          <span
            style={{
              fontFamily,
              fontSize: 28,
              fontWeight: 400,
              color: COLOR_GOLD,
              letterSpacing: 1,
            }}
          >
            novawebs.ia
          </span>
        </div>
      </div>

      {/* Bottom gold line */}
      <div
        style={{
          position: 'absolute',
          bottom: 180,
          width: interpolate(frame, [20, 50], [0, 300], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          height: 1,
          background: `linear-gradient(to right, transparent, ${COLOR_GOLD}, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};
