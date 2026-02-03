import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLOR_BLACK, COLOR_GOLD, COLOR_WHITE } from '../constants';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

const TelegramAlertSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom in effect
  const scale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const zoomScale = interpolate(scale, [0, 1], [1.2, 1]);

  // Notification badge pulse
  const pulse = interpolate(
    frame % 20,
    [0, 10, 20],
    [1, 1.3, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Label fade in
  const labelOpacity = interpolate(frame, [15, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BLACK,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${zoomScale})`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: `0 20px 60px rgba(212,175,55,0.2)`,
          width: 940,
          height: 1400,
        }}
      >
        <Img
          src={staticFile('screenshots/telegram/alertas.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Gold notification badge */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          right: 120,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: COLOR_GOLD,
          transform: `scale(${pulse})`,
          boxShadow: `0 0 20px ${COLOR_GOLD}`,
        }}
      />

      {/* Label overlay */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: labelOpacity,
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: 38,
            fontWeight: 700,
            color: COLOR_GOLD,
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          Agente de Inbox
        </span>
      </div>
    </AbsoluteFill>
  );
};

const InboxDashboardSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wipe from left
  const wipeProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const clipX = interpolate(wipeProgress, [0, 1], [100, 0]);

  // Highlight glow on categories
  const glowOpacity = interpolate(frame, [30, 45], [0, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BLACK,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          clipPath: `inset(0 ${clipX}% 0 0)`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(212,175,55,0.15)',
          width: 940,
          height: 1500,
        }}
      >
        <Img
          src={staticFile('screenshots/03-inbox-categorizado.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Gold highlight overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at center, rgba(212,175,55,${glowOpacity * 0.1}) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export const InboxAgentScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BLACK }}>
      {/* Telegram alertas: 2s = 60 frames */}
      <Sequence durationInFrames={60} premountFor={15}>
        <TelegramAlertSlide />
      </Sequence>
      {/* Dashboard emails: 3s = 90 frames */}
      <Sequence from={60} durationInFrames={90} premountFor={15}>
        <InboxDashboardSlide />
      </Sequence>
    </AbsoluteFill>
  );
};
