import { Difficulty } from '../store/gameStore';

export type { Difficulty };

export interface Cell {
  value: number;
  isFixed: boolean;
  isSelected: boolean;
  notes: number[];
}

export interface GameState {
  board: Cell[][];
  solution: number[][] | null;
  gameId: string | null;
  difficulty: Difficulty;
  mistakes: number;
  maxMistakes: number;
  time: number;
  isPlaying: boolean;
  isPaused: boolean;
  isComplete: boolean;
  selectedCell: { row: number; col: number } | null;
  isLoading: boolean;
  noteMode: boolean;
}

export interface ApiGameResponse {
  game_id?: string;
  id?: string;
  puzzle?: number[][];
  board?: number[][];
  solution?: number[][];
  difficulty?: Difficulty;
}

export interface ApiMoveResponse {
  valid: boolean;
  mistake?: boolean;
  completed?: boolean;
  message?: string;
}

export interface ApiHintResponse {
  hint: {
    row: number;
    col: number;
    value: number;
  };
  message: string;
}

export interface ApiGameStateResponse {
  game_id: string;
  board: number[][];
  mistakes: number;
  completed: boolean;
}