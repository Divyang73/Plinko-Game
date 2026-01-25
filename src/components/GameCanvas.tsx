import React, { useRef, useEffect } from 'react';
import { Ball } from '../classes/Ball';
import type { RiskLevel, RowCount } from '../types';

interface GameCanvasProps {
  rows: RowCount;
  risk: RiskLevel;
  onBallLanded: (ballId: string, multiplier: number, payout: number) => void;
  dropBall: { point: number; path: number[]; multiplier: number; payout: number } | null;
}

const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 40;

// Risk level colors
const RISK_COLORS = {
  low: '#00e701',
  medium: '#ffc000',
  high: '#ff003f'
};

interface Sink {
  x: number;
  baseY: number;
  offsetY: number;
  glowIntensity: number;
  multiplier: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ rows, risk, onBallLanded, dropBall }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const ballsRef = useRef<Ball[]>([]);
  const pinsRef = useRef<Array<{ x: number; y: number }>>([]);
  const sinksRef = useRef<Sink[]>([]);
  
  // Generate pins based on rows
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
          x: (startX + col * HORIZONTAL_SPACING) * 1000, // Convert to integer scale
          y: y * 1000
        });
      }
    }
    
    pinsRef.current = pins;
  }, [rows]);
  
  // Generate slots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const slotCount = rows + 1;
    const totalWidth = slotCount * HORIZONTAL_SPACING;
    const startX = centerX - totalWidth / 2 + HORIZONTAL_SPACING / 2;
    const slotY = (rows + 1) * VERTICAL_SPACING + 100;
    
    const sinks: Sink[] = [];
    
    // Import multipliers from server
    const MULTIPLIERS: Record<RowCount, Record<RiskLevel, number[]>> = {
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
    
    const multipliers = MULTIPLIERS[rows][risk];
    
    for (let i = 0; i < slotCount; i++) {
      sinks.push({
        x: startX + i * HORIZONTAL_SPACING,
        baseY: slotY,
        offsetY: 0,
        glowIntensity: 0,
        multiplier: multipliers[i]
      });
    }
    
    sinksRef.current = sinks;
  }, [rows, risk]);
  
  // Handle ball drop
  useEffect(() => {
    if (dropBall) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const color = RISK_COLORS[risk];
      const ball = new Ball(dropBall.point, 50000, color, dropBall.path, dropBall.multiplier, dropBall.payout);
      
      // Add to active balls array (don't replace)
      ballsRef.current.push(ball);
    }
  }, [dropBall, risk]);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const slotY = (rows + 1) * VERTICAL_SPACING + 100;
    
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#0f212e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw pins
      ctx.fillStyle = '#2a4a5d';
      ctx.shadowColor = '#1a3a4d';
      ctx.shadowBlur = 10;
      
      pinsRef.current.forEach(pin => {
        ctx.beginPath();
        ctx.arc(pin.x / 1000, pin.y / 1000, 10, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.shadowBlur = 0;
      
      // Update sink animations
      sinksRef.current.forEach(sink => {
        // Spring back up
        sink.offsetY *= 0.85;
        if (Math.abs(sink.offsetY) < 0.1) sink.offsetY = 0;
        
        // Fade glow
        sink.glowIntensity *= 0.92;
        if (sink.glowIntensity < 0.01) sink.glowIntensity = 0;
      });
      
      // Draw sinks with multipliers
      sinksRef.current.forEach(sink => {
        const y = sink.baseY + sink.offsetY;
        const isPulsing = sink.glowIntensity > 0;
        const pulseScale = isPulsing ? 1 + sink.glowIntensity * 0.2 : 1;
        
        // Slot box
        ctx.save();
        ctx.fillStyle = sink.multiplier > 10 ? 'rgba(255, 0, 63, 0.2)' : 
                       sink.multiplier > 2 ? 'rgba(255, 192, 0, 0.2)' :
                       sink.multiplier >= 1 ? 'rgba(0, 231, 1, 0.2)' :
                       'rgba(100, 100, 100, 0.2)';
        
        if (isPulsing) {
          ctx.shadowColor = RISK_COLORS[risk];
          ctx.shadowBlur = 20 * sink.glowIntensity;
        }
        
        ctx.fillRect(sink.x - 15, y - 20, 30, 40);
        ctx.restore();
        
        // Multiplier text
        ctx.save();
        ctx.fillStyle = sink.multiplier > 10 ? '#ff003f' :
                       sink.multiplier > 2 ? '#ffc000' :
                       sink.multiplier >= 1 ? '#00e701' :
                       '#888888';
        ctx.font = `bold ${12 * pulseScale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isPulsing) {
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 10 * sink.glowIntensity;
        }
        
        ctx.fillText(`${sink.multiplier}x`, sink.x, y);
        ctx.restore();
      });
      
      // Update and draw all balls
      ballsRef.current = ballsRef.current.filter(ball => {
        // Update ball physics
        ball.update(pinsRef.current, canvas.height, slotY);
        
        // Check if ball just landed in sink (using flag to avoid timing issues)
        if (ball.justLanded) {
          ball.justLanded = false; // Reset flag
          
          // Trigger sink bounce animation
          const sinkIndex = ball.getSinkIndex(rows, canvas.width);
          if (sinkIndex >= 0 && sinkIndex < sinksRef.current.length) {
            sinksRef.current[sinkIndex].offsetY = 8; // Push down 8px
            sinksRef.current[sinkIndex].glowIntensity = 1; // Full glow
          }
          
          // Notify parent that ball landed
          onBallLanded(ball.id, ball.multiplier, ball.payout);
        }
        
        // Draw ball
        ball.draw(ctx);
        
        // Keep ball if not finished
        return !ball.isFinished;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rows, risk, onBallLanded]);
  
  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={700}
      className="border-2 border-stake-light rounded-lg"
    />
  );
};
