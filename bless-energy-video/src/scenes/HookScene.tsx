import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLOR_BLACK, COLOR_WHITE } from '../constants';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', {
  weights: ['700'],
  subsets: ['latin'],
});

const FULL_TEXT = 'El sistema que transformó Bless Energy';
const CHAR_FRAMES = 2;

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Typewriter effect - string slicing
  const charsToShow = Math.min(
    FULL_TEXT.length,
    Math.floor(frame / CHAR_FRAMES)
  );
  const typedText = FULL_TEXT.slice(0, charsToShow);

  // Cursor blink
  const cursorOpacity = interpolate(
    frame % 16,
    [0, 8, 16],
    [1, 0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Fade out + zoom out in last second
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 1 * fps, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const zoomOut = interpolate(
    frame,
    [durationInFrames - 1 * fps, durationInFrames],
    [1, 0.9],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR_BLACK,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          opacity: fadeOut,
          transform: `scale(${zoomOut})`,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: 64,
            fontWeight: 700,
            color: COLOR_WHITE,
            lineHeight: 1.3,
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}
        >
          {typedText}
        </span>
        <span
          style={{
            opacity: cursorOpacity,
            color: COLOR_WHITE,
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          {'\u258C'}
        </span>
      </div>
    </AbsoluteFill>
  );
};
