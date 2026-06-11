import { FC, useState, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useSound } from '../hooks/useSound';
import { usePuzzleStore } from '../store/puzzleStore';
import './PuzzleDifficultyModal.css';

interface PuzzleDifficultyModalProps {
  isOpen: boolean;
  onSelect: (difficulty: 'easy' | 'medium' | 'hard', category?: string | null) => void;
  onClose: () => void;
}

export const PuzzleDifficultyModal: FC<PuzzleDifficultyModalProps> = ({ 
  isOpen, 
  onSelect, 
  onClose 
}) => {
  const { theme } = useThemeStore();
  const { playClick } = useSound();
  const { categories, loadCategories, selectedCategory, setSelectedCategory } = usePuzzleStore();
  const [step, setStep] = useState<'difficulty' | 'category'>('difficulty');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const isLightTheme = theme === 'light';

  // Загружаем категории при открытии модалки
  useEffect(() => {
    if (isOpen && categories.length === 0 && !isLoadingCategories) {
      setIsLoadingCategories(true);
      loadCategories().finally(() => setIsLoadingCategories(false));
    }
  }, [isOpen, categories.length, loadCategories]);

  if (!isOpen) return null;

  const difficulties = [
    { 
      id: 'easy' as const, 
      name: 'ЛЁГКИЙ', 
      grid: '3 × 3', 
      pieces: '9 фрагментов',
      color: '#2ecc71',
      description: 'Для начинающих'
    },
    { 
      id: 'medium' as const, 
      name: 'СРЕДНИЙ', 
      grid: '4 × 4', 
      pieces: '16 фрагментов',
      color: '#f39c12',
      description: 'Для опытных игроков'
    },
    { 
      id: 'hard' as const, 
      name: 'СЛОЖНЫЙ', 
      grid: '6 × 6', 
      pieces: '36 фрагментов',
      color: '#e74c3c',
      description: 'Для мастеров'
    },
  ];

  const categoryEmojis: Record<string, string> = {
    'Аниме': '🎌',
    'Природа': '🌿',
    'Космос': '🚀',
    'Животные': '🐾',
    'Фантастика': '✨',
    'Машины': '🚗',
    'Спорт': '⚽',
    'Еда': '🍕',
    'Супергерои': '🦸',
    'Мультфильмы': '🎬',
    'Игры': '🎮',
  };

  const handleDifficultySelect = (difficulty: 'easy' | 'medium' | 'hard') => {
    playClick();
    setSelectedDifficulty(difficulty);
    setStep('category');
  };

  const handleCategorySelect = (category: string | null) => {
    playClick();
    setSelectedCategory(category);
    if (selectedDifficulty) {
      onSelect(selectedDifficulty, category);
    }
  };

  const handleBackToDifficulty = () => {
    playClick();
    setStep('difficulty');
    setSelectedDifficulty(null);
  };

  // Шаг 1: Выбор сложности
  if (step === 'difficulty') {
    return (
      <div className="puzzle-difficulty-overlay" onClick={onClose}>
        <div 
          className={`puzzle-difficulty-modal ${isLightTheme ? 'light-theme' : 'dark-theme'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <span className="modal-icon">🧩</span>
            <h2>Выберите сложность</h2>
          </div>
          
          <div className="difficulty-options">
            {difficulties.map((diff) => (
              <div
                key={diff.id}
                className="difficulty-card"
                onClick={() => handleDifficultySelect(diff.id)}
                style={{ borderBottomColor: diff.color }}
              >
                <div className="difficulty-header">
                  <span className="difficulty-name" style={{ color: diff.color }}>
                    {diff.name}
                  </span>
                  <span className="difficulty-badge">{diff.grid}</span>
                </div>
                <div className="difficulty-info">
                  <span className="difficulty-pieces">🧩 {diff.pieces}</span>
                  <span className="difficulty-desc">{diff.description}</span>
                </div>
                <div className="difficulty-progress" style={{ backgroundColor: `${diff.color}20` }}>
                  <div 
                    className="difficulty-progress-bar" 
                    style={{ width: '100%', backgroundColor: diff.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <button className="modal-close-btn" onClick={onClose}>
            ОТМЕНА
          </button>
        </div>
      </div>
    );
  }

  // Шаг 2: Выбор категории
  return (
    <div className="puzzle-difficulty-overlay" onClick={handleBackToDifficulty}>
      <div 
        className={`puzzle-difficulty-modal ${isLightTheme ? 'light-theme' : 'dark-theme'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <button className="modal-back-btn" onClick={handleBackToDifficulty}>
            ←
          </button>
          <span className="modal-icon">🎨</span>
          <h2>Выберите категорию</h2>
        </div>
        
        <div className="difficulty-options">
          {/* Кнопка "Случайная категория" */}
          <div
            className="difficulty-card random-card"
            onClick={() => handleCategorySelect(null)}
            style={{ borderBottomColor: '#5bc099' }}
          >
            <div className="difficulty-header">
              <span className="difficulty-name" style={{ color: '#5bc099' }}>
                🎲 СЛУЧАЙНАЯ
              </span>
              <span className="difficulty-badge">Любая тема</span>
            </div>
            <div className="difficulty-info">
              <span className="difficulty-pieces">✨ ИИ сам выберет тему</span>
              <span className="difficulty-desc">Сюрприз!</span>
            </div>
            <div className="difficulty-progress" style={{ backgroundColor: '#5bc09920' }}>
              <div 
                className="difficulty-progress-bar" 
                style={{ width: '100%', backgroundColor: '#5bc099' }}
              />
            </div>
          </div>

          {/* Список категорий */}
          {isLoadingCategories ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <span>Загрузка категорий...</span>
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat}
                className="difficulty-card"
                onClick={() => handleCategorySelect(cat)}
                style={{ borderBottomColor: '#5bc099' }}
              >
                <div className="difficulty-header">
                  <span className="difficulty-name" style={{ color: '#5bc099' }}>
                    {categoryEmojis[cat] || '🎨'} {cat}
                  </span>
                  <span className="difficulty-badge">Категория</span>
                </div>
                <div className="difficulty-info">
                  <span className="difficulty-pieces">🎨 Случайная тема из категории</span>
                  <span className="difficulty-desc">{cat}</span>
                </div>
                <div className="difficulty-progress" style={{ backgroundColor: '#5bc09920' }}>
                  <div 
                    className="difficulty-progress-bar" 
                    style={{ width: '100%', backgroundColor: '#5bc099' }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        
        <button className="modal-close-btn" onClick={handleBackToDifficulty}>
          НАЗАД
        </button>
      </div>
    </div>
  );
};