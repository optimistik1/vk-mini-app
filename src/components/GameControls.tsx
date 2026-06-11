import { FC } from 'react';
import { useGameStore } from '../store/gameStore';
import { useThemeStore } from '../store/themeStore';
import { useSound } from '../hooks/useSound';
import { analytics } from '../utils/analytics';

export const GameControls: FC = () => {
  const resetGame = useGameStore((state) => state.resetGame);
  const getHint = useGameStore((state) => state.getHint);
  const toggleNoteMode = useGameStore((state) => state.toggleNoteMode);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const noteMode = useGameStore((state) => state.noteMode);
  const isPaused = useGameStore((state) => state.isPaused);
  const isComplete = useGameStore((state) => state.isComplete);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isBoardReady = useGameStore((state) => state.isBoardReady);
  const { playClick } = useSound();
  const { theme } = useThemeStore();

  const isGameActive = isBoardReady && !isComplete && !isGameOver;

  const handleResetClick = () => {
    playClick();
    analytics.trackSudokuReset();
    resetGame();
  };

  const handleHintClick = () => {
    playClick();
    analytics.trackSudokuHintUsed();
    getHint();
  };

  const handleToggleNoteMode = () => {
    playClick();
    analytics.trackSudokuNoteToggle(!noteMode);
    toggleNoteMode();
  };

  const handlePauseResume = () => {
    playClick();
    if (isPaused) {
      analytics.trackSudokuResume();
      resumeGame();
    } else {
      analytics.trackSudokuPause();
      pauseGame();
    }
  };

  const getButtonStyle = (isActive: boolean = true) => ({
    opacity: isActive ? 1 : 0.5,
    cursor: isActive ? 'pointer' : 'not-allowed',
  });

  return (
    <div className="game-controls">
      <div className="controls-buttons-vertical">
        {isGameActive && (
          <button
            className="game-control-btn"
            onClick={handlePauseResume}
            style={getButtonStyle()}
          >
            {isPaused ? 'ПРОДОЛЖИТЬ' : 'ПАУЗА'}
          </button>
        )}
        <button
          className={`game-control-btn ${noteMode && isGameActive ? 'note-active' : ''}`}
          onClick={handleToggleNoteMode}
          disabled={!isGameActive}
          style={getButtonStyle(isGameActive)}
        >
          {noteMode ? "ЗАМЕТКИ ВКЛ" : "ЗАМЕТКИ"}
        </button>
        <button
          className="game-control-btn"
          onClick={handleHintClick}
          disabled={!isGameActive}
          style={getButtonStyle(isGameActive)}
        >
          ПОДСКАЗКА
        </button>
        <button
          className="game-control-btn"
          onClick={handleResetClick}
          style={getButtonStyle()}
        >
          НОВАЯ ИГРА
        </button>
      </div>
    </div>
  );
};