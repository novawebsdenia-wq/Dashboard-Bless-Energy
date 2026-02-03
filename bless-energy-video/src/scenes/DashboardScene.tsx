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

const DASHBOARD_IMAGES = [
  'screenshots/05-dashboard-completo.png',
  'screenshots/07-dashboard-calculadora.png',
  'screenshots/06-dashboard-formulario.png',
  'screenshots/08-dashboard-clientes.png',
];

const BULLET_TEXTS = [
  '4 agentes IA',
  '1 dashboard unificado',
  'Control total',
];

// 5s = 150 frames. ~37 frames per dashboard image
const FRAMES_PER_DASH = 37;

const DashboardSlide: React.FC<{ file: string }> = ({ file }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  // Slow horizontal pan
  const panX = interpolate(frame, [0, FRAMES_PER_DASH], [0, -30], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BLACK,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          transform: `translateX(${panX}px)`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(212,175,55,0.12)',
          width: 980,
          height: 1500,
        }}
      >
        <Img
          src={staticFile(file)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const BulletOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background blur overlay
  const overlayOpacity = interpolate(frame, [0, 15], [0, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Dark overlay for text readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `rgba(0,0,0,${overlayOpacity * 0.7})`,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
          zIndex: 1,
        }}
      >
        {BULLET_TEXTS.map((text, i) => {
          const delay = i * 20;
          const bulletSpring = spring({
            frame: frame - delay,
            fps,
            config: { damping: 200 },
          });
          const bulletOpacity = interpolate(bulletSpring, [0, 1], [0, 1]);
          const bulletY = interpolate(bulletSpring, [0, 1], [30, 0]);

          return (
            <div
              key={text}
              style={{
                opacity: bulletOpacity,
                transform: `translateY(${bulletY}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: COLOR_GOLD,
                  boxShadow: `0 0 10px ${COLOR_GOLD}`,
                }}
              />
              <span
                style={{
                  fontFamily,
                  fontSize: 52,
                  fontWeight: 700,
                  color: COLOR_WHITE,
                  textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                }}
              >
                {text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const DashboardScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BLACK }}>
      {/* Dashboard screenshots cycling behind */}
      {DASHBOARD_IMAGES.map((file, i) => (
        <Sequence
          key={file}
          from={i * FRAMES_PER_DASH}
          durationInFrames={FRAMES_PER_DASH + 5}
          premountFor={15}
        >
          <DashboardSlide file={file} />
        </Sequence>
      ))}

      {/* Bullet overlay starts after first dashboard shows */}
      <Sequence from={20} durationInFrames={130} layout="none" premountFor={10}>
        <BulletOverlay />
      </Sequence>
    </AbsoluteFill>
  );
};
