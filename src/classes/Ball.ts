// Integer physics Ball class with ×1000 scale factor
export class Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isActive: boolean;
  
  state: 'falling' | 'landed' | 'fading' | 'finished' = 'falling';
  landedTime: number = 0;
  opacity: number = 1;
  justLanded: boolean = false;
  
  multiplier: number;
  payout: number;
  slotIndex: number; // The target slot
  
  // Physics constants (×1000 scale)
  private readonly GRAVITY = 1500;
  private readonly DAMPING = 980;
  private readonly HORIZONTAL_SPEED = 3500; // Fixed horizontal velocity for bounces
  
  // Path data
  private path: number[];
  private rows: number;
  private lastRowProcessed: number = -1;
  
  // Layout constants (must match GameCanvas)
  private readonly FIRST_ROW_Y = 100;
  private readonly ROW_SPACING = 40;
  private readonly SLOT_WIDTH = 40;
  
  // Position correction constants
  private readonly CORRECTION_STRENGTH = 0.25;
  private readonly VELOCITY_DAMPING = 0.7;
  
  // Trail effect
  private trail: Array<{ x: number; y: number; alpha: number }> = [];
  private readonly MAX_TRAIL_LENGTH = 10;
  
  constructor(
    startX: number, 
    startY: number, 
    color: string, 
    path: number[], 
    multiplier: number, 
    payout: number,
    slotIndex: number,
    rows: number
  ) {
    this.id = `ball-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.radius = 8000;
    this.color = color;
    this.isActive = true;
    this.path = path;
    this.multiplier = multiplier;
    this.payout = payout;
    this.slotIndex = slotIndex;
    this.rows = rows;
  }
  
  update(pins: Array<{ x: number; y: number }>, _canvasHeight: number, sinkY: number, canvasWidth: number): void {
    if (!this.isActive) return;
    
    if (this.state === 'falling') {
      // Trail
      this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
      if (this.trail.length > this.MAX_TRAIL_LENGTH) {
        this.trail.shift();
      }
      this.trail.forEach((point, index) => {
        point.alpha = (index + 1) / this.trail.length * 0.6;
      });
      
      // Apply gravity
      this.vy += this.GRAVITY;
      
      // Update position
      this.x += this.vx;
      this.y += this.vy;
      
      // Apply damping
      this.vx = (this.vx * this.DAMPING) / 1000;
      this.vy = (this.vy * this.DAMPING) / 1000;
      
      // CORE FIX: Determine current row by Y position
      const ballYPixels = this.y / 1000;
      const currentRow = Math.floor((ballYPixels - this.FIRST_ROW_Y + this.ROW_SPACING / 2) / this.ROW_SPACING);
      
      // Process path direction ONCE per row
      if (currentRow > this.lastRowProcessed && currentRow >= 0 && currentRow < this.rows) {
        this.lastRowProcessed = currentRow;
        
        if (currentRow < this.path.length) {
          // FORCE horizontal direction based on path (0 = left, 1 = right)
          const goRight = this.path[currentRow] === 1;
          this.vx = goRight ? this.HORIZONTAL_SPEED : -this.HORIZONTAL_SPEED;
        }
      }
      
      // Pin collisions - only for visual bounce, direction already set by path
      for (const pin of pins) {
        const dx = this.x - pin.x;
        const dy = this.y - pin.y;
        const distSq = dx * dx + dy * dy;
        const minDist = 10000 + this.radius; // pin radius + ball radius (×1000)
        const minDistSq = minDist * minDist;
        
        if (distSq < minDistSq && distSq > 0) {
          // Push ball away from pin (separation only)
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          
          this.x += nx * overlap;
          this.y += ny * overlap;
          
          // Bounce vertical velocity
          if (this.vy < 0) {
            this.vy = Math.abs(this.vy) * 0.5;
          }
          
          break;
        }
      }
      
      // AFTER all rows processed, guide ball toward correct slot
      if (this.lastRowProcessed >= this.rows - 1) {
        const targetX = this.getSlotCenterX(canvasWidth);
        
        // Strong lerp toward target slot
        this.x += (targetX - this.x) * this.CORRECTION_STRENGTH;
        this.vx *= this.VELOCITY_DAMPING;
      }
      
      // Check if reached sink
      if (this.y >= sinkY * 1000) {
        this.state = 'landed';
        this.landedTime = Date.now();
        this.vx = 0;
        this.vy = 0;
        this.y = sinkY * 1000;
        
        // Force final position to exact slot center
        this.x = this.getSlotCenterX(canvasWidth);
        
        this.justLanded = true;
        
        // Debug logging
        const actualSlot = this.getSinkIndex(this.rows, canvasWidth);
        console.log('[Ball landed]', {
          path: this.path.join(','),
          pathSum: this.path.reduce((s, d) => s + d, 0),
          expectedSlot: this.slotIndex,
          actualSlot,
          multiplier: this.multiplier,
          match: actualSlot === this.slotIndex ? '✅' : '❌ MISMATCH'
        });
      }
    } else if (this.state === 'landed') {
      if (Date.now() - this.landedTime > 500) {
        this.state = 'fading';
      }
    } else if (this.state === 'fading') {
      this.opacity -= 0.05;
      if (this.opacity <= 0) {
        this.state = 'finished';
        this.isActive = false;
      }
    }
  }
  
  get isFinished(): boolean {
    return this.state === 'finished';
  }
  
  // Calculate the target X position for a given slot
  private getSlotCenterX(canvasWidth: number): number {
    const totalSlots = this.rows + 1;
    const totalWidth = totalSlots * this.SLOT_WIDTH;
    const startX = (canvasWidth / 2 - totalWidth / 2 + this.SLOT_WIDTH / 2) * 1000;
    return startX + this.slotIndex * this.SLOT_WIDTH * 1000;
  }
  
  getSinkIndex(rows: number, canvasWidth: number): number {
    const slotCount = rows + 1;
    const totalWidth = slotCount * this.SLOT_WIDTH;
    const startX = (canvasWidth / 2 - totalWidth / 2 + this.SLOT_WIDTH / 2) * 1000;
    
    const relativeX = this.x - startX;
    const slotIndex = Math.round(relativeX / (this.SLOT_WIDTH * 1000));
    return Math.max(0, Math.min(rows, slotIndex));
  }
  
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    // Draw trail
    this.trail.forEach((point) => {
      ctx.save();
      ctx.globalAlpha = point.alpha * this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(point.x / 1000, point.y / 1000, this.radius / 1000 * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    
    // Draw ball
    const x = this.x / 1000;
    const y = this.y / 1000;
    const r = this.radius / 1000;
    
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    const gradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, this.color);
    gradient.addColorStop(1, this.color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}
