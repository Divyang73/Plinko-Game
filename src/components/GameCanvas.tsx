import React, { useRef, useEffect } from 'react';
import { Ball } from '../classes/Ball';
import type { RiskLevel, RowCount } from '../types';

interface GameCanvasProps {
  rows: RowCount;
  risk: RiskLevel;
  onBallLanded: (ballId: string, multiplier: number, payout: number) => void;
  dropBall: { 
    animationPath: Array<{x: number, y: number, t: number}>;
    multiplier: number; 
    payout: number;
    slotIndex: number;
  } | null;
}

const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 40;

const RISK_COLORS = {
  low: '#00e701',
  medium: '#ffc000',
  high: '#ff003f'
};

interface Sink {
  x: number;
  baseY: number;
  multiplier: number;
}

const getMultipliers = (rows: RowCount, risk: RiskLevel) => {
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
  return base[rows][risk];
};

const getSinkPalette = (multiplier: number) => {
  if (multiplier >= 10) return { fill: '#00e701', text: '#0f212e' }; // Stake high (Green)
  if (multiplier >= 2) return { fill: '#00c701', text: '#0f212e' }; // Good win
  if (multiplier >= 1) return { fill: '#147a14', text: '#fff' }; // Break-even
  if (multiplier >= 0.5) return { fill: '#ffc000', text: '#0f212e' }; // Low return
  return { fill: '#ff003f', text: '#fff' }; // Losing
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

export const GameCanvas: React.FC<GameCanvasProps> = ({ rows, risk, onBallLanded, dropBall }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const ballsRef = useRef<Ball[]>([]);
  const pinsRef = useRef<Array<{ x: number; y: number }>>([]);
  const sinksRef = useRef<Sink[]>([]);
  
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
    const multipliers = getMultipliers(rows, risk);
    
    for (let i = 0; i < slotCount; i++) {
      sinks.push({
        x: startX + i * HORIZONTAL_SPACING,
        baseY: slotY,
        multiplier: multipliers[i]
      });
    }
    
    sinksRef.current = sinks;
  }, [rows, risk]);
  
  const sinkAnimationsRef = useRef<Record<number, number>>({});
  const floatingTextsRef = useRef<Array<{ id: string; x: number; y: number; text: string; color: string; timestamp: number }>>([]);
  
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
    }
  }, [dropBall, risk]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      ctx.fillStyle = '#0f212e'; // Stake background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw pegs
      pinsRef.current.forEach(peg => {
        ctx.fillStyle = '#213743'; // Stake peg color
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, 8, 0, Math.PI * 2);
        ctx.fill();
      });
      
      const now = Date.now();
      
      // Draw Sinks
      sinksRef.current.forEach((sink, i) => {
        const hitTime = sinkAnimationsRef.current[i] || 0;
        const timeSinceHit = now - hitTime;
        
        let yOffset = 0;
        let scale = 1;
        let glow = false;
        
        if (timeSinceHit < 300) {
          const progress = timeSinceHit / 300;
          yOffset = Math.sin(progress * Math.PI) * 8; // push down by 8px
          scale = 1 + Math.sin(progress * Math.PI) * 0.15; // pulse size slightly
          glow = true;
        }
        
        const y = sink.baseY + yOffset;
        const palette = getSinkPalette(sink.multiplier);
        
        ctx.save();
        if (glow) {
          ctx.shadowColor = palette.fill;
          ctx.shadowBlur = 15;
        }
        ctx.fillStyle = palette.fill;
        const w = 36 * scale;
        const h = 36 * scale;
        drawRoundedRect(ctx, sink.x - w / 2, y - h / 2, w, h, 6);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.fillStyle = palette.text;
        ctx.font = `bold ${12 * scale}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${sink.multiplier}x`, sink.x, y);
        ctx.restore();
      });
      
      // Draw Floating Texts
      floatingTextsRef.current = floatingTextsRef.current.filter(ft => {
        const elapsed = now - ft.timestamp;
        if (elapsed > 1000) return false;
        
        const progress = elapsed / 1000;
        const y = ft.y - (progress * 60); // float up 60px
        const opacity = 1 - progress; // fade out
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, opacity);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, y);
        ctx.restore();
        
        return true;
      });
      
      // Draw Balls
      ballsRef.current = ballsRef.current.filter(ball => {
        ball.update();
        
        if (ball.justLanded) {
          ball.justLanded = false;
          
          sinkAnimationsRef.current[ball.slotIndex] = now;
          const sink = sinksRef.current[ball.slotIndex];
          floatingTextsRef.current.push({
            id: `text-${now}-${Math.random()}`,
            x: sink.x,
            y: sink.baseY - 20,
            text: `+${ball.multiplier}x`,
            color: getSinkPalette(ball.multiplier).fill,
            timestamp: now
          });
          
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
  }, [rows, risk, onBallLanded]);
  
  // Calculate dynamic height to remove empty space for 8 rows
  const canvasHeight = rows === 8 ? 550 : 700;
  
  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={canvasHeight}
      className="canvas-frame w-full max-w-[600px]"
      style={{ aspectRatio: `600 / ${canvasHeight}` }}
    />
  );
};