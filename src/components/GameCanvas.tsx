import React, { useRef, useEffect } from 'react';
import { Ball } from '../classes/Ball';
import type { RiskLevel, RowCount, StarBonus } from '../types';

interface GameCanvasProps {
  rows: RowCount;
  risk: RiskLevel;
  onBallLanded: (ballId: string, multiplier: number, payout: number) => void;
  dropBall: { 
    animationPath: Array<{x: number, y: number, t: number}>;
    multiplier: number; 
    payout: number;
    slotIndex: number;
    star: StarBonus;
  } | null;
  playWithStars: boolean;
}

const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 40;
const STAR_COLLECT_RADIUS = 18;
const STAR_RTP_ADJUSTMENT = 0.975;

const RISK_COLORS = {
  low: '#00e701',
  medium: '#ffc000',
  high: '#ff003f'
};

interface Sink {
  x: number;
  baseY: number;
  glowIntensity: number;
  multiplier: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

interface PegState {
  x: number;
  y: number;
  glow: number;
  scale: number;
  sparks: Spark[];
  lastSparkTime: number;
}

interface StarInstance {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  bonusAmount: number;
  ballId: string;
  pulseOffset: number;
  opacity: number;
  scale: number;
  triggeredTime: number | null;
  fadeOut: boolean;
}

interface GlitterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
  twinkleOffset: number;
}

interface SinkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
  twinkle: number;
  sinkX: number;
}

const adjustMultiplier = (value: number, playWithStars: boolean) => {
  const adjusted = playWithStars ? value * STAR_RTP_ADJUSTMENT : value;
  return Math.round(adjusted * 1000) / 1000;
};

const getMultipliers = (rows: RowCount, risk: RiskLevel, playWithStars: boolean) => {
  const base: Record<RowCount, Record<RiskLevel, number[]>> = {
    8: {
      low: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
      medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
      high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
    },
    12: {
      low: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
      medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
      high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
    }
  };

  return base[rows][risk].map(value => adjustMultiplier(value, playWithStars));
};

const getSinkPalette = (multiplier: number, playWithStars: boolean) => {
  const tier = multiplier >= 10 ? 'high' : multiplier >= 2 ? 'mid' : 'low';

  if (playWithStars) {
    if (tier === 'high') return { fill: 'rgba(255, 196, 72, 0.3)', edge: 'rgba(255, 218, 140, 0.85)', hue: 48 };
    if (tier === 'mid') return { fill: 'rgba(0, 231, 255, 0.2)', edge: 'rgba(120, 242, 255, 0.75)', hue: 190 };
    return { fill: 'rgba(140, 160, 190, 0.18)', edge: 'rgba(160, 180, 210, 0.6)', hue: 210 };
  }

  if (tier === 'high') return { fill: 'rgba(255, 86, 120, 0.22)', edge: 'rgba(255, 136, 176, 0.75)', hue: 330 };
  if (tier === 'mid') return { fill: 'rgba(0, 200, 150, 0.18)', edge: 'rgba(120, 240, 200, 0.6)', hue: 165 };
  return { fill: 'rgba(120, 140, 170, 0.18)', edge: 'rgba(160, 180, 200, 0.6)', hue: 200 };
};

const drawStarShape = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, innerRadius: number) => {
  const points = 5;
  const step = Math.PI / points;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius : innerRadius;
    const angle = i * step - Math.PI / 2;
    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  ctx.closePath();
};

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const spawnSparks = (peg: PegState, color: string) => {
  const count = 3;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 1.2;
    peg.sparks.push({
      x: peg.x,
      y: peg.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 1,
      size: 2 + Math.random() * 1.2,
      color
    });
  }
};

const spawnStarGlitter = (particles: GlitterParticle[], x: number, y: number) => {
  const count = 16;
  const hues = [48, 56, 210, 300];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.35 + Math.random() * 1.0;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.9,
      life: 1,
      size: 2 + Math.random() * 2.4,
      hue: hues[Math.floor(Math.random() * hues.length)],
      twinkleOffset: Math.random() * Math.PI * 2
    });
  }
};

