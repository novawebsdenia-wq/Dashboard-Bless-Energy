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
  weights: ['600'],
  subsets: ['latin'],
});

const SCREENSHOTS = [
  { file: 'screenshots/00-web-home.png', label: 'Sistema Web Premium' },
  { file: 'screenshots/01-web-calculadora.png', label: '' },
  { file: 'screenshots/02-web-formulario.png', label: '' },
];

// 5 seconds total = 150 frames, ~50 frames each
const FRAMES_PER_IMAGE = 50;

const ScreenshotSlide: React.FC<{
  file: string;
  label: string;
  direction: 'left' | 'right';
}> = ({ file, label, direction }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slide in
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const translateX = interpolate(
    slideIn,
    [0, 1],
    [direction === 'left' ? -1080 : 1080, 0]
  );

  // Zoom-in slow
  const scale = interpolate(frame, [0, FRAMES_PER_IMAGE], [1, 1.08], {
    extrapolateRight: 'clamp',
  });

  // Label fade in
  const labelOpacity = interpolate(frame, [10, 20], [0, 1], {
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
          transform: `translateX(${translateX}px)`,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(212,175,55,0.15)',
            width: 940,
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
        {label && (
          <div
            style={{
              opacity: labelOpacity,
              position: 'absolute',
              bottom: 120,
              left: 0,
              right: 0,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontFamily,
                fontSize: 36,
                fontWeight: 600,
                color: COLOR_WHITE,
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '12px 32px',
                borderRadius: 8,
                borderLeft: `3px solid ${COLOR_GOLD}`,
              }}
            >
              {label}
            </span>
          </div>
        )}
      </div>

      {/* Gold particle accent line */}
      <GoldAccentLine />
    </AbsoluteFill>
  );
};

const GoldAccentLine: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 45], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 0,
        width: `${progress * 100}%`,
        height: 2,
        background: `linear-gradient(to right, transparent, ${COLOR_GOLD}, transparent)`,
      }}
    />
  );
};

export const WebSystemScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BLACK }}>
      <Sequence durationInFrames={FRAMES_PER_IMAGE} premountFor={15}>
        <ScreenshotSlide
          file={SCREENSHOTS[0].file}
          label={SCREENSHOTS[0].label}
          direction="right"
        />
      </Sequence>
      <Sequence
        from={FRAMES_PER_IMAGE}
        durationInFrames={FRAMES_PER_IMAGE}
        premountFor={15}
      >
        <ScreenshotSlide
          file={SCREENSHOTS[1].file}
          label={SCREENSHOTS[1].label}
          direction="left"
        />
      </Sequence>
      <Sequence
        from={FRAMES_PER_IMAGE * 2}
        durationInFrames={FRAMES_PER_IMAGE}
        premountFor={15}
      >
        <ScreenshotSlide
          file={SCREENSHOTS[2].file}
          label={SCREENSHOTS[2].label}
          direction="right"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
