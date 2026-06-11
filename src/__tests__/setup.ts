import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

window.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  load: jest.fn(),
  volume: 1,
  currentTime: 0,
  src: '',
})) as any;

window.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    type: '',
    frequency: { value: 0 },
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 0, exponentialRampToValueAtTime: jest.fn() },
  })),
  destination: {},
  state: 'running',
  resume: jest.fn(),
  close: jest.fn(),
})) as any;

jest.mock('@vkontakte/vk-bridge', () => ({
  send: jest.fn(),
  isWebView: jest.fn(() => false),
}));

jest.mock('../api/sudokuApi', () => ({
  sudokuApi: {
    createGame: jest.fn().mockResolvedValue({
      game_id: 123,
      puzzle: Array(9).fill(Array(9).fill(0)),
      difficulty: 'medium',
    }),
    makeMove: jest.fn().mockResolvedValue({ valid: true, success: true }),
    getHint: jest.fn().mockResolvedValue({ row: 0, col: 0, value: 5 }),
    checkSolution: jest.fn().mockResolvedValue({ is_correct: true }),
    saveState: jest.fn().mockResolvedValue({}),
    loadState: jest.fn().mockResolvedValue({
      has_saved_progress: false,
      current_board: null,
      is_completed: false,
    }),
    getUserStats: jest.fn().mockResolvedValue({
      skill_level: 'beginner',
      total_games_all_time: 0,
      total_completed_all_time: 0,
      total_win_rate_all_time: 0,
      recent_win_rate: 0,
      recent_games_count: 0,
      promotion_info: {},
      allowed_difficulties: ['easy'],
    }),
  },
}));

jest.mock('../api/puzzleApi', () => ({
  puzzleApi: {
    createGame: jest.fn().mockResolvedValue({
      game_id: 123,
      image_url: 'test.jpg',
      width: 400,
      height: 400,
      pieces_rows: 3,
      pieces_cols: 3,
    }),
    loadState: jest.fn().mockResolvedValue({
      has_saved_progress: false,
      current_state: [],
      is_completed: false,
      image_url: 'test.jpg',
      width: 400,
      height: 400,
      pieces_rows: 3,
      pieces_cols: 3,
    }),
    saveState: jest.fn().mockResolvedValue({}),
    clearState: jest.fn().mockResolvedValue({}),
    completeGame: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../hooks/useSound', () => ({
  useSound: () => ({
    playClick: jest.fn(),
    playSuccess: jest.fn(),
    playError: jest.fn(),
    playVictory: jest.fn(),
    playDrag: jest.fn(),
    playPlace: jest.fn(),
    setEnabled: jest.fn(),
  }),
  soundGenerator: {
    playClick: jest.fn(),
    playSuccess: jest.fn(),
    playError: jest.fn(),
    playVictory: jest.fn(),
    playDrag: jest.fn(),
    playPlace: jest.fn(),
    setEnabled: jest.fn(),
  },
}));

jest.mock('@vkontakte/vk-mini-apps-router', () => ({
  useRouteNavigator: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useActiveVkuiLocation: () => ({ panel: 'menu' }),
  RouterProvider: ({ children }: { children: React.ReactNode }) => children,
  createHashRouter: jest.fn(),
  createPanel: jest.fn(),
  createRoot: jest.fn(),
  createView: jest.fn(),
  RoutesConfig: { create: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});