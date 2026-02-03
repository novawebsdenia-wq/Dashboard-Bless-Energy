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

const TelegramFacturaSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom in
  const scaleSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const scale = interpolate(scaleSpring, [0, 1], [1.15, 1]);

  // Scan line effect (gold line moving down)
  const scanProgress = interpolate(frame, [10, 50], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Label
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
          transform: `scale(${scale})`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: `0 20px 60px rgba(212,175,55,0.2)`,
          width: 940,
          height: 1400,
          position: 'relative',
        }}
      >
        <Img
          src={staticFile('screenshots/telegram/contabilidad.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Scan line */}
        <div
          style={{
            position: 'absolute',
            top: `${scanProgress}%`,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(to right, transparent, ${COLOR_GOLD}, transparent)`,
            boxShadow: `0 0 15px ${COLOR_GOLD}`,
          }}
        />
      </div>

      {/* Label */}
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
          Agente de Contabilidad
        </span>
      </div>
    </AbsoluteFill>
  );
};

const ContabilidadDashboardSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth entrance
  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const translateY = interpolate(entrance, [0, 1], [50, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

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
          opacity,
          transform: `translateY(${translateY}px)`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(212,175,55,0.15)',
          width: 940,
          height: 1500,
        }}
      >
        <Img
          src={staticFile('screenshots/04-telegram-contabilidad.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Data upload effect - gold lines flowing up */}
      <DataUploadLines />
    </AbsoluteFill>
  );
};

const DataUploadLines: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = [0, 1, 2, 3, 4];

  return (
    <>
      {lines.map((i) => {
        const delay = i * 8;
        const progress = interpolate(
          frame - delay,
          [0, 30],
          [100, -10],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const lineOpacity = interpolate(
          frame - delay,
          [0, 10, 25, 30],
          [0, 0.6, 0.6, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 200 + i * 150,
              top: `${progress}%`,
              width: 2,
              height: 40,
              background: `linear-gradient(to top, transparent, ${COLOR_GOLD})`,
              opacity: lineOpacity,
            }}
          />
        );
      })}
    </>
  );
};

export const ContabilidadScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BLACK }}>
      {/* Telegram factura: 2s = 60 frames */}
      <Sequence durationInFrames={60} premountFor={15}>
        <TelegramFacturaSlide />
      </Sequence>
      {/* Dashboard contabilidad: 2s = 60 frames */}
      <Sequence from={60} durationInFrames={60} premountFor={15}>
        <ContabilidadDashboardSlide />
      </Sequence>
    </AbsoluteFill>
  );
};
