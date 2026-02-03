import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLOR_BLACK } from '../constants';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in logo from 0 to 1s
  const fadeIn = interpolate(frame, [0, 1 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Scale entrance with spring
  const scaleSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const scale = interpolate(scaleSpring, [0, 1], [0.8, 1]);

  // Fade out logo from 2s to 3s
  const fadeOut = interpolate(frame, [2 * fps, 3 * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = Math.min(fadeIn, fadeOut);

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
          transform: `scale(${scale})`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Img
          src={staticFile('logos/bless-energy.png')}
          style={{
            width: 280,
            height: 280,
            objectFit: 'contain',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
