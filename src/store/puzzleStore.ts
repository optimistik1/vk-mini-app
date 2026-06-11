import { create } from 'zustand';
import { puzzleApi } from '../api/puzzleApi';
import { soundGenerator } from '../hooks/useSound';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PuzzlePiece {
  piece_id: number;
  placed: boolean;
  original_index: number;
}

interface PuzzleState {
  gameId: number | null;
  imageUrl: string;
  width: number;
  height: number;
  piecesRows: number;
  piecesCols: number;
  pieces: PuzzlePiece[];
  difficulty: Difficulty;
  category: string | null;
  selectedCategory: string | null;
  categories: string[];
  isComplete: boolean;
  isLoading: boolean;
  time: number;
  isPaused: boolean;
  isBoardReady: boolean;
  error: string | null;
}

interface PuzzleStore extends PuzzleState {
  newGame: (difficulty: Difficulty, forceNew?: boolean) => Promise<void>;
  loadGame: (gameId: number) => Promise<void>;
  placePiece: (pieceId: number, col: number, row: number) => Promise<void>;
  resetGame: () => Promise<void>;
  clearProgress: () => Promise<void>;
  shuffleUnplaced: () => Promise<void>;
  clearAllPieces: () => Promise<void>;
  incrementTime: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  saveCurrentState: () => Promise<void>;
  loadSavedGame: () => Promise<boolean>;
  forceNewGame: (difficulty: Difficulty, category?: string | null) => Promise<void>;
  saveTime: () => void;
  loadTime: () => number;
  loadCategories: () => Promise<void>;
  setSelectedCategory: (category: string | null) => void;
  resetGameState: () => void;
}

const checkComplete = (pieces: PuzzlePiece[]): boolean => {
  for (const piece of pieces) {
    if (!piece.placed) return false;
  }
  return true;
};

