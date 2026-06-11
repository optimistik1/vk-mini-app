import { usePuzzleStore } from '../../store/puzzleStore';
import { puzzleApi } from '../../api/puzzleApi';

describe('puzzleStore', () => {
  beforeEach(() => {
    usePuzzleStore.setState({
      gameId: null,
      imageUrl: '',
      width: 0,
      height: 0,
      piecesRows: 0,
      piecesCols: 0,
      pieces: [],
      difficulty: 'medium',
      isComplete: false,
      isLoading: false,
      time: 0,
      isPaused: false,
      isBoardReady: false,
      error: null,
    });
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('placePiece', () => {
    const mockPieces = [
      { piece_id: 0, placed: false, original_index: 0 },
      { piece_id: 1, placed: false, original_index: 1 },
      { piece_id: 2, placed: false, original_index: 2 },
      { piece_id: 3, placed: false, original_index: 3 },
    ];

    beforeEach(() => {
      usePuzzleStore.setState({
        pieces: mockPieces,
        piecesCols: 2,
        isBoardReady: true,
        isComplete: false,
        isPaused: false,
        gameId: 123,
      });
    });

    it('should place piece on correct position', async () => {
      await usePuzzleStore.getState().placePiece(0, 0, 0);
      
      const pieces = usePuzzleStore.getState().pieces;
      expect(pieces[0].placed).toBe(true);
    });

    it('should not place piece on wrong position', async () => {
      await usePuzzleStore.getState().placePiece(0, 1, 1);
      
      const pieces = usePuzzleStore.getState().pieces;
      expect(pieces[0].placed).toBe(false);
    });

    it('should not place piece when game is paused', async () => {
      usePuzzleStore.setState({ isPaused: true });
      
      await usePuzzleStore.getState().placePiece(0, 0, 0);
      
      const pieces = usePuzzleStore.getState().pieces;
      expect(pieces[0].placed).toBe(false);
    });

    it('should not place piece when game is complete', async () => {
      usePuzzleStore.setState({ isComplete: true });
      
      await usePuzzleStore.getState().placePiece(0, 0, 0);
      
      const pieces = usePuzzleStore.getState().pieces;
      expect(pieces[0].placed).toBe(false);
    });
  });

  describe('resetGame', () => {
    it('should reset game', async () => {
      (puzzleApi.clearState as jest.Mock).mockResolvedValue({});
      (puzzleApi.createGame as jest.Mock).mockResolvedValue({
        game_id: 456,
        image_url: 'test.jpg',
        width: 400,
        height: 400,
        pieces_rows: 3,
        pieces_cols: 3,
      });
      
      usePuzzleStore.setState({
        gameId: 123,
        difficulty: 'medium',
      });
      
      const removeItemSpy = jest.spyOn(localStorage, 'removeItem');
      
      await usePuzzleStore.getState().resetGame();
      
      expect(removeItemSpy).toHaveBeenCalledWith('puzzle_game_id');
      removeItemSpy.mockRestore();
    });
  });

  describe('clearProgress', () => {
    it('should clear progress', async () => {
      (puzzleApi.clearState as jest.Mock).mockResolvedValue({});
      (puzzleApi.createGame as jest.Mock).mockResolvedValue({
        game_id: 456,
        image_url: 'test.jpg',
        width: 400,
        height: 400,
        pieces_rows: 3,
        pieces_cols: 3,
      });
      
      usePuzzleStore.setState({
        gameId: 123,
        difficulty: 'medium',
      });
      
      const removeItemSpy = jest.spyOn(localStorage, 'removeItem');
      
      await usePuzzleStore.getState().clearProgress();
      
      expect(removeItemSpy).toHaveBeenCalledWith('puzzle_game_id');
      removeItemSpy.mockRestore();
    });
  });

  describe('pauseGame and resumeGame', () => {
    it('should pause game', () => {
      usePuzzleStore.getState().pauseGame();
      expect(usePuzzleStore.getState().isPaused).toBe(true);
    });

    it('should resume game', () => {
      usePuzzleStore.setState({ isPaused: true });
      usePuzzleStore.getState().resumeGame();
      expect(usePuzzleStore.getState().isPaused).toBe(false);
    });
  });

  describe('incrementTime', () => {
    beforeEach(() => {
      usePuzzleStore.setState({
        isBoardReady: true,
        isComplete: false,
        isPaused: false,
        time: 10,
        gameId: 123,
      });
    });

    it('should increment time when game is active', () => {
      usePuzzleStore.getState().incrementTime();
      expect(usePuzzleStore.getState().time).toBe(11);
    });

    it('should not increment time when game is paused', () => {
      usePuzzleStore.setState({ isPaused: true });
      usePuzzleStore.getState().incrementTime();
      expect(usePuzzleStore.getState().time).toBe(10);
    });

    it('should save time to localStorage', () => {
      const setItemSpy = jest.spyOn(localStorage, 'setItem');
      
      usePuzzleStore.getState().incrementTime();
      
      expect(setItemSpy).toHaveBeenCalled();
      setItemSpy.mockRestore();
    });
  });
});