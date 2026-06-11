import { FC, useEffect } from 'react';
import { Panel } from '@vkontakte/vkui';
import { ThemeToggle } from '../components/ThemeToggle';
import { SoundToggle } from '../components/SoundToggle';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { useSound } from '../hooks/useSound';
import { analytics } from '../utils/analytics';
import './Menu.css';

interface MenuProps {
  id: string;
  onSelectGame: (game: 'sudoku' | 'puzzle') => void;
}

export const Menu: FC<MenuProps> = ({ id, onSelectGame }) => {
  const { playClick } = useSound();

  useEffect(() => {
    analytics.trackScreenView('menu');
  }, []);

  const handleSelectGame = (game: 'sudoku' | 'puzzle') => {
    playClick();
    onSelectGame(game);
  };

  return (
    <Panel id={id} className="menu-panel">
      <AnimatedBackground />
      <div className="custom-header">
        <div className="header-left"></div>
        <div className="header-right">
          <ThemeToggle />
          <SoundToggle />
        </div>
      </div>

      <div className="menu-content">
        <div className="hero-section">
          <div className="start-title">
            <span className="title-word">START</span>
            <span className="title-word">GAME</span>
          </div>
          <div className="title-sub">
            <span>ВЫБЕРИТЕ ИГРУ</span>
          </div>
        </div>

        <div className="game-cards">
          <div className="game-card sudoku-card" onClick={() => handleSelectGame('sudoku')}>
            <div className="card-icon">🎯</div>
            <h2>СУДОКУ</h2>
            <button className="play-btn">
              <span>ИГРАТЬ</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="game-card puzzle-card" onClick={() => handleSelectGame('puzzle')}>
            <div className="card-icon">🧩</div>
            <h2>ПАЗЛЫ</h2>
            <button className="play-btn">
              <span>ИГРАТЬ</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
};