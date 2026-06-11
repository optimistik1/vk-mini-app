import vkBridge, { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge';
import { useAdaptivity, useAppearance, useInsets } from '@vkontakte/vk-bridge-react';
import { AdaptivityProvider, ConfigProvider, AppRoot } from '@vkontakte/vkui';
import { RouterProvider } from '@vkontakte/vk-mini-apps-router';
import '@vkontakte/vkui/dist/vkui.css';
import { AnimatedBackground } from './components/AnimatedBackground';
import { transformVKBridgeAdaptivity } from "./utils/transformVKBridgeAdaptivity";
import { router } from './routes';
import { App } from './App';
import { useThemeStore } from './store/themeStore';
import { useEffect, useState } from 'react';

export const AppConfig = () => {
  const vkBridgeAppearance = useAppearance() || undefined;
  const vkBridgeInsets = useInsets() || undefined;
  const adaptivity = transformVKBridgeAdaptivity(useAdaptivity());
  const { vk_platform } = parseURLSearchParamsForGetLaunchParams(window.location.search);
  const { theme, setTheme } = useThemeStore();
  const [showAnimatedBackground, setShowAnimatedBackground] = useState(true);

  useEffect(() => {
    const checkPath = () => {
      const hash = window.location.hash;
      const isMenu = !hash || hash === '#/' || hash === '/' || hash === '';
      setShowAnimatedBackground(isMenu);
    };
    
    checkPath();
    window.addEventListener('hashchange', checkPath);
    return () => window.removeEventListener('hashchange', checkPath);
  }, []);

  useEffect(() => {
    if (vkBridgeAppearance && vkBridgeAppearance !== theme) {
      setTheme(vkBridgeAppearance === 'dark' ? 'dark' : 'light');
    }
  }, [vkBridgeAppearance, setTheme, theme]);
  
  const colorScheme = theme === 'light' ? 'light' : 'dark';

  return (
    <ConfigProvider
      colorScheme={colorScheme}
      platform={vk_platform === 'desktop_web' ? 'vkcom' : undefined}
      isWebView={vkBridge.isWebView()}
      hasCustomPanelHeaderAfter={true}
    >
      <AdaptivityProvider {...adaptivity}>
        <AppRoot mode="full" safeAreaInsets={vkBridgeInsets}>
          {/* Анимированный фон только для главного меню */}
          {showAnimatedBackground && <AnimatedBackground />}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', minHeight: '100vh' }}>
            <RouterProvider router={router}>
              <App />
            </RouterProvider>
          </div>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
};