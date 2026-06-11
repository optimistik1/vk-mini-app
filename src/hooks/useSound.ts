import { useCallback } from 'react';
import { useSoundStore } from '../store/soundStore';

class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private isInitialized = false;
  
  private errorAudioElement: HTMLAudioElement | null = null;
  
  private lostSounds: HTMLAudioElement[] = [];
  
  private winSounds: HTMLAudioElement[] = [];

  constructor() {

    const initOnUserInteraction = () => {
      this.initAudioContext();
      this.initCustomSounds();
      document.removeEventListener('click', initOnUserInteraction);
      document.removeEventListener('touchstart', initOnUserInteraction);
    };
    document.addEventListener('click', initOnUserInteraction);
    document.addEventListener('touchstart', initOnUserInteraction);
  }

  private initAudioContext() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      console.log('AudioContext initialized');
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  private initCustomSounds() {
    try {
      this.errorAudioElement = new Audio('/sounds/error.ogg');
      this.errorAudioElement.preload = 'auto';
      this.errorAudioElement.volume = 0.35;
      this.errorAudioElement.addEventListener('canplaythrough', () => {
        console.log('✓ Error sound loaded: error.ogg');
      });
      this.errorAudioElement.addEventListener('error', () => {
        console.warn('✗ Failed to load error sound');
        this.errorAudioElement = null;
      });
    } catch (e) {
      console.warn('Failed to create error sound:', e);
    }

    const lostSoundNames = ['lost1', 'lost2', 'lost3', 'lost4'];
    
    lostSoundNames.forEach((name, index) => {
      try {
        const audio = new Audio(`/sounds/${name}.ogg`);
        audio.preload = 'auto';
        audio.volume = 0.45;
        
        audio.addEventListener('canplaythrough', () => {
          console.log(`✓ Lost sound loaded: ${name}.ogg`);
        });
        
        audio.addEventListener('error', (e) => {
          console.warn(`✗ Failed to load lost sound: ${name}.ogg`);
        });
        
        this.lostSounds.push(audio);
      } catch (e) {
        console.warn(`Failed to create lost sound: ${name}`);
      }
    });
    
    console.log(`✓ Loaded ${this.lostSounds.length}/4 lost sounds for game over`);

    const winSoundNames = ['win1', 'win2', 'win3'];
    
    winSoundNames.forEach((name, index) => {
      try {
        const audio = new Audio(`/sounds/${name}.ogg`);
        audio.preload = 'auto';
        audio.volume = 0.5;
        
        audio.addEventListener('canplaythrough', () => {
          console.log(`✓ Win sound loaded: ${name}.ogg`);
        });
        
        audio.addEventListener('error', (e) => {
          console.warn(`✗ Failed to load win sound: ${name}.ogg`);
        });
        
        this.winSounds.push(audio);
      } catch (e) {
        console.warn(`Failed to create win sound: ${name}`);
      }
    });
    
    console.log(`✓ Loaded ${this.winSounds.length}/3 win sounds for victory`);
  }

  private getRandomLostSound(): HTMLAudioElement | null {
    if (this.lostSounds.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * this.lostSounds.length);
    console.log(`🔊 Playing random lost sound #${randomIndex + 1} of ${this.lostSounds.length}`);
    return this.lostSounds[randomIndex];
  }

  private getRandomWinSound(): HTMLAudioElement | null {
    if (this.winSounds.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * this.winSounds.length);
    console.log(`🎉 Playing random win sound #${randomIndex + 1} of ${this.winSounds.length}`);
    return this.winSounds[randomIndex];
  }

  private async ensureContextRunning() {
    if (!this.audioContext) return false;
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext.state === 'running';
  }

  private createSound(
    frequencies: number[] | number,
    duration: number,
    volume: number = 0.1,
    type: OscillatorType = 'sine'
  ) {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      this.ensureContextRunning();
      
      const freqs = Array.isArray(frequencies) ? frequencies : [frequencies];
      const now = this.audioContext.currentTime;
      
      freqs.forEach((freq, index) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = freq;
        gainNode.gain.value = volume;
        
        const startTime = now + index * 0.08;
        oscillator.start(startTime);
        
        gainNode.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);
        oscillator.stop(startTime + duration);
      });
    } catch (e) {
      console.warn('Sound error:', e);
    }
  }

  playClick() {
    if (!this.isEnabled) return;
    this.createSound(880, 0.08, 0.08);
  }

  playSuccess() {
    if (!this.isEnabled) return;
    this.createSound([523.25, 659.25, 783.99], 0.25, 0.12);
  }

  playError() {
    if (!this.isEnabled) return;
    
    if (this.errorAudioElement) {
      this.errorAudioElement.pause();
      this.errorAudioElement.currentTime = 0;
      this.errorAudioElement.play().catch(e => {
        console.debug('Error sound play failed:', e);
        this.createSound(220, 0.2, 0.1, 'sawtooth');
      });
    } else {
      this.createSound(220, 0.2, 0.1, 'sawtooth');
    }
  }

  playGameOver() {
    if (!this.isEnabled) return;

    setTimeout(() => {
      const randomLostSound = this.getRandomLostSound();
      
      if (randomLostSound) {
        randomLostSound.pause();
        randomLostSound.currentTime = 0;
        randomLostSound.play().catch(e => {
          console.debug('Game over sound play failed:', e);
          this.playError();
        });
      } else {
        console.warn('No lost sounds available, using fallback');
        this.createSound(150, 0.6, 0.2, 'sawtooth');
      }
    }, 50);
  }

  playVictory() {
    if (!this.isEnabled) return;
    
    setTimeout(() => {
      const randomWinSound = this.getRandomWinSound();
      
      if (randomWinSound) {
        randomWinSound.pause();
        randomWinSound.currentTime = 0;
        randomWinSound.play().catch(e => {
          console.debug('Victory sound play failed:', e);
          this.createSound([523.25, 659.25, 783.99, 1046.5], 0.4, 0.15);
        });
      } else {
        console.warn('No win sounds available, using fallback');
        this.createSound([523.25, 659.25, 783.99, 1046.5], 0.4, 0.15);
      }
    }, 50);
  }

  playDrag() {
    if (!this.isEnabled) return;
    this.createSound(440, 0.05, 0.05, 'triangle');
  }

  playPlace() {
    if (!this.isEnabled) return;
    this.createSound(659.25, 0.12, 0.1);
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled && this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
    }
  }
}

