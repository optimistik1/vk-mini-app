import { FC } from 'react';
import { Icon28ArrowLeftOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { useThemeStore } from '../store/themeStore';
import { useSound } from '../hooks/useSound';
import { analytics } from '../utils/analytics';

export const BackToSudoku: FC = () => {
  const routeNavigator = useRouteNavigator();
  const { theme } = useThemeStore();
  const { playClick } = useSound();

  const handleBack = () => {
    playClick();
    analytics.trackBackClick('leaderboard');
    routeNavigator.push('/sudoku');
  };

  const isLightTheme = theme === 'light';

  return (
    <div
      onClick={handleBack}
      style={{
        cursor: 'pointer',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isLightTheme ? '#ffffff' : '#1a1a1a',
        border: `2px solid ${isLightTheme ? '#dee2e6' : '#444'}`,
        marginRight: '12px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isLightTheme ? '#f0f0f0' : '#2a2a2a';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isLightTheme ? '#ffffff' : '#1a1a1a';
      }}
    >
      <Icon28ArrowLeftOutline width={20} height={20} fill={isLightTheme ? '#333333' : '#ffffff'} />
    </div>
  );
};