import vkBridge from '@vkontakte/vk-bridge';

export type EventName = 
  | 'app_start'
  | 'app_close'
  | 'app_error'
  | 'screen_view'
  | 'back_click'
  | 'sudoku_game_start'
  | 'sudoku_game_complete'
  | 'sudoku_game_over'
  | 'sudoku_move_made'
  | 'sudoku_hint_used'
  | 'sudoku_note_toggle'
  | 'sudoku_difficulty_change'
  | 'sudoku_pause'
  | 'sudoku_resume'
  | 'sudoku_reset'
  | 'puzzle_game_start'
  | 'puzzle_game_complete'
  | 'puzzle_piece_drag'
  | 'puzzle_piece_place'
  | 'puzzle_piece_wrong'
  | 'puzzle_difficulty_change'
  | 'puzzle_pause'
  | 'puzzle_resume'
  | 'puzzle_reset'
  | 'puzzle_clear'
  | 'puzzle_new_image'
  | 'theme_changed'
  | 'sound_toggled'
  | 'leaderboard_viewed'
  | 'leaderboard_tab_change'
  | 'api_error'
  | 'image_load_error'
  | 'game_save_error';

export type GameType = 'sudoku' | 'puzzle';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Theme = 'dark' | 'light';

export interface EventParams {
  game_type?: GameType;
  difficulty?: Difficulty;
  time_spent?: number;
  mistakes?: number;
  hints_used?: number;
  moves_made?: number;
  pieces_placed?: number;
  theme?: Theme;
  sound_enabled?: boolean;
  tab?: string;
  screen?: string;
  from_screen?: string;
  endpoint?: string;
  error_message?: string;
  error_code?: number;
  error_stack?: string;
  image_url?: string;
  note_mode?: boolean;
  correct?: boolean;
  session_id?: string;
  session_duration?: number;
  user_id?: string;
  timestamp?: number;
  [key: string]: any;
}

interface StoredEvent {
  event: EventName;
  params: EventParams;
  timestamp: string;
  sessionId: string;
}

