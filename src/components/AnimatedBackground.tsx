import { FC, useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../store/themeStore';

interface RunningRobot {
  x: number;
  y: number;
  frame: number;
  direction: 'left' | 'right';
  speed: number;
}

export const AnimatedBackground: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useThemeStore();
  const animationRef = useRef<number>();
  const robotsRef = useRef<RunningRobot[]>([]);
  const frameCounterRef = useRef(0);
  const [robotSprite, setRobotSprite] = useState<HTMLImageElement | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState(false);

  const FRAME_WIDTH = 300;
  const FRAME_HEIGHT = 317;
  const TOTAL_FRAMES = 8;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.log('Robot sprite loaded! Size:', img.width, 'x', img.height);
      setRobotSprite(img);
      setSpriteLoaded(true);
    };
    img.onerror = (e) => {
      console.error('Failed to load robot sprite:', e);
    };
    img.src = '/sprites/robot.png';
  }, []);

  const isTooClose = (newRobot: RunningRobot, existingRobots: RunningRobot[], minDistance: number) => {
    for (const robot of existingRobots) {
      const dx = Math.abs(newRobot.x - robot.x);
      const dy = Math.abs(newRobot.y - robot.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (!spriteLoaded || !robotSprite) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initRobots();
    };

    const initRobots = () => {
      const robots: RunningRobot[] = [];
      const count = 10;
      const minDistance = Math.min(canvas.width, canvas.height) / 3;
      let attempts = 0;
      const maxAttempts = 100;
      
      for (let i = 0; i < count; i++) {
        let newRobot: RunningRobot | null = null;
        let found = false;
        attempts = 0;
        
        while (!found && attempts < maxAttempts) {
          const randomX = 50 + Math.random() * (canvas.width - 100);
          const randomY = 50 + Math.random() * (canvas.height - 100);
          
          const candidate: RunningRobot = {
            x: randomX,
            y: randomY,
            frame: Math.floor(Math.random() * TOTAL_FRAMES),
            direction: Math.random() > 0.5 ? 'left' : 'right',
            speed: 1.5 + Math.random() * 1.0,
          };
          
          if (!isTooClose(candidate, robots, minDistance)) {
            newRobot = candidate;
            found = true;
          }
          attempts++;
        }
        
        if (newRobot) {
          robots.push(newRobot);
        } else {
          robots.push({
            x: 50 + Math.random() * (canvas.width - 100),
            y: 50 + Math.random() * (canvas.height - 100),
            frame: Math.floor(Math.random() * TOTAL_FRAMES),
            direction: Math.random() > 0.5 ? 'left' : 'right',
            speed: 1.5 + Math.random() * 1.0,
          });
        }
      }
      
      robotsRef.current = robots;
      console.log('Robots initialized:', robots.length);
    };

    const updateRobots = () => {
      for (const robot of robotsRef.current) {
        if (robot.direction === 'right') {
          robot.x += robot.speed;
          if (robot.x > canvas.width + 100) {
            robot.x = -100;
          }
        } else {
          robot.x -= robot.speed;
          if (robot.x < -100) {
            robot.x = canvas.width + 100;
          }
        }
      }
    };

    const drawRobot = (robot: RunningRobot) => {
      if (!ctx) return;
      if (!robotSprite) return;
      
      const animationSpeed = 8;
      const currentFrame = Math.floor(frameCounterRef.current / animationSpeed) % TOTAL_FRAMES;
      const frameX = currentFrame * FRAME_WIDTH;
      const frameY = 0;
      
      ctx.save();
      ctx.translate(robot.x, robot.y);
      
      if (robot.direction === 'left') {
        ctx.scale(-1, 1);
      }
      
      const scale = 0.4;
      ctx.scale(scale, scale);
      
      ctx.drawImage(
        robotSprite,
        frameX,
        frameY,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        -FRAME_WIDTH / 2,
        -FRAME_HEIGHT / 2,
        FRAME_WIDTH,
        FRAME_HEIGHT
      );
      
      ctx.restore();
    };

   const drawBackground = () => {
        if (!ctx) return;
        
        const isDark = theme === 'dark';
        
        // Градиентный фон
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (isDark) {
            gradient.addColorStop(0, '#0a0a1a');
            gradient.addColorStop(0.5, '#1a1a3e');
            gradient.addColorStop(1, '#0f3460');
        } else {
            // Яркий голубой градиент для светлой темы
            gradient.addColorStop(0, '#1a6dd4');
            gradient.addColorStop(0.3, '#3a8de8');
            gradient.addColorStop(0.6, '#5aadfc');
            gradient.addColorStop(1, '#7acdff');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Звёздочки/частицы (яркие и заметные)
        ctx.globalAlpha = isDark ? 0.5 : 0.55;
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
        ctx.globalAlpha = isDark ? 0.7 : 0.75;
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
        ctx.globalAlpha = isDark ? 0.4 : 0.45;
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
      if (!canvas || !ctx) return;
      
      drawBackground();
      
      for (const robot of robotsRef.current) {
        drawRobot(robot);
      }
      
      updateRobots();
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
  }, [theme, spriteLoaded, robotSprite]);

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