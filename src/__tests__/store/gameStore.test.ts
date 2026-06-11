import { useGameStore } from '../../store/gameStore';
import { sudokuApi } from '../../api/sudokuApi';

const mockBoard = Array(9).fill(Array(9).fill({ value: 0, isFixed: false, notes: [] }));

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
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
      playerSkill: 'beginner',
      gamesPlayed: 0,
      completedGames: 0,
      winRate: 0,
      recentWinRate: 0,
      recentGamesCount: 0,
      promotionInfo: {},
      allowedDifficulties: ['easy'],
    });
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('selectCell', () => {
    it('should select a cell when game is active', () => {
      useGameStore.setState({ 
        isBoardReady: true, 
        isComplete: false, 
        isGameOver: false, 
        isPaused: false,
        board: mockBoard,
      });
      
      useGameStore.getState().selectCell(2, 3);
      
      expect(useGameStore.getState().selectedRow).toBe(2);
      expect(useGameStore.getState().selectedCol).toBe(3);
    });

    it('should not select cell when game is paused', () => {
      useGameStore.setState({ 
        isBoardReady: true, 
        isComplete: false, 
        isGameOver: false, 
        isPaused: true,
        board: mockBoard,
      });
      
      useGameStore.getState().selectCell(2, 3);
      
      expect(useGameStore.getState().selectedRow).toBeNull();
      expect(useGameStore.getState().selectedCol).toBeNull();
    });

    it('should not select cell when game is complete', () => {
      useGameStore.setState({ 
        isBoardReady: true, 
        isComplete: true, 
        isGameOver: false, 
        isPaused: false,
        board: mockBoard,
      });
      
      useGameStore.getState().selectCell(2, 3);
      
      expect(useGameStore.getState().selectedRow).toBeNull();
    });

    it('should not select cell when game is over', () => {
      useGameStore.setState({ 
        isBoardReady: true, 
        isComplete: false, 
        isGameOver: true, 
        isPaused: false,
        board: mockBoard,
      });
      
      useGameStore.getState().selectCell(2, 3);
      
      expect(useGameStore.getState().selectedRow).toBeNull();
    });
  });

  describe('toggleNoteMode', () => {
    it('should toggle note mode', () => {
      expect(useGameStore.getState().noteMode).toBe(false);
      
      useGameStore.getState().toggleNoteMode();
      expect(useGameStore.getState().noteMode).toBe(true);
      
      useGameStore.getState().toggleNoteMode();
      expect(useGameStore.getState().noteMode).toBe(false);
    });
  });

  describe('pauseGame and resumeGame', () => {
    it('should pause game', () => {
      useGameStore.getState().pauseGame();
      expect(useGameStore.getState().isPaused).toBe(true);
    });

    it('should resume game', () => {
      useGameStore.setState({ isPaused: true });
      useGameStore.getState().resumeGame();
      expect(useGameStore.getState().isPaused).toBe(false);
    });
  });

  describe('incrementTime', () => {
    beforeEach(() => {
      useGameStore.setState({ 
        isBoardReady: true, 
        isComplete: false, 
        isGameOver: false, 
        isPaused: false,
        time: 10,
        gameId: 123,
      });
    });

    it('should increment time when game is active', () => {
      useGameStore.getState().incrementTime();
      expect(useGameStore.getState().time).toBe(11);
    });

    it('should not increment time when game is paused', () => {
      useGameStore.setState({ isPaused: true });
      useGameStore.getState().incrementTime();
      expect(useGameStore.getState().time).toBe(10);
    });

    it('should save time to localStorage', () => {
      const setItemSpy = jest.spyOn(localStorage, 'setItem');
      
      useGameStore.getState().incrementTime();
      
      expect(setItemSpy).toHaveBeenCalled();
      setItemSpy.mockRestore();
    });
  });

  describe('newGame', () => {
    it('should create a new game', async () => {
      const mockGameData = {
        game_id: 456,
        puzzle: Array(9).fill(Array(9).fill(0)),
        difficulty: 'medium',
      };
      (sudokuApi.createGame as jest.Mock).mockResolvedValue(mockGameData);

      await useGameStore.getState().newGame('medium', true);

      expect(useGameStore.getState().gameId).toBe(456);
      expect(useGameStore.getState().difficulty).toBe('medium');
      expect(useGameStore.getState().isBoardReady).toBe(true);
    });
  });
});