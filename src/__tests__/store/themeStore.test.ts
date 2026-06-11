import { useThemeStore } from '../../store/themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'dark' });
  });

  describe('toggleTheme', () => {
    it('should toggle from dark to light', () => {
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().theme).toBe('light');
    });

    it('should toggle from light to dark', () => {
      useThemeStore.setState({ theme: 'light' });
      useThemeStore.getState().toggleTheme();
      expect(useThemeStore.getState().theme).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      useThemeStore.getState().setTheme('light');
      expect(useThemeStore.getState().theme).toBe('light');
    });

    it('should set theme to dark', () => {
      useThemeStore.getState().setTheme('dark');
      expect(useThemeStore.getState().theme).toBe('dark');
    });
  });
});