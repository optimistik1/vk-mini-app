import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://91.227.68.143:7860/api/v1';

const getVkUserId = (): string => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('vk_user_id');
    if (userId) return userId;
  } catch (e) {}
  return '1';
};

const api = axios.create({
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const retryRequest = async (fn: () => Promise<any>, retries = 5, delay = 5000): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    console.log(`Retrying... ${retries} attempts left`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay);
  }
};

export const puzzleApi = {
  
  getCategories: async (): Promise<string[]> => {
    const response = await api.get(`${API_BASE_URL}/games/puzzle/themes/categories`);
    return response.data.categories || [];
  },

  getThemesByCategory: async (category: string): Promise<string[]> => {
    const response = await api.get(`${API_BASE_URL}/games/puzzle/themes/by-category?category=${encodeURIComponent(category)}`);
    return response.data.themes || [];
  },

  getRandomTheme: async (): Promise<{ theme: string; category: string }> => {
    const response = await api.get(`${API_BASE_URL}/games/puzzle/themes/random`);
    return response.data;
  },

  getPopularThemes: async (limit: number = 10): Promise<string[]> => {
    const response = await api.get(`${API_BASE_URL}/games/puzzle/themes/popular?limit=${limit}`);
    return response.data.themes || [];
  },

  getThemesCount: async (): Promise<number> => {
    const response = await api.get(`${API_BASE_URL}/games/puzzle/themes/count`);
    return response.data.count || 0;
  },

  getAllThemes: async (): Promise<{ theme: string; category: string }[]> => {
    const response = await api.get(`${API_BASE_URL}/games/puzzle/themes`);
    return response.data.themes || [];
  },

  
  createGame: async (difficulty: string, category?: string) => {
    const vkUserId = getVkUserId();
    console.log('Calling API with:', { difficulty, category, vkUserId });
    
    let url = `${API_BASE_URL}/games/puzzle/new?vk_user_id=${vkUserId}&difficulty=${difficulty}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    return retryRequest(async () => {
      const response = await api.post(url);
      console.log('API Response FULL:', JSON.stringify(response.data, null, 2));
      return response.data;
    }, 5, 5000);
  },

  loadState: async (gameId: number) => {
    const vkUserId = getVkUserId();
    const response = await api.get(
      `${API_BASE_URL}/games/puzzle/${gameId}/load-state?vk_user_id=${vkUserId}`
    );
    return response.data;
  },

  saveState: async (gameId: number, piecesState: any[]) => {
    const vkUserId = getVkUserId();
    const response = await api.post(
      `${API_BASE_URL}/games/puzzle/${gameId}/save-state?vk_user_id=${vkUserId}`,
      { pieces_state: piecesState }
    );
    return response.data;
  },

  clearState: async (gameId: number) => {
    const vkUserId = getVkUserId();
    const response = await api.delete(
      `${API_BASE_URL}/games/puzzle/${gameId}/clear-state?vk_user_id=${vkUserId}`
    );
    return response.data;
  },

  completeGame: async (gameId: number) => {
    const vkUserId = getVkUserId();
    const response = await api.post(
      `${API_BASE_URL}/games/puzzle/${gameId}/complete?vk_user_id=${vkUserId}`
    );
    return response.data;
  },
};