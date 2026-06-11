import { FC, useEffect, useRef, useState, useCallback } from 'react';
import { Panel, PanelHeader, Group, Box, Button } from '@vkontakte/vkui';
import { usePuzzleStore } from '../store/puzzleStore';
import { useThemeStore } from '../store/themeStore';
import { useSound } from '../hooks/useSound';
import { PuzzleDifficultyModal } from '../components/PuzzleDifficultyModal';
import { ThemeToggle } from '../components/ThemeToggle';
import { BackToMenu } from '../components/BackToMenu';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { StarsOnlyBackground } from '../components/StarsOnlyBackground';
import './Puzzle.css';

interface PuzzleProps {
  id: string;
}

interface CanvasCoords {
  x: number;
  y: number;
}

export const Puzzle: FC<PuzzleProps> = ({ id }) => {
  const newGame = usePuzzleStore((state) => state.newGame);
  const forceNewGame = usePuzzleStore((state) => state.forceNewGame);
  const placePiece = usePuzzleStore((state) => state.placePiece);
  const shuffleUnplaced = usePuzzleStore((state) => state.shuffleUnplaced);
  const clearAllPieces = usePuzzleStore((state) => state.clearAllPieces);
  const incrementTime = usePuzzleStore((state) => state.incrementTime);
  const pauseGame = usePuzzleStore((state) => state.pauseGame);
  const resumeGame = usePuzzleStore((state) => state.resumeGame);
  const saveCurrentState = usePuzzleStore((state) => state.saveCurrentState);
  const loadSavedGame = usePuzzleStore((state) => state.loadSavedGame);
  const loadCategories = usePuzzleStore((state) => state.loadCategories);
  const resetGameState = usePuzzleStore((state) => state.resetGameState);
  
  const imageUrl = usePuzzleStore((state) => state.imageUrl);
  const width = usePuzzleStore((state) => state.width);
  const height = usePuzzleStore((state) => state.height);
  const piecesRows = usePuzzleStore((state) => state.piecesRows);
  const piecesCols = usePuzzleStore((state) => state.piecesCols);
  const pieces = usePuzzleStore((state) => state.pieces);
  const isComplete = usePuzzleStore((state) => state.isComplete);
  const isLoading = usePuzzleStore((state) => state.isLoading);
  const time = usePuzzleStore((state) => state.time);
  const isPaused = usePuzzleStore((state) => state.isPaused);
  const isBoardReady = usePuzzleStore((state) => state.isBoardReady);
  const error = usePuzzleStore((state) => state.error);
  const category = usePuzzleStore((state) => state.category);
  const selectedCategory = usePuzzleStore((state) => state.selectedCategory);
  
  const { theme } = useThemeStore();
  const { playClick, playDrag, playPlace, playVictory, playError } = useSound();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [dragStartPieceId, setDragStartPieceId] = useState<number | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showLoadError, setShowLoadError] = useState(false);
  const [isPreviewBlurred, setIsPreviewBlurred] = useState(true);
  const [previewReady, setPreviewReady] = useState(false);
  
  const isLoadingImageRef = useRef(false);
  const prevImageUrlRef = useRef<string>('');
  const hasPlayedVictoryForCurrentGameRef = useRef(false);

  const boardSize = 420;
  const cellSize = boardSize / Math.max(piecesCols, piecesRows);
  const previewSize = 140;
  const gap = 50;
  const isLightTheme = theme === 'light';

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) {
      console.log('drawPreview: canvas ref is null');
      return;
    }
    
    if (!img) {
      console.log('drawPreview: img is null');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('drawPreview: cannot get context');
      return;
    }
    
    console.log('drawPreview: drawing preview, canvas size:', canvas.width, 'x', canvas.height);
    
    canvas.width = previewSize;
    canvas.height = previewSize;
    
    ctx.clearRect(0, 0, previewSize, previewSize);
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, previewSize, previewSize);
    
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, previewSize, previewSize);
    
    setPreviewReady(true);
  }, [img, previewSize]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const totalWidth = boardSize + gap + boardSize;
    const totalHeight = boardSize;
    
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;
    canvas.style.display = 'block';
    
    ctx.clearRect(0, 0, totalWidth, totalHeight);
    
    const piecesAreaX = 0;
    const unplacedPieces = pieces.filter(p => !p.placed);
    
    ctx.fillStyle = isLightTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(piecesAreaX, 0, boardSize, boardSize);
    
    ctx.strokeStyle = isLightTheme ? 'rgba(79, 195, 247, 0.5)' : 'rgba(79, 195, 247, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(piecesAreaX, 0, boardSize, boardSize);
    
    ctx.strokeStyle = isLightTheme ? 'rgba(79, 195, 247, 0.3)' : 'rgba(79, 195, 247, 0.25)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i < piecesCols; i++) {
      ctx.beginPath();
      ctx.moveTo(piecesAreaX + i * cellSize, 0);
      ctx.lineTo(piecesAreaX + i * cellSize, boardSize);
      ctx.stroke();
    }
    
    for (let i = 1; i < piecesRows; i++) {
      ctx.beginPath();
      ctx.moveTo(piecesAreaX, i * cellSize);
      ctx.lineTo(piecesAreaX + boardSize, i * cellSize);
      ctx.stroke();
    }
    
    const realPieceWidth = width / piecesCols;
    const realPieceHeight = height / piecesRows;
    
    for (let idx = 0; idx < unplacedPieces.length; idx++) {
      const piece = unplacedPieces[idx];
      const targetCol = piece.original_index % piecesCols;
      const targetRow = Math.floor(piece.original_index / piecesCols);
      const sx = targetCol * realPieceWidth;
      const sy = targetRow * realPieceHeight;
      
      const col = idx % piecesCols;
      const row = Math.floor(idx / piecesCols);
      const dx = piecesAreaX + col * cellSize;
      const dy = row * cellSize;
      
      ctx.drawImage(img, sx, sy, realPieceWidth, realPieceHeight, dx, dy, cellSize, cellSize);
      
      ctx.strokeStyle = isLightTheme ? 'rgba(79, 195, 247, 0.5)' : 'rgba(79, 195, 247, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dx, dy, cellSize, cellSize);
    }
    
    const boardX = boardSize + gap;
    
    ctx.fillStyle = isLightTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(boardX, 0, boardSize, boardSize);
    
    ctx.strokeStyle = isLightTheme ? 'rgba(79, 195, 247, 0.5)' : 'rgba(79, 195, 247, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(boardX, 0, boardSize, boardSize);
    
    ctx.strokeStyle = isLightTheme ? 'rgba(79, 195, 247, 0.3)' : 'rgba(79, 195, 247, 0.25)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i < piecesCols; i++) {
      ctx.beginPath();
      ctx.moveTo(boardX + i * cellSize, 0);
      ctx.lineTo(boardX + i * cellSize, boardSize);
      ctx.stroke();
    }
    
    for (let i = 1; i < piecesRows; i++) {
      ctx.beginPath();
      ctx.moveTo(boardX, i * cellSize);
      ctx.lineTo(boardX + boardSize, i * cellSize);
      ctx.stroke();
    }
    
    for (const piece of pieces) {
      if (piece.placed) {
        const targetCol = piece.original_index % piecesCols;
        const targetRow = Math.floor(piece.original_index / piecesCols);
        const sx = targetCol * realPieceWidth;
        const sy = targetRow * realPieceHeight;
        const dx = boardX + targetCol * cellSize;
        const dy = targetRow * cellSize;
        
        ctx.drawImage(img, sx, sy, realPieceWidth, realPieceHeight, dx, dy, cellSize, cellSize);
        
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(dx, dy, cellSize, cellSize);
      }
    }
    
    if (dragStartPieceId !== null && isDragging && !isComplete && !isPaused) {
      const piece = pieces.find(p => p.piece_id === dragStartPieceId);
      if (piece && !piece.placed) {
        const targetCol = piece.original_index % piecesCols;
        const targetRow = Math.floor(piece.original_index / piecesCols);
        const sx = targetCol * realPieceWidth;
        const sy = targetRow * realPieceHeight;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.globalAlpha = 0.9;
        
        ctx.drawImage(img, sx, sy, realPieceWidth, realPieceHeight, dragPos.x - cellSize/2, dragPos.y - cellSize/2, cellSize, cellSize);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }
  }, [pieces, img, width, height, piecesRows, piecesCols, theme, dragPos, dragStartPieceId, boardSize, cellSize, isDragging, isComplete, isPaused, isLightTheme, gap]);

  const loadImage = useCallback(() => {
    if (!imageUrl || imageUrl.length === 0 || isLoadingImageRef.current || imageLoaded) {
      return;
    }
    
    console.log('Loading image from URL');
    isLoadingImageRef.current = true;
    setPreviewReady(false);
    
    const image = new Image();
    image.onload = () => {
      console.log('Image loaded successfully');
      setImg(image);
      setImageLoaded(true);
      setImageLoadError(false);
      isLoadingImageRef.current = false;
    };
    image.onerror = (e) => {
      console.error('Failed to load image:', e);
      setImageLoadError(true);
      setShowLoadError(true);
      setImageLoaded(false);
      isLoadingImageRef.current = false;
    };
    image.src = imageUrl;
  }, [imageUrl, imageLoaded]);

  useEffect(() => {
    if (!previewCanvasRef.current) {
      console.log('Preview canvas not mounted yet, waiting...');
      return;
    }
    
    if (!img) {
      console.log('No image yet, waiting...');
      return;
    }
    
    console.log('Preview canvas is ready, drawing preview...');
    drawPreview();
  }, [img, drawPreview, previewCanvasRef.current]);

  useEffect(() => {
    if (img && previewCanvasRef.current) {
      drawPreview();
    }
  }, [theme, img, drawPreview]);

  useEffect(() => {
    if (!imageLoaded || !img || !pieces.length) return;
    drawCanvas();
  }, [pieces, imageLoaded, img, drawCanvas]);

  const handlePreviewClick = () => {
    playClick();
    setIsPreviewBlurred(false);
  };

  const getCategoryDisplayName = (): string => {
    if (category) return category;
    if (selectedCategory) return selectedCategory;
    return 'Случайная';
  };

  const getCategoryEmoji = (cat: string): string => {
    const emojis: Record<string, string> = {
      'Аниме': '🎌', 'Природа': '🌿', 'Космос': '🚀', 'Животные': '🐾',
      'Фантастика': '✨', 'Машины': '🚗', 'Спорт': '⚽', 'Еда': '🍕',
      'Супергерои': '🦸', 'Мультфильмы': '🎬', 'Игры': '🎮',
    };
    return emojis[cat] || '🧩';
  };

  const resetVictoryFlag = () => {
    hasPlayedVictoryForCurrentGameRef.current = false;
  };

  const getCanvasCoordsFromClient = (clientX: number, clientY: number): CanvasCoords | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const findPieceUnderPointer = (clientX: number, clientY: number): number | null => {
    const coords = getCanvasCoordsFromClient(clientX, clientY);
    if (!coords) return null;
    
    const unplacedPieces = pieces.filter(p => !p.placed);
    
    for (let idx = 0; idx < unplacedPieces.length; idx++) {
      const piece = unplacedPieces[idx];
      const col = idx % piecesCols;
      const row = Math.floor(idx / piecesCols);
      const px = col * cellSize;
      const py = row * cellSize;
      
      if (coords.x >= px && coords.x <= px + cellSize && 
          coords.y >= py && coords.y <= py + cellSize) {
        return piece.piece_id;
      }
    }
    
    return null;
  };

  const checkPlacement = async (clientX: number, clientY: number, pieceId: number) => {
    const coords = getCanvasCoordsFromClient(clientX, clientY);
    if (!coords) return;
    
    const boardX = boardSize + gap;
    
    if (coords.x >= boardX && coords.x <= boardX + boardSize && 
        coords.y >= 0 && coords.y <= boardSize) {
      const targetCol = Math.floor((coords.x - boardX) / cellSize);
      const targetRow = Math.floor(coords.y / cellSize);
      
      if (targetCol >= 0 && targetCol < piecesCols && 
          targetRow >= 0 && targetRow < piecesRows) {
        const piece = pieces.find(p => p.piece_id === pieceId);
        const targetIndex = targetRow * piecesCols + targetCol;
        
        if (piece && piece.original_index === targetIndex) {
          playPlace();
          await placePiece(pieceId, targetCol, targetRow);
        } else if (piece) {
          playError();
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isComplete || isPaused || !imageLoaded || !isBoardReady) return;
    e.preventDefault();
    
    const pieceId = findPieceUnderPointer(e.clientX, e.clientY);
    if (pieceId !== null) {
      playDrag();
      setDragStartPieceId(pieceId);
      setDraggedPiece(pieceId);
      setIsDragging(true);
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedPiece === null || !isDragging || isComplete || isPaused || !imageLoaded || !isBoardReady) return;
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedPiece === null || !isDragging || isComplete || isPaused || !imageLoaded || !isBoardReady) {
      resetDrag();
      return;
    }
    
    e.preventDefault();
    await checkPlacement(e.clientX, e.clientY, draggedPiece);
    resetDrag();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isComplete || isPaused || !imageLoaded || !isBoardReady) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const pieceId = findPieceUnderPointer(touch.clientX, touch.clientY);
    if (pieceId !== null) {
      playDrag();
      setDragStartPieceId(pieceId);
      setDraggedPiece(pieceId);
      setIsDragging(true);
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setDragPos({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (draggedPiece === null || !isDragging || isComplete || isPaused || !imageLoaded || !isBoardReady) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragPos({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (draggedPiece === null || !isDragging || isComplete || isPaused || !imageLoaded || !isBoardReady) {
      resetDrag();
      return;
    }
    
    e.preventDefault();
    
    const changedTouch = e.changedTouches[0];
    if (changedTouch) {
      await checkPlacement(changedTouch.clientX, changedTouch.clientY, draggedPiece);
    }
    
    resetDrag();
  };

  const resetDrag = () => {
    setDraggedPiece(null);
    setDragStartPieceId(null);
    setIsDragging(false);
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isBoardReady && !isComplete && !isPaused && imageLoaded) {
        saveCurrentState();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      if (isBoardReady && !isComplete && !isPaused && imageLoaded) {
        saveCurrentState();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveCurrentState, isBoardReady, isComplete, isPaused, imageLoaded]);

  useEffect(() => {
    const initGame = async () => {
      console.log('Initializing puzzle game...');
      setIsInitializing(true);
      setImageLoadError(false);
      setShowLoadError(false);
      setImageLoaded(false);
      setImg(null);
      setShowWinModal(false);
      resetVictoryFlag();
      isLoadingImageRef.current = false;
      setIsPreviewBlurred(true);
      setPreviewReady(false);
      
      try {
        await loadCategories();
        
        const hasSavedGame = await loadSavedGame();
        
        if (hasSavedGame) {
          console.log('Loaded saved puzzle game, starting directly');
          setShowDifficultyModal(false);
          if (imageUrl && imageUrl.length > 0) {
            loadImage();
          }
        } else {
          console.log('No saved game, showing difficulty modal');
          setShowDifficultyModal(true);
        }
      } catch (err) {
        console.error('Error during initialization:', err);
        setShowDifficultyModal(true);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initGame();
  }, []);

  useEffect(() => {
    if (imageUrl !== prevImageUrlRef.current) {
      console.log('Image URL changed, resetting image loaded state');
      setImageLoaded(false);
      setImg(null);
      setImageLoadError(false);
      isLoadingImageRef.current = false;
      prevImageUrlRef.current = imageUrl;
      setIsPreviewBlurred(true);
      setPreviewReady(false);
      
      if (imageUrl && imageUrl.length > 0 && !showDifficultyModal) {
        loadImage();
      }
    }
  }, [imageUrl, showDifficultyModal, loadImage]);

  const handleDifficultySelect = async (difficulty: 'easy' | 'medium' | 'hard', category?: string | null) => {
    console.log('Difficulty selected:', difficulty, 'Category:', category || 'random');
    setShowDifficultyModal(false);
    setImageLoadError(false);
    setImageLoaded(false);
    setImg(null);
    setShowWinModal(false);
    resetVictoryFlag();
    isLoadingImageRef.current = false;
    setIsPreviewBlurred(true);
    setPreviewReady(false);
    await forceNewGame(difficulty, category);
  };

  const handleDifficultyModalClose = () => {
    playClick();
    setShowDifficultyModal(false);
    resetGameState();
    resetVictoryFlag();
    window.history.back();
  };

  useEffect(() => {
    if (isComplete && !hasPlayedVictoryForCurrentGameRef.current) {
      console.log('🎉 Game complete! Playing victory sound and showing win modal...');
      playVictory();
      setShowWinModal(true);
      hasPlayedVictoryForCurrentGameRef.current = true;
    }
  }, [isComplete, playVictory]);

  useEffect(() => {
    if (isBoardReady && imageUrl && imageUrl.length > 0 && !imageLoaded && !imageLoadError && !showDifficultyModal && !isComplete) {
      loadImage();
    }
  }, [isBoardReady, imageUrl, imageLoaded, imageLoadError, showDifficultyModal, isComplete, loadImage]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBoardReady && !isComplete && !isPaused && imageLoaded) {
      interval = setInterval(() => {
        incrementTime();
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBoardReady, isComplete, isPaused, imageLoaded, incrementTime]);

  const handleNewImage = () => {
    playClick();
    setImageLoaded(false);
    setImg(null);
    setShowWinModal(false);
    resetVictoryFlag();
    isLoadingImageRef.current = false;
    setIsPreviewBlurred(true);
    setPreviewReady(false);
    setShowDifficultyModal(true);
  };

  const handleNewGame = () => {
    playClick();
    setShowWinModal(false);
    resetVictoryFlag();
    setImageLoaded(false);
    setImg(null);
    isLoadingImageRef.current = false;
    setIsPreviewBlurred(true);
    setPreviewReady(false);
    setShowDifficultyModal(true);
  };

  const handleShuffle = () => {
    playClick();
    shuffleUnplaced();
  };

  const handleClearAll = () => {
    playClick();
    clearAllPieces();
  };

  const handlePauseResume = () => {
    playClick();
    if (isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  };

  const formatTime = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const displayCategory = (() => {
    if (category) return category;
    if (selectedCategory) return selectedCategory;
    return 'Случайная';
  })();
  const categoryEmoji = getCategoryEmoji(displayCategory);

  console.log('Render state:', { 
    imageLoaded, 
    imgExists: !!img, 
    previewCanvasExists: !!previewCanvasRef.current,
    previewReady,
    isBoardReady 
  });

  if (showLoadError || (imageLoadError && !showDifficultyModal && !imageLoaded)) {
    return (
      <Panel id={id} className={`puzzle-panel ${isLightTheme ? 'light-theme' : 'dark-theme'}`}>
        <StarsOnlyBackground />
        <div className="puzzle-glow-orb"></div>
        <div className="puzzle-glow-orb-2"></div>
        <PanelHeader before={<BackToMenu />}>
          ПАЗЛЫ
        </PanelHeader>
        <Group>
          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '20px' }}>
            <div style={{ color: '#ff6b6b', fontSize: '18px', textAlign: 'center' }}>
              ⚠️ Не удалось загрузить изображение
            </div>
            <div style={{ color: '#888', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>
              Попробуйте выбрать новую картинку
            </div>
            <Button onClick={handleNewImage}>
              Новая картинка
            </Button>
          </Box>
        </Group>
      </Panel>
    );
  }

  if (isInitializing || (isLoading && !showDifficultyModal)) {
    return (
      <Panel id={id} className={`puzzle-panel ${isLightTheme ? 'light-theme' : 'dark-theme'}`}>
        <StarsOnlyBackground />
        <div className="puzzle-glow-orb"></div>
        <div className="puzzle-glow-orb-2"></div>
        <PanelHeader before={<BackToMenu />}>
          ПАЗЛЫ
        </PanelHeader>
        <div className="puzzle-game-wrapper">
          <SkeletonLoader type="puzzle" />
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel id={id} className={`puzzle-panel ${isLightTheme ? 'light-theme' : 'dark-theme'}`}>
        <StarsOnlyBackground />
        <div className="puzzle-glow-orb"></div>
        <div className="puzzle-glow-orb-2"></div>
        <PanelHeader before={<BackToMenu />}>
          ПАЗЛЫ
        </PanelHeader>
        <Group>
          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '20px' }}>
            <div style={{ color: '#ff6b6b', fontSize: '18px', textAlign: 'center' }}>{error}</div>
            <Button onClick={() => {
              playClick();
              setShowDifficultyModal(true);
            }}>Попробовать снова</Button>
          </Box>
        </Group>
      </Panel>
    );
  }

  if (showDifficultyModal) {
    return (
      <Panel id={id} className={`puzzle-panel ${isLightTheme ? 'light-theme' : 'dark-theme'}`}>
        <StarsOnlyBackground />
        <div className="puzzle-glow-orb"></div>
        <div className="puzzle-glow-orb-2"></div>
        <PanelHeader before={<BackToMenu />}>
          ПАЗЛЫ
        </PanelHeader>
        <PuzzleDifficultyModal
          isOpen={true}
          onSelect={handleDifficultySelect}
          onClose={handleDifficultyModalClose}
        />
      </Panel>
    );
  }

  if (showWinModal) {
    return (
      <Panel id={id} className={`puzzle-panel ${isLightTheme ? 'light-theme' : 'dark-theme'}`}>
        <StarsOnlyBackground />
        <div className="puzzle-glow-orb"></div>
        <div className="puzzle-glow-orb-2"></div>
        <PanelHeader before={<BackToMenu />}>
          ПАЗЛЫ
        </PanelHeader>
        
        <div className="puzzle-top-bar">
          <div className="puzzle-stats-row">
            <div className="puzzle-stat-item">
              <span className="puzzle-stat-label">ВРЕМЯ</span>
              <span className="puzzle-stat-value">{formatTime(time)}</span>
            </div>
            <div className="puzzle-stat-item category">
              <span className="puzzle-stat-label">КАТЕГОРИЯ</span>
              <span className="puzzle-stat-value" style={{ fontSize: '14px' }}>
                {categoryEmoji} {displayCategory}
              </span>
            </div>
            <div className="puzzle-stat-item theme">
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        <div className="puzzle-game-wrapper">
          <div className="puzzle-container">
            <div className="puzzle-board">
              <canvas
                ref={canvasRef}
                style={{
                  width: `${boardSize + gap + boardSize}px`,
                  height: `${boardSize}px`,
                  borderRadius: '16px',
                  cursor: 'default',
                  touchAction: 'none',
                }}
              />
            </div>
            <div className="puzzle-sidebar">
              <div className="puzzle-preview">
                <div className="preview-label">КАК ДОЛЖНО ПОЛУЧИТЬСЯ</div>
                <div className="preview-canvas-wrapper" style={{ position: 'relative' }}>
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      width: `${previewSize}px`,
                      height: `${previewSize}px`,
                      borderRadius: '12px',
                      display: 'block',
                      cursor: 'pointer',
                      filter: isPreviewBlurred ? 'blur(10px)' : 'blur(0px)',
                      transition: 'filter 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
                    }}
                    onClick={handlePreviewClick}
                  />
                  {isPreviewBlurred && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '32px',
                        opacity: 0.7,
                        pointerEvents: 'none',
                        textShadow: '0 0 5px rgba(0,0,0,0.5)',
                      }}
                    >
                    </div>
                  )}
                </div>
                {isPreviewBlurred && (
                  <div style={{ fontSize: '10px', marginTop: '8px', opacity: 0.6 }}>
                    Нажмите, чтобы увидеть
                  </div>
                )}
              </div>
              <div className="puzzle-controls">
                <button onClick={handleNewImage}>НОВАЯ КАРТИНКА</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overlay">
          <div className="modal-card win">
            <div className="modal-icon">🎉</div>
            <div className="modal-title">Поздравляем!</div>
            <div className="modal-text">Вы собрали пазл за {formatTime(time)}</div>
            <button className="modal-btn" onClick={handleNewGame}>Новая игра</button>
          </div>
        </div>
      </Panel>
    );
  }

  if (!isBoardReady || !imageLoaded) {
    return (
      <Panel id={id} className={`puzzle-panel ${isLightTheme ? 'light-theme' : 'dark-theme'}`}>
        <StarsOnlyBackground />
        <div className="puzzle-glow-orb"></div>
        <div className="puzzle-glow-orb-2"></div>
        <PanelHeader before={<BackToMenu />}>
          ПАЗЛЫ
        </PanelHeader>
        <div className="puzzle-game-wrapper">
          <SkeletonLoader type="puzzle" />
        </div>
      </Panel>
    );
  }

  const totalWidth = boardSize + gap + boardSize;

  return (
    <Panel id={id} className={`puzzle-panel ${isLightTheme ? 'light-theme' : 'dark-theme'}`}>
      <StarsOnlyBackground />
      <div className="puzzle-glow-orb"></div>
      <div className="puzzle-glow-orb-2"></div>
      
      <PanelHeader before={<BackToMenu />}>
        ПАЗЛЫ
      </PanelHeader>
      
      <div className="puzzle-top-bar">
        <div className="puzzle-stats-row">
          <div className="puzzle-stat-item">
            <span className="puzzle-stat-label">ВРЕМЯ</span>
            <span className="puzzle-stat-value">{formatTime(time)}</span>
          </div>
          <div className="puzzle-stat-item category">
            <span className="puzzle-stat-label">КАТЕГОРИЯ</span>
            <span className="puzzle-stat-value" style={{ fontSize: '14px' }}>
              {categoryEmoji} {displayCategory}
            </span>
          </div>
          <div className="puzzle-stat-item theme">
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      <div className="puzzle-game-wrapper">
        <div className="puzzle-container">
          <div className="puzzle-board">
            <canvas
              ref={canvasRef}
              style={{
                width: `${totalWidth}px`,
                height: `${boardSize}px`,
                borderRadius: '16px',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                display: 'block',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={resetDrag}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={resetDrag}
            />
          </div>
          
          <div className="puzzle-sidebar">
            <div className="puzzle-preview">
              <div className="preview-label">КАК ДОЛЖНО ПОЛУЧИТЬСЯ</div>
              <div className="preview-canvas-wrapper" style={{ position: 'relative' }}>
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    width: `${previewSize}px`,
                    height: `${previewSize}px`,
                    borderRadius: '12px',
                    display: 'block',
                    cursor: 'pointer',
                    filter: isPreviewBlurred ? 'blur(10px)' : 'blur(0px)',
                    transition: 'filter 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
                  }}
                  onClick={handlePreviewClick}
                />
                {isPreviewBlurred && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '32px',
                      opacity: 0.7,
                      pointerEvents: 'none',
                      textShadow: '0 0 5px rgba(0,0,0,0.5)',
                    }}
                  >
                  </div>
                )}
              </div>
              {isPreviewBlurred && (
                <div style={{ fontSize: '10px', marginTop: '8px', opacity: 0.6 }}>
                  Нажмите, чтобы увидеть
                </div>
              )}
            </div>
            
            <div className="puzzle-controls">
              <button onClick={handleNewImage}>
                НОВАЯ КАРТИНКА
              </button>
              <button onClick={handleShuffle}>
                ПЕРЕМЕШАТЬ
              </button>
              <button onClick={handleClearAll}>
                ОЧИСТИТЬ ВСЁ
              </button>
              <button onClick={handlePauseResume}>
                {isPaused ? 'ПРОДОЛЖИТЬ' : 'ПАУЗА'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="puzzle-footer" />
      
      {isPaused && !isComplete && !showWinModal && (
        <div className="overlay">
          <div className="modal-card pause">
            <div className="modal-icon">⏸️</div>
            <div className="modal-title">Пауза</div>
            <button className="modal-btn" onClick={() => {
              playClick();
              resumeGame();
            }}>Продолжить</button>
          </div>
        </div>
      )}
    </Panel>
  );
};