class Analytics {
  private sessionId: string;
  private sessionStartTime: number;
  private eventsQueue: StoredEvent[] = [];
  private isEnabled: boolean = true;
  private userId: string | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.getUserId();
    this.loadEventsFromStorage();
    
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
    });
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getUserId() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      this.userId = urlParams.get('vk_user_id') || 'anonymous';
    } catch (e) {
      this.userId = 'unknown';
    }
  }

  private loadEventsFromStorage() {
    try {
      const saved = localStorage.getItem('analytics_events');
      if (saved) {
        const events = JSON.parse(saved);
        if (Array.isArray(events)) {
          this.eventsQueue = events;
        }
      }
    } catch (e) {
      console.warn('Failed to load analytics events:', e);
    }
  }

  private saveEventsToStorage() {
    try {
      const eventsToSave = this.eventsQueue.slice(-100);
      localStorage.setItem('analytics_events', JSON.stringify(eventsToSave));
    } catch (e) {
      console.warn('Failed to save analytics events:', e);
    }
  }

  private async sendToVK(eventName: string, params: Record<string, any>) {
    if (!this.isEnabled) return;
    
    try {
      console.log('[Analytics]', eventName, params);
      
      const analyticsLog = localStorage.getItem('analytics_log') || '[]';
      const log = JSON.parse(analyticsLog);
      log.push({ event: eventName, params, time: new Date().toISOString() });
      localStorage.setItem('analytics_log', JSON.stringify(log.slice(-500)));
    } catch (error) {
      console.debug('Analytics send failed:', error);
    }
  }

  private async flushEvents() {
    if (this.eventsQueue.length === 0) return;
    
    const eventsToSend = [...this.eventsQueue];
    this.eventsQueue = [];
    
    for (const event of eventsToSend) {
      await this.sendToVK(event.event, event.params);
    }
    
    this.saveEventsToStorage();
  }

  trackEvent(eventName: EventName, params: EventParams = {}) {
    if (!this.isEnabled) return;
    
    const eventData: StoredEvent = {
      event: eventName,
      params: {
        ...params,
        session_id: this.sessionId,
        session_duration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
        user_id: this.userId || 'unknown',
        timestamp: Date.now(),
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };
    
    this.eventsQueue.push(eventData);
    this.saveEventsToStorage();
    
    const isTest = process.env.NODE_ENV === 'test' || (typeof jest !== 'undefined');
    const isDev = !isTest && import.meta.env.MODE === 'development';

    if (isDev) {
      console.log('[Analytics]', eventName, eventData.params);
    }
    
    const importantEvents: EventName[] = [
      'app_error', 'api_error', 'sudoku_game_complete', 'puzzle_game_complete'
    ];
    
    if (importantEvents.includes(eventName)) {
      this.sendToVK(eventName, eventData.params);
    }
  }

  trackSudokuGameStart(difficulty: Difficulty) {
    this.trackEvent('sudoku_game_start', { game_type: 'sudoku', difficulty });
  }
  
  trackSudokuGameComplete(difficulty: Difficulty, timeSpent: number, mistakes: number, hintsUsed: number, movesMade: number) {
    this.trackEvent('sudoku_game_complete', {
      game_type: 'sudoku',
      difficulty,
      time_spent: timeSpent,
      mistakes,
      hints_used: hintsUsed,
      moves_made: movesMade,
    });
  }
  
  trackSudokuGameOver(difficulty: Difficulty, timeSpent: number, mistakes: number, hintsUsed: number) {
    this.trackEvent('sudoku_game_over', {
      game_type: 'sudoku',
      difficulty,
      time_spent: timeSpent,
      mistakes,
      hints_used: hintsUsed,
    });
  }
  
  trackSudokuMoveMade() {
    this.trackEvent('sudoku_move_made', { game_type: 'sudoku' });
  }
  
  trackSudokuHintUsed() {
    this.trackEvent('sudoku_hint_used', { game_type: 'sudoku' });
  }
  
  trackSudokuNoteToggle(enabled: boolean) {
    this.trackEvent('sudoku_note_toggle', { game_type: 'sudoku', note_mode: enabled });
  }
  
  trackSudokuDifficultyChange(difficulty: Difficulty) {
    this.trackEvent('sudoku_difficulty_change', { game_type: 'sudoku', difficulty });
  }
  
  trackSudokuPause() {
    this.trackEvent('sudoku_pause', { game_type: 'sudoku' });
  }
  
  trackSudokuResume() {
    this.trackEvent('sudoku_resume', { game_type: 'sudoku' });
  }
  
  trackSudokuReset() {
    this.trackEvent('sudoku_reset', { game_type: 'sudoku' });
  }
  
  trackPuzzleGameStart(difficulty: Difficulty) {
    this.trackEvent('puzzle_game_start', { game_type: 'puzzle', difficulty });
  }
  
  trackPuzzleGameComplete(difficulty: Difficulty, timeSpent: number, piecesCount: number) {
    this.trackEvent('puzzle_game_complete', {
      game_type: 'puzzle',
      difficulty,
      time_spent: timeSpent,
      pieces_placed: piecesCount,
    });
  }
  
  trackPuzzlePieceDrag() {
    this.trackEvent('puzzle_piece_drag', { game_type: 'puzzle' });
  }
  
  trackPuzzlePiecePlace(correct: boolean) {
    this.trackEvent(correct ? 'puzzle_piece_place' : 'puzzle_piece_wrong', { 
      game_type: 'puzzle',
      correct 
    });
  }
  
  trackPuzzleDifficultyChange(difficulty: Difficulty) {
    this.trackEvent('puzzle_difficulty_change', { game_type: 'puzzle', difficulty });
  }
  
  trackPuzzlePause() {
    this.trackEvent('puzzle_pause', { game_type: 'puzzle' });
  }
  
  trackPuzzleResume() {
    this.trackEvent('puzzle_resume', { game_type: 'puzzle' });
  }
  
  trackPuzzleReset() {
    this.trackEvent('puzzle_reset', { game_type: 'puzzle' });
  }
  
  trackPuzzleClear() {
    this.trackEvent('puzzle_clear', { game_type: 'puzzle' });
  }
  
  trackPuzzleNewImage() {
    this.trackEvent('puzzle_new_image', { game_type: 'puzzle' });
  }
  
  trackScreenView(screen: string) {
    this.trackEvent('screen_view', { screen });
  }
  
  trackBackClick(fromScreen: string) {
    this.trackEvent('back_click', { from_screen: fromScreen });
  }
  
  trackThemeChanged(theme: Theme) {
    this.trackEvent('theme_changed', { theme });
  }
  
  trackSoundToggled(enabled: boolean) {
    this.trackEvent('sound_toggled', { sound_enabled: enabled });
  }
  
  trackLeaderboardViewed(tab: string) {
    this.trackEvent('leaderboard_viewed', { tab });
  }
  
  trackLeaderboardTabChange(tab: string) {
    this.trackEvent('leaderboard_tab_change', { tab });
  }
  
  trackApiError(endpoint: string, errorMessage: string, errorCode?: number) {
    this.trackEvent('api_error', {
      endpoint,
      error_message: errorMessage,
      error_code: errorCode,
    });
  }
  
  trackImageLoadError(url: string, errorMessage: string) {
    this.trackEvent('image_load_error', {
      image_url: url?.substring(0, 100),
      error_message: errorMessage,
    });
  }
  
  trackGameSaveError(gameType: GameType, errorMessage: string) {
    this.trackEvent('game_save_error', {
      game_type: gameType,
      error_message: errorMessage,
    });
  }
  
  trackAppError(errorMessage: string, errorStack?: string) {
    this.trackEvent('app_error', {
      error_message: errorMessage,
      error_stack: errorStack?.substring(0, 500),
    });
  }
  
  enable() {
    this.isEnabled = true;
  }
  
  disable() {
    this.isEnabled = false;
  }
  
  getSessionStats() {
    return {
      sessionId: this.sessionId,
      duration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      eventsCount: this.eventsQueue.length,
    };
  }
  
  getEvents(): StoredEvent[] {
    return [...this.eventsQueue];
  }
  
  clearEvents() {
    this.eventsQueue = [];
    this.saveEventsToStorage();
  }
}

export const analytics = new Analytics();

export const useAnalytics = () => {
  return analytics;
};