export const soundGenerator = new SoundGenerator();

export const useSound = () => {
  const { isSoundEnabled } = useSoundStore();
  
  const playClick = useCallback(() => {
    if (isSoundEnabled) soundGenerator.playClick();
  }, [isSoundEnabled]);
  
  const playSuccess = useCallback(() => {
    if (isSoundEnabled) soundGenerator.playSuccess();
  }, [isSoundEnabled]);
  
  const playError = useCallback(() => {
    if (isSoundEnabled) soundGenerator.playError();
  }, [isSoundEnabled]);
  
  const playGameOver = useCallback(() => {
    if (isSoundEnabled) soundGenerator.playGameOver();
  }, [isSoundEnabled]);
  
  const playVictory = useCallback(() => {
    if (isSoundEnabled) soundGenerator.playVictory();
  }, [isSoundEnabled]);
  
  const playDrag = useCallback(() => {
    if (isSoundEnabled) soundGenerator.playDrag();
  }, [isSoundEnabled]);
  
  const playPlace = useCallback(() => {
    if (isSoundEnabled) soundGenerator.playPlace();
  }, [isSoundEnabled]);
  
  const setEnabled = useCallback((enabled: boolean) => {
    soundGenerator.setEnabled(enabled);
  }, []);

  return {
    playClick,
    playSuccess,
    playError,
    playGameOver,
    playVictory,
    playDrag,
    playPlace,
    setEnabled,
  };
};