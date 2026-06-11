import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { analytics } from '../utils/analytics';

interface SoundStore {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      isSoundEnabled: true,
      toggleSound: () => {
        set((state) => {
          const newState = !state.isSoundEnabled;
          analytics.trackSoundToggled(newState);
          return { isSoundEnabled: newState };
        });
      },
      setSoundEnabled: (enabled) => {
        analytics.trackSoundToggled(enabled);
        set({ isSoundEnabled: enabled });
      },
    }),
    {
      name: 'sound-storage',
    }
  )
);