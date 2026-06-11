import { FC, useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import './SudokuBoard.css';

export const SudokuBoard: FC = () => {
  const board = useGameStore((state) => state.board);
  const selectedRow = useGameStore((state) => state.selectedRow);
  const selectedCol = useGameStore((state) => state.selectedCol);
  const selectCell = useGameStore((state) => state.selectCell);
  const lastHintRow = useGameStore((state) => state.lastHintRow);
  const lastHintCol = useGameStore((state) => state.lastHintCol);
  
  const [completedBox, setCompletedBox] = useState<number | null>(null);
  const [hintCell, setHintCell] = useState<{ row: number; col: number } | null>(null);
  
  const prevBoxStatesRef = useRef<boolean[]>(Array(9).fill(false));

  useEffect(() => {
    if (!board.length) return;
    
    const currentBoxStates = Array(9).fill(false);
    
    for (let box = 0; box < 9; box++) {
      const startRow = Math.floor(box / 3) * 3;
      const startCol = (box % 3) * 3;
      let allFilled = true;
      
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[startRow + i][startCol + j].value === 0) {
            allFilled = false;
            break;
          }
        }
        if (!allFilled) break;
      }
      currentBoxStates[box] = allFilled;
    }
    
    let justCompletedBox: number | null = null;
    for (let box = 0; box < 9; box++) {
      if (currentBoxStates[box] && !prevBoxStatesRef.current[box]) {
        justCompletedBox = box;
        break;
      }
    }
    
    if (justCompletedBox !== null) {
      setCompletedBox(justCompletedBox);
      setTimeout(() => {
        setCompletedBox(null);
      }, 800);
    }
    
    prevBoxStatesRef.current = [...currentBoxStates];
  }, [board]);

  useEffect(() => {
    if (lastHintRow !== null && lastHintCol !== null) {
      setHintCell({ row: lastHintRow, col: lastHintCol });
      setTimeout(() => setHintCell(null), 1500);
    }
  }, [lastHintRow, lastHintCol]);

  if (!board.length) {
    return <div className="sudoku-loading">Загрузка...</div>;
  }

  const isSelected = (row: number, col: number): boolean => {
    return selectedRow === row && selectedCol === col;
  };

  const isHighlighted = (row: number, col: number): boolean => {
    if (selectedRow === null || selectedCol === null) return false;
    if (isSelected(row, col)) return false;
    
    if (row === selectedRow) return true;
    if (col === selectedCol) return true;
    if (Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
        Math.floor(col / 3) === Math.floor(selectedCol / 3)) return true;
    
    return false;
  };

  const isBoxCompleted = (row: number, col: number): boolean => {
    const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    return completedBox === boxIndex;
  };

  const isHintCellCheck = (row: number, col: number): boolean => {
    return hintCell !== null && hintCell.row === row && hintCell.col === col;
  };

  const renderCell = (value: number, isFixed: boolean, notes: number[], row: number, col: number) => {
    if (value !== 0) {
      return <span className={`sudoku-cell-value ${!isFixed && isHintCellCheck(row, col) ? 'hint-value' : ''}`}>{value}</span>;
    }
    if (notes.length > 0) {
      const noteGrid = Array(9).fill(null);
      notes.forEach(n => { noteGrid[n - 1] = n; });
      return (
        <div className="sudoku-notes">
          {noteGrid.map((n, i) => (
            <span key={i} className="sudoku-note">{n || ''}</span>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sudoku-wrapper">
      <div className="sudoku-board">
        {board.map((row, i) => (
          <div key={i} className="sudoku-row">
            {row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`sudoku-cell 
                  ${isSelected(i, j) ? 'selected' : ''} 
                  ${cell.isFixed ? 'fixed' : ''}
                  ${isHighlighted(i, j) ? 'highlighted' : ''}
                  ${isBoxCompleted(i, j) ? 'box-complete' : ''}
                  ${isHintCellCheck(i, j) ? 'hint-cell' : ''}
                  ${(i + 1) % 3 === 0 && i !== 8 ? 'border-bottom' : ''}
                  ${(j + 1) % 3 === 0 && j !== 8 ? 'border-right' : ''}
                `}
                onClick={() => selectCell(i, j)}
              >
                {renderCell(cell.value, cell.isFixed, cell.notes, i, j)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};