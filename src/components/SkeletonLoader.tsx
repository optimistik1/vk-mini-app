import { FC } from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  type: 'sudoku' | 'puzzle' | 'board' | 'stats';
  count?: number;
}

export const SkeletonLoader: FC<SkeletonLoaderProps> = ({ type, count = 1 }) => {
  const renderSudokuSkeleton = () => (
    <div className="skeleton-sudoku">
      <div className="skeleton-board">
        {Array(9).fill(0).map((_, i) => (
          <div key={i} className="skeleton-row">
            {Array(9).fill(0).map((_, j) => (
              <div key={j} className="skeleton-cell shimmer" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPuzzleSkeleton = () => (
    <div className="skeleton-puzzle">
      <div className="skeleton-pieces-area">
        {Array(12).fill(0).map((_, i) => (
          <div key={i} className="skeleton-piece shimmer" />
        ))}
      </div>
      <div className="skeleton-board-area shimmer" />
    </div>
  );

  const renderStatsSkeleton = () => (
    <div className="skeleton-stats">
      <div className="skeleton-stat shimmer" />
      <div className="skeleton-stat shimmer" />
      <div className="skeleton-stat shimmer" />
    </div>
  );

  const renderBoardSkeleton = () => (
    <div className="skeleton-board-only">
      {Array(9).fill(0).map((_, i) => (
        <div key={i} className="skeleton-row">
          {Array(9).fill(0).map((_, j) => (
            <div key={j} className="skeleton-cell shimmer" />
          ))}
        </div>
      ))}
    </div>
  );

  const renderMultiple = () => (
    <div className="skeleton-multiple">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="skeleton-leaderboard-item shimmer">
          <div className="skeleton-rank" />
          <div className="skeleton-name" />
          <div className="skeleton-score" />
        </div>
      ))}
    </div>
  );

  switch (type) {
    case 'sudoku':
      return renderSudokuSkeleton();
    case 'puzzle':
      return renderPuzzleSkeleton();
    case 'stats':
      return renderStatsSkeleton();
    case 'board':
      return renderBoardSkeleton();
    default:
      return renderMultiple();
  }
};