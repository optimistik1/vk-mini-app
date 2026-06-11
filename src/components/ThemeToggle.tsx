import { FC } from 'react';
import { Icon28MoonOutline, Icon28SunOutline } from '@vkontakte/icons';
import { useThemeStore } from '../store/themeStore';
import { useSound } from '../hooks/useSound';
import { analytics } from '../utils/analytics';

export const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { playClick } = useSound();

  const handleToggle = () => {
    playClick();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    analytics.trackThemeChanged(newTheme);
    toggleTheme();
  };

  return (
    <div
      onClick={handleToggle}
      className="icon-btn theme-toggle"
      role="button"
      tabIndex={0}
      aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    >
      {theme === 'dark' ? (
        <Icon28SunOutline width={20} height={20} />
      ) : (
        <Icon28MoonOutline width={20} height={20} />
      )}
    </div>
  );
};