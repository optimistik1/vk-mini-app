import { FC } from 'react';
import { Icon28VolumeOutline } from '@vkontakte/icons';
import { useSoundStore } from '../store/soundStore';
import { useSound } from '../hooks/useSound';
import { analytics } from '../utils/analytics';

export const SoundToggle: FC = () => {
  const { isSoundEnabled, toggleSound } = useSoundStore();
  const { playClick } = useSound();

  const handleToggle = () => {
    playClick();
    analytics.trackSoundToggled(!isSoundEnabled);
    toggleSound();
  };

  return (
    <div
      onClick={handleToggle}
      className={`icon-btn sound-toggle ${!isSoundEnabled ? 'muted' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={isSoundEnabled ? 'Выключить звук' : 'Включить звук'}
    >
      <Icon28VolumeOutline 
        width={20} 
        height={20} 
        style={{ opacity: isSoundEnabled ? 1 : 0.5 }}
      />
    </div>
  );
};