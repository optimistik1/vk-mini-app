import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://91.227.68.143:7860/api/v1';

export const leaderboardApi = {
  getLeaderboard: async (limit: number = 10, offset: number = 0) => {
    const response = await axios.get(
      `${API_BASE_URL}/stats/leaderboard?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },

  getDailyLeaderboard: async (limit: number = 10) => {
    const response = await axios.get(
      `${API_BASE_URL}/stats/leaderboard/daily?limit=${limit}`
    );
    return response.data;
  },

  getWeeklyLeaderboard: async (limit: number = 10) => {
    const response = await axios.get(
      `${API_BASE_URL}/stats/leaderboard/weekly?limit=${limit}`
    );
    return response.data;
  },

  getUserStats: async (vkUserId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/stats/user/${vkUserId}`
    );
    return response.data;
  },
};