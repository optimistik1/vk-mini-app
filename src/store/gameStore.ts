import { create } from 'zustand';
import { sudokuApi } from '../api/sudokuApi';
import { soundGenerator } from '../hooks/useSound';
import { analytics } from '../utils/analytics';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Cell {
  value: number;
  isFixed: boolean;
  notes: number[];
  mistake?: boolean;
}

interface PromotionInfo {
  next_level?: string;
  need_games?: number;
  current_games?: number;
  need_win_rate?: number;
  current_win_rate?: number;
}

interface GameState {
  board: Cell[][];
  gameId: number | null;
  difficulty: Difficulty;
  mistakes: number;
  maxMistakes: number;
  time: number;
  selectedRow: number | null;
  selectedCol: number | null;
  noteMode: boolean;
  isComplete: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  lastHintRow: number | null;
  lastHintCol: number | null;
  isBoardReady: boolean;
  isLoading: boolean;
  playerSkill: string;
  gamesPlayed: number;
  completedGames: number;
  winRate: number;
  recentWinRate: number;
  recentGamesCount: number;
  promotionInfo: PromotionInfo;
  allowedDifficulties: Difficulty[];
}

interface GameStore extends GameState {
  newGame: (difficulty: Difficulty, forceNew?: boolean) => Promise<void>;
  selectCell: (row: number, col: number) => void;
  setNumber: (num: number) => Promise<void>;
  clearCell: () => Promise<void>;
  resetGame: () => Promise<void>;
  getHint: () => Promise<void>;
  incrementTime: () => void;
  toggleNoteMode: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  loadUserStats: () => Promise<void>;
  saveCurrentState: () => Promise<void>;
  loadSavedGame: () => Promise<boolean>;
  forceNewGame: (difficulty: Difficulty) => Promise<void>;
  autoCheckAndComplete: () => Promise<void>;
}

const boardToNumbers = (board: Cell[][]): number[][] => {
  return board.map(row => row.map(cell => cell.value));
};

const isBoardFullyFilled = (board: Cell[][]): boolean => {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j].value === 0) return false;
    }
  }
  return true;
};

