import {
  createHashRouter,
  createPanel,
  createRoot,
  createView,
  RoutesConfig,
} from '@vkontakte/vk-mini-apps-router';

export const DEFAULT_ROOT = 'default_root';
export const DEFAULT_VIEW = 'default_view';

export const DEFAULT_VIEW_PANELS = {
  MENU: 'menu',
  SUDOKU: 'sudoku',
  PUZZLE: 'puzzle',
  LEADERBOARD: 'leaderboard',
} as const;

export const routes = RoutesConfig.create([
  createRoot(DEFAULT_ROOT, [
    createView(DEFAULT_VIEW, [
      createPanel(DEFAULT_VIEW_PANELS.MENU, '/', []),
      createPanel(DEFAULT_VIEW_PANELS.SUDOKU, '/sudoku', []),
      createPanel(DEFAULT_VIEW_PANELS.PUZZLE, '/puzzle', []),
      createPanel(DEFAULT_VIEW_PANELS.LEADERBOARD, '/leaderboard', []),
    ]),
  ]),
]);

export const router = createHashRouter(routes.getRoutes());