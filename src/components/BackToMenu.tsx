import { FC } from 'react';
import { Icon28ArrowLeftOutline } from '@vkontakte/icons';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { useThemeStore } from '../store/themeStore';
import { useSound } from '../hooks/useSound';

export const BackToMenu: FC = () => {
  const routeNavigator = useRouteNavigator();
  const { theme } = useThemeStore();
  const { playClick } = useSound();

  const handleBack = () => {
    playClick();
    routeNavigator.push('/');
  };

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
        background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        border: `2px solid ${theme === 'dark' ? '#444' : '#dee2e6'}`,
        marginRight: '12px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme === 'dark' ? '#2a2a2a' : '#f0f0f0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = theme === 'dark' ? '#1a1a1a' : '#ffffff';
      }}
    >
      <Icon28ArrowLeftOutline width={20} height={20} fill={theme === 'dark' ? '#ffffff' : '#333333'} />
    </div>
  );
};