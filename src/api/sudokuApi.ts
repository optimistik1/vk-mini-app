import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://91.227.68.143:7860/api/v1';

const getVkUserId = (): string => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('vk_user_id');
    if (userId && userId !== '0' && userId !== 'null' && userId !== '') {
      return userId;
    }
  } catch (e) {}
  
  const savedId = localStorage.getItem('vk_dev_user_id');
  if (savedId) return savedId;
  
  const permanentId = 'dev_user_permanent';
  localStorage.setItem('vk_dev_user_id', permanentId);
  return permanentId;
};

const api = axios.create({
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface MoveResponse {
  success: boolean;
  valid: boolean;
  message: string;
  row: number;
  col: number;
  value: number | null;
  correct_value?: number; 
  cleared: boolean;
  cells_filled: number;
  cells_total: number;
  is_completed: boolean;
}

export interface HintResponse {
  row: number;
  col: number;
  value: number;
  message: string;
}

export interface CheckResponse {
  is_correct: boolean;
  message: string;
}

export const sudokuApi = {
  createGame: async (difficulty: string) => {
    const vkUserId = getVkUserId();
    const response = await api.post(
      `${API_BASE_URL}/games/sudoku/new?vk_user_id=${vkUserId}&difficulty=${difficulty}`
    );
    return response.data;
  },

  makeMove: async (gameId: number, row: number, col: number, value: number): Promise<MoveResponse> => {
    const vkUserId = getVkUserId();
    const response = await api.post(
      `${API_BASE_URL}/games/sudoku/${gameId}/move?row=${row}&col=${col}&value=${value}&vk_user_id=${vkUserId}`
    );
    return response.data;
  },

  getHint: async (gameId: number): Promise<HintResponse> => {
    const vkUserId = getVkUserId();
    const response = await api.post(
      `${API_BASE_URL}/games/sudoku/${gameId}/hint?vk_user_id=${vkUserId}`
    );
    return response.data;
  },

  checkSolution: async (gameId: number): Promise<CheckResponse> => {
    const vkUserId = getVkUserId();
    const response = await api.post(
      `${API_BASE_URL}/games/sudoku/${gameId}/check?vk_user_id=${vkUserId}`
    );
    return response.data;
  },

  saveState: async (gameId: number, currentBoard: number[][]) => {
    const vkUserId = getVkUserId();
    const response = await api.post(
      `${API_BASE_URL}/games/sudoku/${gameId}/save-state?vk_user_id=${vkUserId}`,
      { current_board: currentBoard }
    );
    return response.data;
  },

  loadState: async (gameId: number) => {
    const vkUserId = getVkUserId();
    const response = await api.get(
      `${API_BASE_URL}/games/sudoku/${gameId}/load-state?vk_user_id=${vkUserId}`
    );
    return response.data;
  },

  clearState: async (gameId: number) => {
    const vkUserId = getVkUserId();
    const response = await api.delete(
      `${API_BASE_URL}/games/sudoku/${gameId}/clear-state?vk_user_id=${vkUserId}`
    );
    return response.data;
  },

  getUserGames: async () => {
    const vkUserId = getVkUserId();
    const response = await api.get(
      `${API_BASE_URL}/games/sudoku/user/games?vk_user_id=${vkUserId}&limit=1&include_completed=false`
    );
    return response.data;
  },

  getUserStats: async () => {
    const vkUserId = getVkUserId();
    const response = await api.get(
      `${API_BASE_URL}/stats/user/${vkUserId}`
    );
    return response.data;
  },
};