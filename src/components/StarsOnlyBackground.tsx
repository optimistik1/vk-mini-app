import { FC, useEffect, useRef } from 'react';
import { useThemeStore } from '../store/themeStore';

export const StarsOnlyBackground: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useThemeStore();
  const animationRef = useRef<number>();
  const frameCounterRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawBackground = () => {
      if (!ctx) return;
      
      const isDark = theme === 'dark';
      
      // Полностью прозрачный фон (не перекрываем градиент из CSS)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Звёздочки/частицы (яркие и заметные)
      ctx.globalAlpha = isDark ? 0.6 : 0.55;
      for (let i = 0; i < 150; i++) {
        const x = (i * 131) % canvas.width;
        const y = (i * 253) % canvas.height;
        const size = 1.5 + (i % 4);
        const brightness = 0.5 + Math.sin(i) * 0.3;
        if (isDark) {
          ctx.fillStyle = `rgba(79, 195, 247, ${brightness})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
        }
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Мерцающие большие звёзды (очень заметные)
      ctx.globalAlpha = isDark ? 0.8 : 0.75;
      for (let i = 0; i < 60; i++) {
        const x = (i * 791) % canvas.width;
        const y = (i * 157) % canvas.height;
        const twinkle = Math.sin(frameCounterRef.current * 0.05 + i) * 0.4 + 0.6;
        if (isDark) {
          ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.7})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.9})`;
        }
        ctx.beginPath();
        ctx.arc(x, y, 2.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Дополнительные блестящие точки
      ctx.globalAlpha = isDark ? 0.5 : 0.45;
      for (let i = 0; i < 100; i++) {
        const x = (i * 577) % canvas.width;
        const y = (i * 349) % canvas.height;
        const twinkle = Math.sin(frameCounterRef.current * 0.08 + i) * 0.5 + 0.5;
        if (isDark) {
          ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.5})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.7})`;
        }
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    };

    const animate = () => {
      drawBackground();
      frameCounterRef.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
};