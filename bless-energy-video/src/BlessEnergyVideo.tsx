import { AbsoluteFill, Audio, staticFile, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import { StoryFlow } from './scenes/StoryFlow';

export const BlessEnergyVideo: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Fade out music in the last 2 seconds (60 frames)
  const volume = interpolate(
    frame,
    [durationInFrames - 60, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill>
      {/* Background Music - loops if shorter, but usually better to have long track */}
      <Audio
        src={staticFile('music.mp3')}
        volume={volume}
        loop
      />

      <StoryFlow />
    </AbsoluteFill>
  );
};
