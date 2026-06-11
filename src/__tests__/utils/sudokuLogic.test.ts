describe('Sudoku Logic', () => {
  describe('isValidMove', () => {
    const createEmptyBoard = () => {
      return Array(9).fill(Array(9).fill({ value: 0, isFixed: false, notes: [] }));
    };

    it('should validate move in row', () => {
      const isValidRow = (board: any[][], row: number, col: number, num: number): boolean => {
        for (let x = 0; x < 9; x++) {
          if (x !== col && board[row][x].value === num) return false;
        }
        return true;
      };

      const board = createEmptyBoard();
      board[0][0] = { value: 5, isFixed: true, notes: [] };
      
      expect(isValidRow(board, 0, 1, 5)).toBe(false);
      expect(isValidRow(board, 0, 1, 3)).toBe(true);
    });

    it('should validate move in column', () => {
      const isValidColumn = (board: any[][], row: number, col: number, num: number): boolean => {
        for (let y = 0; y < 9; y++) {
          if (y !== row && board[y][col].value === num) return false;
        }
        return true;
      };

      const board = createEmptyBoard();
      board[0][0] = { value: 5, isFixed: true, notes: [] };
      
      expect(isValidColumn(board, 1, 0, 5)).toBe(false);
      expect(isValidColumn(board, 1, 0, 3)).toBe(true);
    });

    it('should validate move in 3x3 box', () => {
      const isValidBox = (board: any[][], row: number, col: number, num: number): boolean => {
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if ((boxRow + i !== row || boxCol + j !== col) && 
                board[boxRow + i][boxCol + j].value === num) {
              return false;
            }
          }
        }
        return true;
      };

      const board = createEmptyBoard();
      board[0][0] = { value: 5, isFixed: true, notes: [] };
      
      expect(isValidBox(board, 0, 1, 5)).toBe(false);
      expect(isValidBox(board, 0, 1, 3)).toBe(true);
    });
  });

  describe('checkComplete', () => {
    it('should return true when board is full', () => {
      const fullBoard = Array(9).fill(
        Array(9).fill({ value: 1, isFixed: false, notes: [] })
      );
      
      const isComplete = (board: any[][]): boolean => {
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            if (board[i][j].value === 0) return false;
          }
        }
        return true;
      };
      
      expect(isComplete(fullBoard)).toBe(true);
    });

    it('should return false when board has empty cells', () => {
      const incompleteBoard = Array(9).fill(
        Array(9).fill({ value: 0, isFixed: false, notes: [] })
      );
      incompleteBoard[0][0] = { value: 1, isFixed: false, notes: [] };
      
      const isComplete = (board: any[][]): boolean => {
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            if (board[i][j].value === 0) return false;
          }
        }
        return true;
      };
      
      expect(isComplete(incompleteBoard)).toBe(false);
    });
  });
});