export const usePuzzleStore = create<PuzzleStore>((set, get) => ({
  gameId: null,
  imageUrl: '',
  width: 0,
  height: 0,
  piecesRows: 0,
  piecesCols: 0,
  pieces: [],
  difficulty: 'medium',
  category: null,
  selectedCategory: null,
  categories: [],
  isComplete: false,
  isLoading: false,
  time: 0,
  isPaused: false,
  isBoardReady: false,
  error: null,

  loadCategories: async () => {
    set({ isLoading: true }); 
    try {
      const categories = await puzzleApi.getCategories();
      set({ categories, isLoading: false });
      console.log('Categories loaded:', categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      set({ 
        categories: ['Аниме', 'Природа', 'Космос', 'Животные', 'Фантастика', 'Машины', 'Спорт', 'Еда', 'Супергерои', 'Мультфильмы', 'Игры'],
        isLoading: false
      });
    }
  },

  setSelectedCategory: (category: string | null) => {
    set({ selectedCategory: category });
    console.log('Selected category:', category);
  },

  saveTime: () => {
    const { gameId, time } = get();
    if (gameId) {
      localStorage.setItem(`puzzle_time_${gameId}`, time.toString());
    }
  },

  loadTime: () => {
    const { gameId } = get();
    if (gameId) {
      const savedTime = localStorage.getItem(`puzzle_time_${gameId}`);
      if (savedTime) {
        return parseInt(savedTime, 10);
      }
    }
    return 0;
  },

  saveCurrentState: async () => {
    const { gameId, pieces, isComplete, isBoardReady, difficulty, time, category } = get();
    if (!gameId || isComplete || !isBoardReady) return;
    
    try {
      await puzzleApi.saveState(gameId, pieces);
      localStorage.setItem('puzzle_game_id', gameId.toString());
      localStorage.setItem('puzzle_difficulty', difficulty);
      if (category) {
        localStorage.setItem('puzzle_category', category);
      }
      localStorage.setItem(`puzzle_time_${gameId}`, time.toString());
      console.log('Puzzle state saved');
    } catch (error) {
      console.error('Failed to save puzzle state:', error);
    }
  },

  loadSavedGame: async (): Promise<boolean> => {
    set({ isLoading: true });
    
    const savedGameId = localStorage.getItem('puzzle_game_id');
    const savedDifficulty = localStorage.getItem('puzzle_difficulty') as Difficulty | null;
    const savedCategory = localStorage.getItem('puzzle_category');
    
    if (!savedGameId) {
      console.log('No saved puzzle game ID found');
      set({ isLoading: false });
      return false;
    }
    
    try {
      const gameId = parseInt(savedGameId, 10);
      console.log('Loading saved puzzle game:', gameId);
      
      const stateData = await puzzleApi.loadState(gameId);
      
      if (stateData.has_saved_progress && stateData.current_state.length > 0 && !stateData.is_completed) {
        const loadedDifficulty = savedDifficulty || stateData.difficulty || 'medium';
        const loadedCategory = savedCategory || stateData.category || null;
        const savedTime = localStorage.getItem(`puzzle_time_${gameId}`);
        const loadedTime = savedTime ? parseInt(savedTime, 10) : 0;
        
        set({
          gameId: gameId,
          imageUrl: stateData.image_url,
          width: stateData.width,
          height: stateData.height,
          piecesRows: stateData.pieces_rows,
          piecesCols: stateData.pieces_cols,
          pieces: stateData.current_state,
          difficulty: loadedDifficulty,
          category: loadedCategory,
          isBoardReady: true,
          isComplete: stateData.is_completed || false,
          time: loadedTime,
          isLoading: false,
        });
        
        console.log('Saved puzzle game loaded');
        return true;
      } else {
        localStorage.removeItem('puzzle_game_id');
        localStorage.removeItem('puzzle_difficulty');
        localStorage.removeItem('puzzle_category');
        localStorage.removeItem(`puzzle_time_${gameId}`);
        set({ isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Failed to load saved puzzle game:', error);
      localStorage.removeItem('puzzle_game_id');
      localStorage.removeItem('puzzle_difficulty');
      localStorage.removeItem('puzzle_category');
      set({ isLoading: false });
      return false;
    }
  },

  forceNewGame: async (difficulty: Difficulty, category?: string | null) => {
    console.log('Force creating new puzzle game with difficulty:', difficulty, 'category:', category || 'random');
    
    set({ 
      isLoading: true, 
      time: 0, 
      isPaused: false, 
      isComplete: false, 
      isBoardReady: false, 
      error: null,
      imageUrl: '',
    });
    
    try {
      localStorage.removeItem('puzzle_game_id');
      localStorage.removeItem('puzzle_difficulty');
      localStorage.removeItem('puzzle_category');
      
      const data = await puzzleApi.createGame(difficulty, category || undefined);
      
      set({
        gameId: data.game_id,
        imageUrl: data.image_url,
        width: data.width,
        height: data.height,
        piecesRows: data.pieces_rows,
        piecesCols: data.pieces_cols,
        difficulty: difficulty,
        category: data.category || category || null,
        isLoading: false,
        error: null,
        time: 0,
        isBoardReady: true,
        isComplete: false,
      });
      
      localStorage.setItem('puzzle_game_id', data.game_id.toString());
      localStorage.setItem('puzzle_difficulty', difficulty);
      if (data.category || category) {
        localStorage.setItem('puzzle_category', data.category || category || '');
      }
      localStorage.setItem(`puzzle_time_${data.game_id}`, '0');
      
      await get().loadGame(data.game_id);
      
    } catch (error: any) {
      console.error('Failed to create puzzle game:', error);
      set({ 
        isLoading: false, 
        error: 'Не удалось создать пазл. Попробуйте ещё раз или выберите другую сложность.',
        isBoardReady: false
      });
    }
  },

  newGame: async (difficulty: Difficulty, forceNew: boolean = false) => {
    if (forceNew) {
      await get().forceNewGame(difficulty, get().selectedCategory);
      return;
    }
    
    set({ isLoading: true, time: 0, isPaused: false, isComplete: false, isBoardReady: false, error: null });
    
    try {
      const hasSavedGame = await get().loadSavedGame();
      
      if (hasSavedGame) {
        console.log('Loaded saved puzzle game, skipping creation');
        set({ isLoading: false });
        return;
      }
      
      set({ isLoading: false });
      
    } catch (error: any) {
      console.error('Failed to check saved game:', error);
      set({ isLoading: false });
    }
  },

  loadGame: async (gameId: number) => {
    set({ isLoading: true });
    
    try {
      const data = await puzzleApi.loadState(gameId);
      const { piecesRows, piecesCols } = get();
      const totalPieces = piecesRows * piecesCols;
      
      if (data.has_saved_progress && data.current_state.length > 0) {
        console.log('Loading saved puzzle state:', data.current_state.length, 'pieces');
        set({ pieces: data.current_state });
        const isGameComplete = checkComplete(data.current_state);
        if (isGameComplete) {
          console.log('🎉 Saved game is already complete!');
          set({ isComplete: true, isBoardReady: false, isLoading: false });
          localStorage.removeItem('puzzle_game_id');
          localStorage.removeItem('puzzle_difficulty');
          localStorage.removeItem('puzzle_category');
          return;
        }
      } else {
        const indices = Array.from({ length: totalPieces }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        const pieces: PuzzlePiece[] = [];
        for (let i = 0; i < totalPieces; i++) {
          pieces.push({
            piece_id: i,
            placed: false,
            original_index: indices[i],
          });
        }
        set({ pieces });
      }
      
      set({ isComplete: data.is_completed, isLoading: false });
      
    } catch (error) {
      console.error('Failed to load puzzle state:', error);
      set({ isLoading: false });
    }
  },

  placePiece: async (pieceId: number, col: number, row: number) => {
    const { pieces, gameId, piecesCols, isComplete, isPaused, isBoardReady } = get();
    
    if (isComplete || isPaused || !isBoardReady) return;
    
    const targetIndex = row * piecesCols + col;
    const piece = pieces.find(p => p.piece_id === pieceId);
    
    if (!piece || piece.placed) return;
    
    if (piece.original_index === targetIndex) {
      const newPieces = pieces.map(p =>
        p.piece_id === pieceId ? { ...p, placed: true } : p
      );
      set({ pieces: newPieces });
      
      if (gameId) {
        await puzzleApi.saveState(gameId, newPieces);
      }
      
      const isGameComplete = checkComplete(newPieces);
      
      if (isGameComplete) {
        if (gameId) {
          try {
            await puzzleApi.completeGame(gameId);
            console.log('Game completion saved to server');
          } catch (error) {
            console.error('Failed to complete game on server:', error);
          }
        }
        
        localStorage.removeItem('puzzle_game_id');
        localStorage.removeItem('puzzle_difficulty');
        localStorage.removeItem('puzzle_category');
        
        set({ 
          isComplete: true, 
          isBoardReady: false,
          isPaused: true
        });
        
        console.log('State updated: isComplete = true');
      }
    } else {
      soundGenerator.playError();
    }
  },

  shuffleUnplaced: async () => {
    const { pieces, gameId, isComplete, isPaused, isBoardReady } = get();
    if (isComplete || isPaused || !isBoardReady) return;
    
    set({ isLoading: true });
    
    const placedPieces = pieces.filter(p => p.placed);
    const unplacedPieces = pieces.filter(p => !p.placed);
    
    if (unplacedPieces.length === 0) {
      set({ isLoading: false });
      return;
    }
    
    const shuffledUnplaced = [...unplacedPieces];
    for (let i = shuffledUnplaced.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledUnplaced[i], shuffledUnplaced[j]] = [shuffledUnplaced[j], shuffledUnplaced[i]];
    }
    
    const newPieces = [...placedPieces, ...shuffledUnplaced];
    set({ pieces: newPieces });
    
    if (gameId) {
      await puzzleApi.saveState(gameId, newPieces);
    }
    
    set({ isLoading: false });
  },

  clearAllPieces: async () => {
    const { pieces, gameId, isComplete, isPaused, isBoardReady } = get();
    if (isComplete || isPaused || !isBoardReady) return;
    
    set({ isLoading: true });
    
    const resetPieces = pieces.map(piece => ({
      ...piece,
      placed: false,
    }));
    
    for (let i = resetPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [resetPieces[i], resetPieces[j]] = [resetPieces[j], resetPieces[i]];
    }
    
    set({ pieces: resetPieces });
    
    if (gameId) {
      await puzzleApi.saveState(gameId, resetPieces);
    }
    
    set({ isLoading: false });
  },

  resetGame: async () => {
    const { gameId, difficulty, selectedCategory } = get();
    
    set({ isLoading: true });
    
    if (gameId) {
      try {
        await puzzleApi.clearState(gameId);
      } catch (error) {
        console.error('Failed to clear puzzle state:', error);
      }
    }
    
    localStorage.removeItem('puzzle_game_id');
    localStorage.removeItem('puzzle_difficulty');
    localStorage.removeItem('puzzle_category');
    
    await get().forceNewGame(difficulty, selectedCategory);
    set({ isLoading: false });
  },

  clearProgress: async () => {
    const { gameId, difficulty, selectedCategory } = get();
    
    set({ isLoading: true });
    
    if (gameId) {
      try {
        await puzzleApi.clearState(gameId);
      } catch (error) {
        console.error('Failed to clear puzzle state:', error);
      }
    }
    
    localStorage.removeItem('puzzle_game_id');
    localStorage.removeItem('puzzle_difficulty');
    localStorage.removeItem('puzzle_category');
    
    await get().forceNewGame(difficulty, selectedCategory);
    set({ isLoading: false });
  },

  incrementTime: () => {
    const { isComplete, isPaused, isBoardReady, gameId, time } = get();
    if (isBoardReady && !isComplete && !isPaused) {
      const newTime = time + 1;
      set({ time: newTime });
      if (gameId) {
        localStorage.setItem(`puzzle_time_${gameId}`, newTime.toString());
      }
    }
  },

  pauseGame: () => {
    set({ isPaused: true });
    get().saveCurrentState();
  },

  resumeGame: () => {
    set({ isPaused: false });
  },

  resetGameState: () => {
    console.log('Resetting game state');
    set({
      gameId: null,
      imageUrl: '',
      width: 0,
      height: 0,
      piecesRows: 0,
      piecesCols: 0,
      pieces: [],
      difficulty: 'medium',
      category: null,
      isComplete: false,
      isLoading: false,
      time: 0,
      isPaused: false,
      isBoardReady: false,
      error: null,
    });
    localStorage.removeItem('puzzle_game_id');
    localStorage.removeItem('puzzle_difficulty');
    localStorage.removeItem('puzzle_category');
  },
}));