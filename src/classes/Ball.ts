interface PathPoint {
  x: number;
  y: number;
  t: number;
}

export class Ball {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  isActive: boolean;
  
  state: 'animating' | 'landed' | 'fading' | 'finished' = 'animating';
  landedTime: number = 0;
  opacity: number = 1;
  justLanded: boolean = false;
  
  multiplier: number;
  payout: number;
  slotIndex: number;
  
  // Animation path (pre-computed)
  private animationPath: PathPoint[];
  private startTime: number;
  private animationDuration: number;
  
  // Trail effect
  private trail: Array<{ x: number; y: number; alpha: number }> = [];
  private readonly MAX_TRAIL_LENGTH = 12;
  
  constructor(
    animationPath: PathPoint[],
    color: string,
    multiplier: number,
    payout: number,
    slotIndex: number
  ) {
    this.id = `ball-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.animationPath = animationPath;
    this.startTime = performance.now();
    this.animationDuration = animationPath[animationPath.length - 1].t;
    
    // Start at first point
    this.x = animationPath[0].x;
    this.y = animationPath[0].y;
    
    this.radius = 8;
    this.color = color;
    this.isActive = true;
    this.multiplier = multiplier;
    this.payout = payout;
    this.slotIndex = slotIndex;
  }
  
  update(): void {
    if (!this.isActive) return;
    
    if (this.state === 'animating') {
      const currentTime = performance.now();
      const elapsed = currentTime - this.startTime;
      
      // Add to trail
      this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
      if (this.trail.length > this.MAX_TRAIL_LENGTH) {
        this.trail.shift();
      }
      this.trail.forEach((point, index) => {
        point.alpha = (index + 1) / this.trail.length * 0.5;
      });
      
      // Check if animation complete
      if (elapsed >= this.animationDuration) {
        // Snap to final position
        const lastPoint = this.animationPath[this.animationPath.length - 1];
        this.x = lastPoint.x;
        this.y = lastPoint.y;
        
        this.state = 'landed';
        this.landedTime = Date.now();
        this.justLanded = true;
        return;
      }
      
      // Find current segment in animation path
      let segmentStart = this.animationPath[0];
      let segmentEnd = this.animationPath[1];
      
      for (let i = 0; i < this.animationPath.length - 1; i++) {
        if (elapsed >= this.animationPath[i].t && elapsed < this.animationPath[i + 1].t) {
          segmentStart = this.animationPath[i];
          segmentEnd = this.animationPath[i + 1];
          break;
        }
      }
      
      // Interpolate position
      const segmentDuration = segmentEnd.t - segmentStart.t;
      let t = 0;
      if (segmentDuration > 0) {
        t = (elapsed - segmentStart.t) / segmentDuration;
      }
      t = Math.max(0, Math.min(1, t));
      
      // Smooth easing for more natural look
      t = t * t * (3 - 2 * t);  // Smoothstep
      
      this.x = segmentStart.x + (segmentEnd.x - segmentStart.x) * t;
      this.y = segmentStart.y + (segmentEnd.y - segmentStart.y) * t;
      
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
  
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    
    // Draw trail
    this.trail.forEach((point) => {
      ctx.save();
      ctx.globalAlpha = point.alpha * this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    
    // Draw ball with glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3, 
      this.y - this.radius * 0.3, 
      0, 
      this.x, 
      this.y, 
      this.radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.5, this.color);
    gradient.addColorStop(1, this.color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}