export const useGameStore = create<GameStore>((set, get) => ({
  board: [],
  gameId: null,
  difficulty: 'medium',
  mistakes: 0,
  maxMistakes: 3,
  time: 0,
  selectedRow: null,
  selectedCol: null,
  noteMode: false,
  isComplete: false,
  isGameOver: false,
  isPaused: false,
  lastHintRow: null,
  lastHintCol: null,
  isBoardReady: false,
  isLoading: false,
  playerSkill: 'beginner',
  gamesPlayed: 0,
  completedGames: 0,
  winRate: 0,
  recentWinRate: 0,
  recentGamesCount: 0,
  promotionInfo: {},
  allowedDifficulties: ['easy'],

  saveCurrentState: async () => {
    const { gameId, board, isComplete, isGameOver, difficulty, time } = get();
    if (!gameId || isComplete || isGameOver) return;
    
    try {
      const currentBoardNumbers = boardToNumbers(board);
      await sudokuApi.saveState(gameId, currentBoardNumbers);
      localStorage.setItem('sudoku_game_id', gameId.toString());
      localStorage.setItem('sudoku_difficulty', difficulty);
      localStorage.setItem(`sudoku_time_${gameId}`, time.toString());
      console.log('Sudoku state saved successfully, difficulty:', difficulty, 'time:', time);
    } catch (error) {
      console.error('Failed to save game state:', error);
      analytics.trackGameSaveError('sudoku', String(error));
    }
  },

  loadSavedGame: async (): Promise<boolean> => {
    set({ isLoading: true });
    
    const savedGameId = localStorage.getItem('sudoku_game_id');
    const savedDifficulty = localStorage.getItem('sudoku_difficulty') as Difficulty | null;
    
    if (!savedGameId) {
      console.log('No saved sudoku game ID found');
      set({ isLoading: false });
      return false;
    }
    
    try {
      const gameId = parseInt(savedGameId, 10);
      console.log('Loading saved sudoku game:', gameId, 'difficulty:', savedDifficulty);
      
      const stateData = await sudokuApi.loadState(gameId);
      
      if (stateData.is_completed) {
        console.log('Game already completed on server, starting new game');
        localStorage.removeItem('sudoku_game_id');
        localStorage.removeItem('sudoku_difficulty');
        localStorage.removeItem(`sudoku_time_${gameId}`);
        set({ isLoading: false });
        return false;
      }
      
      if (stateData.has_saved_progress && stateData.current_board) {
        const puzzle = stateData.puzzle;
        const savedBoard = stateData.current_board;
        const loadedDifficulty = savedDifficulty || stateData.difficulty || 'medium';
        const savedTime = localStorage.getItem(`sudoku_time_${gameId}`);
        const loadedTime = savedTime ? parseInt(savedTime, 10) : 0;
        
        const board: Cell[][] = puzzle.map((row: number[], i: number) =>
          row.map((value: number, j: number) => ({
            value: savedBoard[i]?.[j] || 0,
            isFixed: value !== 0,
            notes: [],
            mistake: false,
          }))
        );
        
        set({
          board,
          gameId: gameId,
          difficulty: loadedDifficulty,
          isBoardReady: true,
          isComplete: false,
          isGameOver: false,
          time: loadedTime,
          isLoading: false,
        });
        
        console.log('Saved sudoku game loaded successfully, difficulty:', loadedDifficulty, 'time:', loadedTime);
        return true;
      } else {
        localStorage.removeItem('sudoku_game_id');
        localStorage.removeItem('sudoku_difficulty');
        localStorage.removeItem(`sudoku_time_${gameId}`);
        set({ isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Failed to load saved game:', error);
      analytics.trackGameSaveError('sudoku', String(error));
      localStorage.removeItem('sudoku_game_id');
      localStorage.removeItem('sudoku_difficulty');
      set({ isLoading: false });
      return false;
    }
  },

  forceNewGame: async (difficulty: Difficulty) => {
    console.log('Force creating new sudoku game with difficulty:', difficulty);
    set({ 
      isLoading: true,
      isBoardReady: false, 
      time: 0, 
      isPaused: false, 
      isComplete: false, 
      isGameOver: false 
    });
    
    try {
      localStorage.removeItem('sudoku_game_id');
      localStorage.removeItem('sudoku_difficulty');
      
      const data = await sudokuApi.createGame(difficulty);
      const puzzle = data.puzzle;
      const board: Cell[][] = puzzle.map((row: number[]) =>
        row.map((value: number) => ({
          value: value === 0 ? 0 : value,
          isFixed: value !== 0,
          notes: [],
          mistake: false,
        }))
      );
      
      const actualDifficulty = data.difficulty || difficulty;
      
      set({
        board,
        gameId: data.game_id,
        difficulty: actualDifficulty,
        mistakes: 0,
        maxMistakes: 3,
        selectedRow: null,
        selectedCol: null,
        noteMode: false,
        isComplete: false,
        isGameOver: false,
        lastHintRow: null,
        lastHintCol: null,
        isBoardReady: true,
        isLoading: false,
        time: 0,
      });
      
      localStorage.setItem('sudoku_game_id', data.game_id.toString());
      localStorage.setItem('sudoku_difficulty', actualDifficulty);
      localStorage.setItem(`sudoku_time_${data.game_id}`, '0');
      
      analytics.trackSudokuGameStart(actualDifficulty);
      await get().loadUserStats();
      
    } catch (error) {
      console.error('Failed to create game:', error);
      analytics.trackApiError('sudoku/create', String(error));
      set({ isLoading: false, isBoardReady: false });
    }
  },

  loadUserStats: async () => {
    set({ isLoading: true });
    
    try {
      const data = await sudokuApi.getUserStats();
      const promotionInfo = data.promotion_info || {};
      
      set({
        playerSkill: data.skill_level,
        gamesPlayed: data.total_games_all_time,
        completedGames: data.total_completed_all_time,
        winRate: data.total_win_rate_all_time,
        recentWinRate: data.recent_win_rate,
        recentGamesCount: data.recent_games_count,
        promotionInfo: {
          next_level: promotionInfo.next_skill,
          need_games: promotionInfo.needed_games || promotionInfo.easy_games_needed || promotionInfo.medium_games_needed || 0,
          current_games: promotionInfo.games_played || promotionInfo.easy_games_played || promotionInfo.medium_games_played || 0,
          need_win_rate: promotionInfo.needed_win_rate || promotionInfo.required_win_rate || 0,
          current_win_rate: promotionInfo.win_rate || promotionInfo.current_win_rate || 0,
        },
        allowedDifficulties: data.allowed_difficulties || ['easy'],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
      analytics.trackApiError('stats/user', String(error));
      set({ isLoading: false });
    }
  },

  newGame: async (difficulty: Difficulty, forceNew: boolean = false) => {
    if (forceNew) {
      await get().forceNewGame(difficulty);
      return;
    }
    
    set({ 
      isLoading: true,
      isBoardReady: false, 
      time: 0, 
      isPaused: false, 
      isComplete: false, 
      isGameOver: false 
    });
    
    try {
      const hasSavedGame = await get().loadSavedGame();
      
      if (hasSavedGame) {
        console.log('Loaded saved sudoku game, skipping creation');
        set({ isLoading: false });
        return;
      }
      
      const data = await sudokuApi.createGame(difficulty);
      const puzzle = data.puzzle;
      const board: Cell[][] = puzzle.map((row: number[]) =>
        row.map((value: number) => ({
          value: value === 0 ? 0 : value,
          isFixed: value !== 0,
          notes: [],
          mistake: false,
        }))
      );
      
      const actualDifficulty = data.difficulty || difficulty;
      
      set({
        board,
        gameId: data.game_id,
        difficulty: actualDifficulty,
        mistakes: 0,
        maxMistakes: 3,
        selectedRow: null,
        selectedCol: null,
        noteMode: false,
        isComplete: false,
        isGameOver: false,
        lastHintRow: null,
        lastHintCol: null,
        isBoardReady: true,
        isLoading: false,
        time: 0,
      });
      
      localStorage.setItem('sudoku_game_id', data.game_id.toString());
      localStorage.setItem('sudoku_difficulty', actualDifficulty);
      localStorage.setItem(`sudoku_time_${data.game_id}`, '0');
      
      analytics.trackSudokuGameStart(actualDifficulty);
      await get().loadUserStats();
      
    } catch (error) {
      console.error('Failed to create game:', error);
      analytics.trackApiError('sudoku/create', String(error));
      set({ isLoading: false, isBoardReady: false });
    }
  },

  selectCell: (row: number, col: number) => {
    const { isComplete, isGameOver, isPaused, isBoardReady } = get();
    if (isComplete || isGameOver || isPaused || !isBoardReady) return;
    set({ selectedRow: row, selectedCol: col });
  },

  setNumber: async (num: number) => {
    const { 
      selectedRow, selectedCol, board, gameId, mistakes, maxMistakes, 
      noteMode, isComplete, isGameOver, isPaused, isBoardReady, 
      difficulty, time 
    } = get();
    
    if (selectedRow === null || selectedCol === null || isComplete || isGameOver || isPaused || !isBoardReady) return;
    
    const cell = board[selectedRow][selectedCol];
    if (cell.isFixed) return;
    
    if (noteMode) {
      const newBoard = [...board];
      const notes = [...cell.notes];
      const index = notes.indexOf(num);
      if (index === -1) {
        notes.push(num);
        notes.sort();
      } else {
        notes.splice(index, 1);
      }
      newBoard[selectedRow][selectedCol] = { ...cell, notes, mistake: false };
      set({ board: newBoard });
      await get().saveCurrentState();
      return;
    }
    
    if (!gameId) {
      console.error('No gameId for move validation');
      return;
    }
    
    try {
      const response = await sudokuApi.makeMove(gameId, selectedRow, selectedCol, num);
      
      if (response.success && response.valid) {
        const newBoard = [...board];
        
        if (response.cleared) {
          newBoard[selectedRow][selectedCol] = { ...cell, value: 0, notes: [], mistake: false };
          set({ board: newBoard });
          soundGenerator.playSuccess();
        } else {
          newBoard[selectedRow][selectedCol] = { ...cell, value: response.value || num, notes: [], mistake: false };
          set({ board: newBoard });
          soundGenerator.playSuccess();
        }
        
        analytics.trackSudokuMoveMade();
        await get().saveCurrentState();
        
        if (isBoardFullyFilled(newBoard)) {
          console.log('Все клетки заполнены! Проверяем решение...');
          await get().autoCheckAndComplete();
        }
        
      } else if (!response.success && !response.valid) {
        const newMistakes = mistakes + 1;
        
        if (newMistakes < maxMistakes) {
          soundGenerator.playError();
        }
        
        set({ mistakes: newMistakes });
        analytics.trackSudokuMoveMade();
        
        const newBoard = [...board];
        newBoard[selectedRow][selectedCol] = { ...cell, mistake: true };
        set({ board: newBoard });
        
        setTimeout(() => {
          const currentBoard = get().board;
          const restoredBoard = [...currentBoard];
          if (restoredBoard[selectedRow]?.[selectedCol]) {
            restoredBoard[selectedRow][selectedCol] = { ...cell, mistake: false };
            set({ board: restoredBoard });
          }
        }, 300);
        
        if (newMistakes >= maxMistakes) {
          soundGenerator.playGameOver();
          analytics.trackSudokuGameOver(difficulty, time, newMistakes, 0);
          set({ isGameOver: true, isBoardReady: false });
          localStorage.removeItem('sudoku_game_id');
          localStorage.removeItem('sudoku_difficulty');
          if (gameId) localStorage.removeItem(`sudoku_time_${gameId}`);
        }
      }
      
    } catch (error: any) {
      console.error('Failed to make move:', error);
      
      if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.detail;
        if (errorDetail?.includes('была заполнена изначально')) {
          soundGenerator.playError();
        }
      }
      
      analytics.trackApiError('sudoku/move', String(error));
    }
  },

  clearCell: async () => {
    const { selectedRow, selectedCol, board, gameId, isComplete, isGameOver, isPaused, isBoardReady } = get();
    if (selectedRow === null || selectedCol === null || isComplete || isGameOver || isPaused || !isBoardReady) return;
    
    const cell = board[selectedRow][selectedCol];
    if (cell.isFixed) return;
    
    const newBoard = [...board];
    newBoard[selectedRow][selectedCol] = { ...cell, value: 0, notes: [], mistake: false };
    set({ board: newBoard });
    
    if (gameId) {
      try {
        await sudokuApi.makeMove(gameId, selectedRow, selectedCol, 0);
      } catch (error) {
        console.error('Failed to clear cell on server:', error);
      }
    }
    
    await get().saveCurrentState();
  },

  resetGame: async () => {
    const { difficulty, gameId } = get();
    analytics.trackSudokuReset();
    
    set({ isLoading: true });
    
    if (gameId) {
      try {
        await sudokuApi.clearState(gameId);
      } catch (error) {
        console.error('Failed to clear game state on server:', error);
      }
    }
    
    localStorage.removeItem('sudoku_game_id');
    localStorage.removeItem('sudoku_difficulty');
    if (gameId) localStorage.removeItem(`sudoku_time_${gameId}`);
    await get().forceNewGame(difficulty);
    set({ isLoading: false });
  },

  getHint: async () => {
    const { gameId, isComplete, isGameOver, isPaused, isBoardReady, board } = get();
    if (!gameId || isComplete || isGameOver || isPaused || !isBoardReady) return;
    
    try {
      const data = await sudokuApi.getHint(gameId);
      const { row, col, value } = data;
      
      analytics.trackSudokuHintUsed();
      
      set({ lastHintRow: row, lastHintCol: col });
      
      setTimeout(() => {
        set({ lastHintRow: null, lastHintCol: null });
      }, 1500);
      
      set({ selectedRow: row, selectedCol: col });
      
      const cell = board[row][col];
      if (cell && !cell.isFixed) {
        const newBoard = [...board];
        newBoard[row][col] = { ...cell, value, notes: [], mistake: false };
        set({ board: newBoard });
        
        await get().saveCurrentState();
        
        if (isBoardFullyFilled(newBoard)) {
          await get().autoCheckAndComplete();
        }
      }
    } catch (error) {
      console.error('Failed to get hint:', error);
      analytics.trackApiError('sudoku/hint', String(error));
    }
  },

  autoCheckAndComplete: async () => {
    const { gameId, difficulty, time, mistakes, isBoardReady, isComplete, isGameOver } = get();
    
    if (!gameId || isComplete || isGameOver || !isBoardReady) return;
    
    set({ isLoading: true });
    
    try {
      const result = await sudokuApi.checkSolution(gameId);
      
      if (result.is_correct) {
        analytics.trackSudokuGameComplete(difficulty, time, mistakes, 0, 0);
        soundGenerator.playVictory();
        set({ isComplete: true, isBoardReady: false, isLoading: false });
        localStorage.removeItem('sudoku_game_id');
        localStorage.removeItem('sudoku_difficulty');
        if (gameId) localStorage.removeItem(`sudoku_time_${gameId}`);
        await get().loadUserStats();
      } else {
        console.log('Решение неправильное, проверьте ещё раз');
        soundGenerator.playError();
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to auto-check solution:', error);
      analytics.trackApiError('sudoku/check', String(error));
      set({ isLoading: false });
    }
  },

  incrementTime: () => {
    const { isComplete, isGameOver, isPaused, isBoardReady, gameId, time } = get();
    if (isComplete || isGameOver || isPaused || !isBoardReady) return;
    
    const newTime = time + 1;
    set({ time: newTime });
    
    if (gameId) {
      localStorage.setItem(`sudoku_time_${gameId}`, newTime.toString());
    }
  },

  toggleNoteMode: () => {
    set((state) => ({ noteMode: !state.noteMode }));
  },

  pauseGame: () => {
    analytics.trackSudokuPause();
    set({ isPaused: true });
    get().saveCurrentState();
  },

  resumeGame: () => {
    analytics.trackSudokuResume();
    set({ isPaused: false });
  },
}));