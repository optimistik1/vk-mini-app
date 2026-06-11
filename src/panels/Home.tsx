import { FC, useEffect, useCallback, useRef } from 'react';
import { Panel, PanelHeader } from '@vkontakte/vkui';
import { Icon28CupOutline } from '@vkontakte/icons';
import { useGameStore, Difficulty } from '../store/gameStore';
import { useThemeStore } from '../store/themeStore';
import { useSound } from '../hooks/useSound';
import { analytics } from '../utils/analytics';
import { SudokuBoard } from '../components/SudokuBoard';
import { NumberPad } from '../components/NumberPad';
import { DifficultyButtons } from '../components/DifficultyButtons';
import { GameControls } from '../components/GameControls';
import { ThemeToggle } from '../components/ThemeToggle';
import { BackToMenu } from '../components/BackToMenu';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { StarsOnlyBackground } from '../components/StarsOnlyBackground';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import './Home.css';

interface HomeProps {
  id: string;
}

export const Home: FC<HomeProps> = ({ id }) => {
  const newGame = useGameStore((state) => state.newGame);
  const loadUserStats = useGameStore((state) => state.loadUserStats);
  const saveCurrentState = useGameStore((state) => state.saveCurrentState);
  const loadSavedGame = useGameStore((state) => state.loadSavedGame);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const isPaused = useGameStore((state) => state.isPaused);
  const mistakes = useGameStore((state) => state.mistakes);
  const time = useGameStore((state) => state.time);
  const isComplete = useGameStore((state) => state.isComplete);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isBoardReady = useGameStore((state) => state.isBoardReady);
  const isLoading = useGameStore((state) => state.isLoading);
  const difficulty = useGameStore((state) => state.difficulty);
  const playerSkill = useGameStore((state) => state.playerSkill);
  const gamesPlayed = useGameStore((state) => state.gamesPlayed);
  const winRate = useGameStore((state) => state.winRate);
  const promotionInfo = useGameStore((state) => state.promotionInfo);
  const incrementTime = useGameStore((state) => state.incrementTime);
  const routeNavigator = useRouteNavigator();
  const { theme } = useThemeStore();
  const { playClick, playVictory } = useSound();

  const isLightTheme = theme === 'light';
  
  const victoryPlayedRef = useRef(false);

  useEffect(() => {
    if (!isComplete && !isGameOver && isBoardReady) {
      victoryPlayedRef.current = false;
    }
  }, [isComplete, isGameOver, isBoardReady]);

  useEffect(() => {
    analytics.trackScreenView('sudoku');
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isBoardReady && !isComplete && !isGameOver) {
        saveCurrentState();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      if (isBoardReady && !isComplete && !isGameOver) {
        saveCurrentState();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveCurrentState, isBoardReady, isComplete, isGameOver]);

  useEffect(() => {
    const initGame = async () => {
      const hasSavedGame = await loadSavedGame();
      if (!hasSavedGame) {
        await newGame('medium');
      }
    };
    
    initGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBoardReady && !isComplete && !isGameOver && !isPaused) {
      interval = setInterval(() => {
        incrementTime();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBoardReady, isComplete, isGameOver, isPaused, incrementTime]);

  useEffect(() => {
    if (isComplete && isBoardReady) {
      analytics.trackSudokuGameComplete(difficulty, time, mistakes, 0, 0);
    }
  }, [isComplete, isBoardReady, difficulty, time, mistakes]);

  useEffect(() => {
    if (isGameOver && isBoardReady) {
      analytics.trackSudokuGameOver(difficulty, time, mistakes, 0);
    }
  }, [isGameOver, isBoardReady, difficulty, time, mistakes]);

  useEffect(() => {
    if (isComplete && isBoardReady && !victoryPlayedRef.current) {
      console.log('🎉 Playing victory sound (once)');
      victoryPlayedRef.current = true;
      playVictory();
    }
  }, [isComplete, isBoardReady, playVictory]);

  const formatTime = useCallback((sec: number): string => {
    const mins = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getSkillLabel = (skill: string): string => {
    switch (skill) {
      case 'beginner': return 'НАЧИНАЮЩИЙ';
      case 'intermediate': return 'СРЕДНИЙ';
      case 'advanced': return 'ПРОДВИНУТЫЙ';
      default: return skill.toUpperCase();
    }
  };

  const getSkillColor = (skill: string): string => {
    switch (skill) {
      case 'beginner': return '#4fc3f7';
      case 'intermediate': return '#f39c12';
      case 'advanced': return '#e74c3c';
      default: return '#4fc3f7';
    }
  };

  const handleShowLeaderboard = () => {
    playClick();
    analytics.trackEvent('leaderboard_viewed', { from_screen: 'sudoku' });
    if (isBoardReady && !isComplete && !isGameOver) {
      pauseGame();
    }
    routeNavigator.push('/leaderboard');
  };

  const handleNewGame = () => {
    playClick();
    analytics.trackSudokuReset();
    newGame(difficulty, true);
  };

  const safePlayerSkill = playerSkill || 'beginner';
  const safeWinRate = winRate || 0;
  const safeGamesPlayed = gamesPlayed || 0;
  
  const needGames = promotionInfo?.need_games || 0;
  const currentGames = promotionInfo?.current_games || 0;
  const needWinRate = promotionInfo?.need_win_rate || 0;
  const currentWinRate = promotionInfo?.current_win_rate || 0;

  return (
    <Panel 
      id={id} 
      className={`sudoku-panel ${isLightTheme ? 'light-theme' : 'dark-theme'}`}
    >
      {/* Звёздный фон (только звёзды, без роботов, без перекрытия градиента) */}
      <StarsOnlyBackground />
      
      {/* Анимированные орбы */}
      <div className="glow-orb"></div>
      <div className="glow-orb-2"></div>
      
      <PanelHeader before={<BackToMenu />}>
        СУДОКУ
      </PanelHeader>
      
      <div className="sudoku-top-bar">
        <div className="sudoku-stats-row">
          <div className="sudoku-stat-item errors">
            <span className="sudoku-stat-label">ОШИБКИ</span>
            <span className="sudoku-stat-value">{mistakes} / 3</span>
          </div>
          <div className="sudoku-stat-item time">
            <span className="sudoku-stat-label">ВРЕМЯ</span>
            <span className="sudoku-stat-value">{formatTime(time)}</span>
          </div>
          <div className="sudoku-stat-item skill">
            <span className="sudoku-stat-label">УРОВЕНЬ</span>
            <span className="sudoku-stat-value" style={{ color: getSkillColor(safePlayerSkill) }}>
              {getSkillLabel(safePlayerSkill)}
            </span>
          </div>
          <div className="sudoku-stat-item leaderboard">
            <div
              onClick={handleShowLeaderboard}
              className="icon-btn"
              role="button"
              tabIndex={0}
              aria-label="Таблица лидеров"
            >
              <Icon28CupOutline width={20} height={20} fill={isLightTheme ? '#1a3a5a' : '#ffffffd9'} />
            </div>
          </div>
          <div className="sudoku-stat-item theme">
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      <div className="sudoku-game-layout">
        <div className="sudoku-board-section">
          {!isBoardReady ? (
            <SkeletonLoader type="sudoku" />
          ) : (
            <SudokuBoard />
          )}
        </div>
        
        <div className="sudoku-controls-section">
          <NumberPad />
          <GameControls />
          
          {/* 🔄 ИСПРАВЛЕННЫЙ БЛОК СТАТИСТИКИ С SKELETON LOADER */}
          {isLoading ? (
            <div className="sudoku-player-stats">
              <SkeletonLoader type="stats" />
            </div>
          ) : (
            <div className="sudoku-player-stats">
              <div className="sudoku-stats-row small">
                <span>🎮 Всего: {safeGamesPlayed} игр</span>
                <span>🏆 Побед: {safeWinRate.toFixed(0)}%</span>
              </div>
              
              {needGames > 0 && (
                <div className="sudoku-promotion-info">
                  <div className="sudoku-promotion-title">⭐ До повышения:</div>
                  <div className="sudoku-promotion-progress">
                    <div className="sudoku-progress-item">
                      <span>Игр: {currentGames}/{needGames}</span>
                      <div className="sudoku-progress-bar">
                        <div 
                          className="sudoku-progress-fill" 
                          style={{ width: `${Math.min(100, (currentGames / needGames) * 100)}%` }}
                        />
                      </div>
                    </div>
                    {needWinRate > 0 && (
                      <div className="sudoku-progress-item">
                        <span>Побед: {currentWinRate.toFixed(0)}% / {needWinRate}%</span>
                        <div className="sudoku-progress-bar">
                          <div 
                            className="sudoku-progress-fill" 
                            style={{ width: `${Math.min(100, (currentWinRate / needWinRate) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="sudoku-bottom-bar">
        <DifficultyButtons />
      </div>
      
      {isPaused && !isComplete && !isGameOver && (
        <div className="overlay">
          <div className="modal-card pause">
            <div className="modal-icon">⏸️</div>
            <div className="modal-title">Пауза</div>
            <button className="modal-btn" onClick={() => {
              playClick();
              analytics.trackSudokuResume();
              resumeGame();
            }}>Продолжить</button>
          </div>
        </div>
      )}
      
      {isComplete && (
        <div className="overlay">
          <div className="modal-card win">
            <div className="modal-icon">🎉</div>
            <div className="modal-title">Поздравляем!</div>
            <div className="modal-text">Вы решили судоку за {formatTime(time)}</div>
            <button className="modal-btn" onClick={handleNewGame}>Новая игра</button>
          </div>
        </div>
      )}
      
      {isGameOver && (
        <div className="overlay">
          <div className="modal-card lose">
            <div className="modal-icon">💀</div>
            <div className="modal-title">Игра окончена</div>
            <div className="modal-text">Вы сделали 3 ошибки</div>
            <button className="modal-btn" onClick={handleNewGame}>Новая попытка</button>
          </div>
        </div>
      )}
    </Panel>
  );
};