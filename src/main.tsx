import { createRoot } from 'react-dom/client';
import vkBridge from '@vkontakte/vk-bridge';
import { AppConfig } from './AppConfig.tsx';
import { useThemeStore } from './store/themeStore.ts';
import { useSoundStore } from './store/soundStore.ts';
import { soundGenerator } from './hooks/useSound.ts';
import { analytics } from './utils/analytics.ts';
import './index.css';
import './components/Global.css';

vkBridge.send('VKWebAppInit');

const applyTheme = () => {
  const theme = useThemeStore.getState().theme;
  if (theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
};

const applySoundSettings = () => {
  const { isSoundEnabled } = useSoundStore.getState();
  soundGenerator.setEnabled(isSoundEnabled);
  console.log('Sound enabled:', isSoundEnabled);
};

useThemeStore.subscribe(() => {
  applyTheme();
});

useSoundStore.subscribe((state) => {
  console.log('Sound store changed:', state.isSoundEnabled);
  soundGenerator.setEnabled(state.isSoundEnabled);
});

applyTheme();
applySoundSettings();

analytics.trackEvent('app_start', { 
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  mode: import.meta.env.MODE 
});

window.addEventListener('error', (event) => {
  analytics.trackAppError(event.message, event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  analytics.trackAppError(`Unhandled rejection: ${event.reason}`);
});

window.addEventListener('beforeunload', () => {
  analytics.trackEvent('app_close', {
    session_duration: analytics.getSessionStats().duration,
  });
});

createRoot(document.getElementById('root')!).render(<AppConfig />);

if (import.meta.env.MODE === 'development') {
  import('./eruda.ts');
}