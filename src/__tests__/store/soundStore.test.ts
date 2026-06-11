import { useSoundStore } from '../../store/soundStore';

describe('soundStore', () => {
  beforeEach(() => {
    useSoundStore.setState({ isSoundEnabled: true });
  });

  describe('toggleSound', () => {
    it('should toggle from enabled to disabled', () => {
      useSoundStore.getState().toggleSound();
      expect(useSoundStore.getState().isSoundEnabled).toBe(false);
    });

    it('should toggle from disabled to enabled', () => {
      useSoundStore.setState({ isSoundEnabled: false });
      useSoundStore.getState().toggleSound();
      expect(useSoundStore.getState().isSoundEnabled).toBe(true);
    });
  });

  describe('setSoundEnabled', () => {
    it('should enable sound', () => {
      useSoundStore.getState().setSoundEnabled(true);
      expect(useSoundStore.getState().isSoundEnabled).toBe(true);
    });

    it('should disable sound', () => {
      useSoundStore.getState().setSoundEnabled(false);
      expect(useSoundStore.getState().isSoundEnabled).toBe(false);
    });
  });
});