const spawnSinkDust = (particles: SinkParticle[], x: number, y: number, hue: number) => {
  const count = 14;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.9;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.7,
      life: 1,
      size: 2 + Math.random() * 2,
      hue,
      twinkle: Math.random() * Math.PI * 2,
      sinkX: x
    });
  }
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ rows, risk, onBallLanded, dropBall, playWithStars }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const ballsRef = useRef<Ball[]>([]);
  const pinsRef = useRef<Array<{ x: number; y: number }>>([]);
  const pegStatesRef = useRef<PegState[]>([]);
  const sinksRef = useRef<Sink[]>([]);
  const starsRef = useRef<StarInstance[]>([]);
  const glitterRef = useRef<GlitterParticle[]>([]);
  const sinkDustRef = useRef<SinkParticle[]>([]);
  const lastFrameRef = useRef<number>(performance.now());
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const pins: Array<{ x: number; y: number }> = [];
    
    for (let row = 0; row < rows; row++) {
      const pinsInRow = row + 2;
      const rowWidth = (pinsInRow - 1) * HORIZONTAL_SPACING;
      const startX = centerX - rowWidth / 2;
      const y = 100 + row * VERTICAL_SPACING;
      
      for (let col = 0; col < pinsInRow; col++) {
        pins.push({
          x: (startX + col * HORIZONTAL_SPACING),
          y
        });
      }
    }
    
    pinsRef.current = pins;
    pegStatesRef.current = pins.map(pin => ({
      x: pin.x,
      y: pin.y,
      glow: 0,
      scale: 1,
      sparks: [],
      lastSparkTime: 0
    }));
  }, [rows]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const slotCount = rows + 1;
    const totalWidth = slotCount * HORIZONTAL_SPACING;
    const startX = centerX - totalWidth / 2 + HORIZONTAL_SPACING / 2;
    const slotY = (rows + 1) * VERTICAL_SPACING + 100;
    
    const sinks: Sink[] = [];
    const multipliers = getMultipliers(rows, risk, playWithStars);
    
    for (let i = 0; i < slotCount; i++) {
      sinks.push({
        x: startX + i * HORIZONTAL_SPACING,
        baseY: slotY,
        glowIntensity: 0,
        multiplier: multipliers[i]
      });
    }
    
    sinksRef.current = sinks;
  }, [rows, risk, playWithStars]);
  
  useEffect(() => {
    if (dropBall && dropBall.animationPath.length > 0) {
      const color = RISK_COLORS[risk];
      const ball = new Ball(
        dropBall.animationPath,
        color,
        dropBall.multiplier,
        dropBall.payout,
        dropBall.slotIndex
      );
      
      ballsRef.current.push(ball);
      
      if (playWithStars) {
        starsRef.current.push({
          id: `star-${ball.id}`,
          x: dropBall.star.x,
          y: dropBall.star.y,
          collected: dropBall.star.collected,
          bonusAmount: dropBall.star.bonusAmount,
          ballId: ball.id,
          pulseOffset: Math.random() * Math.PI * 2,
          opacity: 1,
          scale: 1,
          triggeredTime: null,
          fadeOut: false
        });
      }
    }
  }, [dropBall, risk, playWithStars]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = (now: number) => {
      const delta = Math.min(33, now - lastFrameRef.current);
      lastFrameRef.current = now;
      
      ctx.fillStyle = '#0b1724';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      pegStatesRef.current.forEach(peg => {
        peg.glow *= 0.85;
        peg.scale += (1 - peg.scale) * 0.2;
        peg.sparks.forEach(spark => {
          spark.vy += 0.025 * (delta / 16);
          spark.x += spark.vx;
          spark.y += spark.vy;
          spark.life -= 0.07 * (delta / 16);
        });
        peg.sparks = peg.sparks.filter(spark => spark.life > 0);
      });
      
      ballsRef.current.forEach(ball => {
        pegStatesRef.current.forEach(peg => {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 25) {
            const intensity = 1 - dist / 25;
            peg.glow = Math.max(peg.glow, intensity);
            peg.scale = Math.max(peg.scale, 1.18);
            if (now - peg.lastSparkTime > 160) {
              spawnSparks(peg, RISK_COLORS[risk]);
              peg.lastSparkTime = now;
            }
          }
        });
      });
      
      ctx.shadowColor = '#1a3a4d';
      ctx.shadowBlur = 12;
      pegStatesRef.current.forEach(peg => {
        ctx.save();
        const glowColor = RISK_COLORS[risk];
        if (peg.glow > 0.05) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 20 * peg.glow;
        }
        ctx.fillStyle = '#2a4a5d';
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, 10 * peg.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.shadowBlur = 0;
      
      pegStatesRef.current.forEach(peg => {
        peg.sparks.forEach(spark => {
          ctx.save();
          ctx.globalAlpha = spark.life;
          ctx.fillStyle = spark.color;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      });
      
      sinksRef.current.forEach(sink => {
        sink.glowIntensity *= 0.9;
        if (sink.glowIntensity < 0.01) sink.glowIntensity = 0;
      });
      
      sinksRef.current.forEach(sink => {
        const y = sink.baseY;
        const palette = getSinkPalette(sink.multiplier, playWithStars);
        const isPulsing = sink.glowIntensity > 0;
        
        const gradient = ctx.createLinearGradient(sink.x - 18, y - 18, sink.x + 18, y + 24);
        gradient.addColorStop(0, palette.fill);
        gradient.addColorStop(1, 'rgba(8, 15, 26, 0.6)');
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.shadowColor = palette.edge;
        ctx.shadowBlur = isPulsing ? 24 * sink.glowIntensity : 12;
        drawRoundedRect(ctx, sink.x - 18, y - 22, 36, 44, 12);
        ctx.fill();
        ctx.strokeStyle = palette.edge;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
        
        ctx.save();
        ctx.fillStyle = playWithStars ? '#ffe8a4' : '#a7f3ff';
        ctx.font = `bold ${12 + sink.glowIntensity * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${sink.multiplier}x`, sink.x, y);
        ctx.restore();
      });
      
      if (playWithStars) {
        starsRef.current = starsRef.current.filter(star => {
          const ball = ballsRef.current.find(active => active.id === star.ballId);
          if (star.collected && !star.triggeredTime && ball) {
            const dist = Math.hypot(ball.x - star.x, ball.y - star.y);
            if (dist <= STAR_COLLECT_RADIUS) {
              star.triggeredTime = now;
              spawnStarGlitter(glitterRef.current, star.x, star.y);
            }
          }
          
          if (!ball && !star.triggeredTime) {
            star.fadeOut = true;
          }
          
          if (star.triggeredTime) {
            const progress = (now - star.triggeredTime) / 800;
            star.scale = 1 + progress * 0.55;
            star.opacity = Math.max(0, 1 - progress);
            if (progress >= 1) {
              return false;
            }
          } else if (star.fadeOut) {
            star.opacity -= 0.02;
            if (star.opacity <= 0) {
              return false;
            }
          } else {
            star.scale = 1 + 0.08 * Math.sin(now * 0.005 + star.pulseOffset);
          }
          return true;
        });
      } else {
        starsRef.current = [];
        glitterRef.current = [];
      }
      
      glitterRef.current = glitterRef.current.filter(particle => {
        particle.vy += 0.035 * (delta / 16);
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.018 * (delta / 16);
        return particle.life > 0;
      });
      
      sinkDustRef.current = sinkDustRef.current.filter(particle => {
        particle.vy += 0.04 * (delta / 16);
        particle.vx += (particle.sinkX - particle.x) * 0.001;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02 * (delta / 16);
        return particle.life > 0;
      });
      
      if (playWithStars) {
        starsRef.current.forEach(star => {
          ctx.save();
          ctx.globalAlpha = star.opacity;
          const gradient = ctx.createRadialGradient(star.x, star.y, 2, star.x, star.y, 20);
          gradient.addColorStop(0, 'rgba(255, 255, 210, 1)');
          gradient.addColorStop(0.4, 'rgba(255, 215, 90, 0.95)');
          gradient.addColorStop(1, 'rgba(255, 215, 90, 0)');
          ctx.shadowColor = '#ffe07a';
          ctx.shadowBlur = star.triggeredTime ? 32 : 24;
          drawStarShape(ctx, star.x, star.y, 11 * star.scale, 4.8 * star.scale);
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.restore();
          
          if (star.triggeredTime) {
            const popupProgress = (now - star.triggeredTime) / 950;
            if (popupProgress < 1) {
              ctx.save();
              ctx.globalAlpha = 1 - popupProgress;
              ctx.fillStyle = '#ffeaa7';
              ctx.font = '600 15px "Inter", Arial';
              ctx.textAlign = 'center';
              ctx.shadowColor = 'rgba(255, 234, 167, 0.8)';
              ctx.shadowBlur = 12;
              ctx.fillText(
                `Star Bonus +$${star.bonusAmount.toFixed(2)}`,
                star.x,
                star.y - 14 - popupProgress * 20
              );
              ctx.restore();
            }
          }
        });
        
        glitterRef.current.forEach(particle => {
          const shimmer = 0.6 + 0.4 * Math.sin(now * 0.02 + particle.twinkleOffset);
          const alpha = Math.max(0, particle.life) * shimmer;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `hsla(${particle.hue}, 90%, 72%, ${alpha})`;
          ctx.shadowColor = `hsla(${particle.hue}, 90%, 72%, ${alpha})`;
          ctx.shadowBlur = 10 * shimmer;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }
      
      sinkDustRef.current.forEach(particle => {
        const shimmer = 0.6 + 0.4 * Math.sin(now * 0.02 + particle.twinkle);
        const alpha = Math.max(0, particle.life) * shimmer;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 70%, ${alpha})`;
        ctx.shadowColor = `hsla(${particle.hue}, 70%, 70%, ${alpha})`;
        ctx.shadowBlur = 12 * shimmer;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      ballsRef.current = ballsRef.current.filter(ball => {
        ball.update();
        
        if (ball.justLanded) {
          ball.justLanded = false;
          const sinkIndex = ball.slotIndex;
          if (sinkIndex >= 0 && sinkIndex < sinksRef.current.length) {
            sinksRef.current[sinkIndex].glowIntensity = 1;
            const palette = getSinkPalette(sinksRef.current[sinkIndex].multiplier, playWithStars);
            spawnSinkDust(sinkDustRef.current, sinksRef.current[sinkIndex].x, sinksRef.current[sinkIndex].baseY, palette.hue);
          }
          onBallLanded(ball.id, ball.multiplier, ball.payout);
        }
        
        ball.draw(ctx);
        return !ball.isFinished;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rows, risk, onBallLanded, playWithStars]);
  
  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={700}
      className="canvas-frame"
    />
  );
};