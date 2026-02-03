import './style.css';
import { Composition } from 'remotion';
import { BlessEnergyVideo } from './BlessEnergyVideo';
import { WIDTH, HEIGHT, FPS, DURATION_IN_FRAMES } from './constants';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BlessEnergyVideo"
      component={BlessEnergyVideo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
