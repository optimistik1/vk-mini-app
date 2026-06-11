import { FC } from 'react';
import { Button } from '@vkontakte/vkui';
import { useGameStore, Difficulty } from '../store/gameStore';
import { useThemeStore } from '../store/themeStore';
import { useSound } from '../hooks/useSound';
import { analytics } from '../utils/analytics';

export const DifficultyButtons: FC = () => {
  const newGame = useGameStore((state) => state.newGame);
  const difficulty = useGameStore((state) => state.difficulty);
  const allowedDifficulties = useGameStore((state) => state.allowedDifficulties);
  const { theme } = useThemeStore();
  const { playClick } = useSound();

  const difficulties: { label: string; value: Difficulty; color: string }[] = [
    { label: 'ЛЁГКИЙ', value: 'easy', color: '#2ecc71' },
    { label: 'СРЕДНИЙ', value: 'medium', color: '#f39c12' },
    { label: 'СЛОЖНЫЙ', value: 'hard', color: '#e74c3c' },
  ];

  const isLightTheme = theme === 'light';

  const handleDifficultyClick = (value: Difficulty) => {
    if (!allowedDifficulties.includes(value)) return;
    playClick();
    analytics.trackSudokuDifficultyChange(value);
    newGame(value, true);
  };

  return (
    <div className="sudoku-difficulty-buttons">
      {difficulties.map(d => {
        const isActive = difficulty === d.value;
        const isAllowed = allowedDifficulties.includes(d.value);
        
        return (
          <Button
            key={d.value}
            size="l"
            mode={isActive ? "primary" : "outline"}
            onClick={() => handleDifficultyClick(d.value)}
            style={{
              flex: 1,
              minWidth: '100px',
              fontWeight: 700,
              fontSize: '14px',
              background: isActive ? d.color : (isLightTheme ? '#ffffff' : 'transparent'),
              border: isActive ? 'none' : (isLightTheme ? '2px solid #000000' : '2px solid #444444'),
              color: isActive ? 'white' : (isLightTheme ? '#000000' : '#ffffff'),
              borderRadius: '40px',
              height: '48px',
              opacity: isAllowed ? 1 : 0.5,
              cursor: isAllowed ? 'pointer' : 'not-allowed',
            }}
          >
            {d.label}
          </Button>
        );
      })}
    </div>
  );
};