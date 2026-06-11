import { FC } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSound } from '../hooks/useSound';
import { analytics } from '../utils/analytics';

export const NumberPad: FC = () => {
  const setNumber = useGameStore((state) => state.setNumber);
  const clearCell = useGameStore((state) => state.clearCell);
  const noteMode = useGameStore((state) => state.noteMode);
  const board = useGameStore((state) => state.board);
  const isComplete = useGameStore((state) => state.isComplete);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const { playClick } = useSound();

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const isNumberFullyPlaced = (num: number): boolean => {
    if (!board.length) return false;
    
    for (let box = 0; box < 9; box++) {
      const startRow = Math.floor(box / 3) * 3;
      const startCol = (box % 3) * 3;
      let foundInBox = false;
      
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[startRow + i][startCol + j].value === num) {
            foundInBox = true;
            break;
          }
        }
        if (foundInBox) break;
      }
      
      if (!foundInBox) return false;
    }
    
    return true;
  };

  const isBoardFull = (): boolean => {
    if (!board.length) return false;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j].value === 0) return false;
      }
    }
    return true;
  };

  const boardFull = isBoardFull();

  const handleNumberClick = (num: number) => {
    playClick();
    analytics.trackSudokuMoveMade();
    setNumber(num);
  };

  const handleClearClick = () => {
    playClick();
    setNumber(0); // Это будет обработано как очистка
    clearCell();
  };

  if (isComplete || isGameOver || boardFull) {
    return null;
  }

  return (
    <div className="numberpad card">
      <div className="numberpad-grid">
        {numbers.map(num => {
          const isFullyPlaced = isNumberFullyPlaced(num);
          return (
            <button
              key={num}
              className="numberpad-btn"
              onClick={() => handleNumberClick(num)}
              disabled={isFullyPlaced}
              style={{ opacity: isFullyPlaced ? 0.4 : 1 }}
              aria-label={`Цифра ${num}`}
            >
              {num}
            </button>
          );
        })}
        <button
          className="numberpad-btn clear"
          onClick={handleClearClick}
          aria-label="Очистить ячейку"
        >
          ⌫
        </button>
      </div>
    </div>
  );
};