import { FC, useEffect, useState } from 'react';
import { Panel, PanelHeader, Spinner, Tabs, TabsItem } from '@vkontakte/vkui';
import { Icon28CupOutline } from '@vkontakte/icons';
import { leaderboardApi } from '../api/leaderboardApi';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import { useThemeStore } from '../store/themeStore';
import { useSound } from '../hooks/useSound';
import { analytics } from '../utils/analytics';
import { ThemeToggle } from '../components/ThemeToggle';
import { BackToSudoku } from '../components/BackToSudoku';
import { StarsOnlyBackground } from '../components/StarsOnlyBackground';
import './Leaderboard.css';

interface LeaderboardProps {
  id: string;
}

interface LeaderboardEntry {
  rank: number;
  vk_user_id: string;
  username: string;
  rating: number;
  games_played: number;
  sudoku_games: number;
  puzzle_games: number;
}

interface DailyEntry {
  vk_user_id: string;
  username: string;
  wins_today: number;
  sudoku_wins: number;
  puzzle_wins: number;
}

interface WeeklyEntry {
  vk_user_id: string;
  username: string;
  wins_weekly: number;
}

type TabType = 'all_time' | 'daily' | 'weekly';

export const Leaderboard: FC<LeaderboardProps> = ({ id }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all_time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<DailyEntry[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<WeeklyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const { theme } = useThemeStore();
  const { playClick } = useSound();
  const isLightTheme = theme === 'light';

  useEffect(() => {
    analytics.trackLeaderboardViewed(activeTab);
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'all_time') {
        const data = await leaderboardApi.getLeaderboard(50, 0);
        setLeaderboard(data.leaderboard || []);
        setTotalUsers(data.total || 0);
      } else if (activeTab === 'daily') {
        const data = await leaderboardApi.getDailyLeaderboard(50);
        setDailyLeaderboard(data || []);
      } else if (activeTab === 'weekly') {
        const data = await leaderboardApi.getWeeklyLeaderboard(50);
        setWeeklyLeaderboard(data || []);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      analytics.trackApiError('/leaderboard', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    playClick();
    analytics.trackLeaderboardTabChange(tab);
    setActiveTab(tab);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return isLightTheme ? '#4fc3f7' : '#8accaa';
  };

  const renderAllTimeLeaderboard = () => {
    if (leaderboard.length === 0) {
      return (
        <div className="leaderboard-empty">
          <p>Нет данных для отображения</p>
        </div>
      );
    }

    return (
      <div className="leaderboard-list">
        <div className="leaderboard-header">
          <div className="header-rank">Место</div>
          <div className="header-player">Игрок</div>
          <div className="header-rating">Рейтинг</div>
          <div className="header-games">Игр</div>
        </div>
        {leaderboard.map((entry) => (
          <div key={entry.rank} className="leaderboard-item">
            <div className="item-rank" style={{ color: getRankColor(entry.rank) }}>
              {getRankIcon(entry.rank)}
            </div>
            <div className="item-player">
              <span className="player-name">{entry.username}</span>
            </div>
            <div className="item-rating">
              <span className="rating-value">{entry.rating}</span>
            </div>
            <div className="item-games">
              <span className="games-count">{entry.games_played}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDailyLeaderboard = () => {
    if (dailyLeaderboard.length === 0) {
      return (
        <div className="leaderboard-empty">
          <p>Сегодня ещё никто не побеждал</p>
        </div>
      );
    }

    return (
      <div className="leaderboard-list">
        <div className="leaderboard-header">
          <div className="header-rank">Место</div>
          <div className="header-player">Игрок</div>
          <div className="header-wins">Побед</div>
        </div>
        {dailyLeaderboard.map((entry, index) => (
          <div key={entry.vk_user_id} className="leaderboard-item">
            <div className="item-rank" style={{ color: getRankColor(index + 1) }}>
              {getRankIcon(index + 1)}
            </div>
            <div className="item-player">
              <span className="player-name">{entry.username}</span>
            </div>
            <div className="item-wins">
              <span className="wins-value">{entry.wins_today}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeeklyLeaderboard = () => {
    if (weeklyLeaderboard.length === 0) {
      return (
        <div className="leaderboard-empty">
          <p>За неделю пока нет побед</p>
        </div>
      );
    }

    return (
      <div className="leaderboard-list">
        <div className="leaderboard-header">
          <div className="header-rank">Место</div>
          <div className="header-player">Игрок</div>
          <div className="header-wins">Побед</div>
        </div>
        {weeklyLeaderboard.map((entry, index) => (
          <div key={entry.vk_user_id} className="leaderboard-item">
            <div className="item-rank" style={{ color: getRankColor(index + 1) }}>
              {getRankIcon(index + 1)}
            </div>
            <div className="item-player">
              <span className="player-name">{entry.username}</span>
            </div>
            <div className="item-wins">
              <span className="wins-value">{entry.wins_weekly}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Panel 
      id={id} 
      className={`leaderboard-panel ${isLightTheme ? 'light-theme' : 'dark-theme'}`}
    >
      <StarsOnlyBackground />
      
      <div className="leaderboard-glow-orb"></div>
      <div className="leaderboard-glow-orb-2"></div>
      
      <PanelHeader 
        before={<BackToSudoku />}
        after={<ThemeToggle />}
      >
        РЕЙТИНГ
      </PanelHeader>
      
      <div className="leaderboard-container">
        <div className="leaderboard-title">
          <Icon28CupOutline />
          <h1>Таблица лидеров</h1>
        </div>
        
        <Tabs>
          <TabsItem
            selected={activeTab === 'all_time'}
            onClick={() => handleTabChange('all_time')}
          >
            За всё время
          </TabsItem>
          <TabsItem
            selected={activeTab === 'daily'}
            onClick={() => handleTabChange('daily')}
          >
            За сегодня
          </TabsItem>
          <TabsItem
            selected={activeTab === 'weekly'}
            onClick={() => handleTabChange('weekly')}
          >
            За неделю
          </TabsItem>
        </Tabs>
        
        <div className="leaderboard-content">
          {isLoading ? (
            <div className="leaderboard-loading">
              <Spinner size="l" />
            </div>
          ) : (
            <>
              {activeTab === 'all_time' && renderAllTimeLeaderboard()}
              {activeTab === 'daily' && renderDailyLeaderboard()}
              {activeTab === 'weekly' && renderWeeklyLeaderboard()}
            </>
          )}
        </div>
        
        {activeTab === 'all_time' && totalUsers > 0 && (
          <div className="leaderboard-footer">
            Всего игроков: {totalUsers}
          </div>
        )}
      </div>
    </Panel>
  );
};