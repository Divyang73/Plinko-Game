// Integer physics Ball class with ×1000 scale factor
export class Ball {
  // Unique ID for each ball
  id: string;
  
  // Position and velocity (all integers, ×1000 scale)
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isActive: boolean;
  
  // Ball state machine
  state: 'falling' | 'landed' | 'fading' | 'finished' = 'falling';
  landedTime: number = 0;
  opacity: number = 1;
  justLanded: boolean = false;  // Flag for one-time sink animation trigger
  
  // Multiplier and payout info
  multiplier: number;
  payout: number;
  
  // Physics constants (×1000 scale)
  private readonly GRAVITY = 2000;
  private readonly DAMPING = 950; // 0.95
  private readonly BOUNCE_FACTOR = 600; // 0.6
  
  // Path data from backend
  private path: number[];
  private pathIndex: number;
  
  // Trail effect
  private trail: Array<{ x: number; y: number; alpha: number }> = [];
  private readonly MAX_TRAIL_LENGTH = 10;
  
  constructor(startX: number, startY: number, color: string, path: number[], multiplier: number, payout: number) {
    this.id = `ball-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.radius = 8000; // 8 pixels
    this.color = color;
    this.isActive = true;
    this.path = path;
    this.pathIndex = 0;
    this.multiplier = multiplier;
    this.payout = payout;
  }
  
  // Update physics (integer math only)
  update(pins: Array<{ x: number; y: number }>, _canvasHeight: number, sinkY: number): void {
    if (!this.isActive) return;
    
    // Handle state transitions
    if (this.state === 'falling') {
      // Add to trail
      this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
      if (this.trail.length > this.MAX_TRAIL_LENGTH) {
        this.trail.shift();
      }
      
      // Decay trail alpha
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
      
      // Check collision with pins
      for (const pin of pins) {
        const dx = this.x - pin.x;
        const dy = this.y - pin.y;
        const distance = Math.sqrt((dx * dx + dy * dy) / 1000000);
        const minDist = (10000 + this.radius) / 1000; // pin radius + ball radius
        
        if (distance < minDist && distance > 0) {
          // Collision detected
          const angle = Math.atan2(dy / 1000, dx / 1000);
          const overlap = minDist - distance;
          
          // Push ball away from pin
          this.x += Math.cos(angle) * overlap * 1000;
          this.y += Math.sin(angle) * overlap * 1000;
          
          // Use predetermined path direction if available
          let bounceDirection = 0;
          if (this.pathIndex < this.path.length) {
            bounceDirection = this.path[this.pathIndex];
            this.pathIndex++;
          } else {
            // Fallback: reflect based on collision angle
            bounceDirection = dx > 0 ? 1 : -1;
          }
          
          // Apply bounce with predetermined direction
          const speed = Math.sqrt((this.vx * this.vx + this.vy * this.vy) / 1000000);
          const bounceSpeed = speed * this.BOUNCE_FACTOR / 1000;
          
          // Mix deterministic direction with collision angle
          const targetAngle = angle + (bounceDirection * Math.PI / 6); // ±30 degrees
          this.vx = Math.cos(targetAngle) * bounceSpeed * 1000;
          this.vy = Math.sin(targetAngle) * bounceSpeed * 1000;
          
          break;
        }
      }
      
      // Check if ball reached sink (at bottom)
      if (this.y >= sinkY * 1000) {
        this.state = 'landed';
        this.landedTime = Date.now();
        this.vx = 0;
        this.vy = 0;
        this.y = sinkY * 1000; // Lock position at sink
        this.justLanded = true; // Set flag for animation trigger
      }
    } else if (this.state === 'landed') {
      // Wait 500ms before fading
      if (Date.now() - this.landedTime > 500) {
        this.state = 'fading';
      }
    } else if (this.state === 'fading') {
      // Fade out over ~300ms at 60fps (0.05 per frame)
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
  
  getSinkIndex(rows: number, canvasWidth: number): number {
    const centerX = canvasWidth / 2;
    const slotWidth = 40; // HORIZONTAL_SPACING
    const slotCount = rows + 1;
    const totalWidth = slotCount * slotWidth;
    const startX = centerX - totalWidth / 2 + slotWidth / 2;
    
    // Calculate which slot this ball is in
    const slotIndex = Math.max(0, Math.min(rows, Math.floor((this.x / 1000 - startX + slotWidth / 2) / slotWidth)));
    return slotIndex;
  }
  
  // Draw ball and trail (convert to actual pixels here)
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
    
    // Draw main ball with glow
    const x = this.x / 1000;
    const y = this.y / 1000;
    const r = this.radius / 1000;
    
    // Outer glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner ball
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
