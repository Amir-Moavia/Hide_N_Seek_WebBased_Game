import { GameEngine, MAP_SIZE } from './GameEngine';
import { SeekerState } from './types';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  engine: GameEngine;

  constructor(ctx: CanvasRenderingContext2D, engine: GameEngine) {
    this.ctx = ctx;
    this.engine = engine;
  }

  render() {
    this.ctx.clearRect(0, 0, MAP_SIZE.width, MAP_SIZE.height);

    // Draw Floor
    this.ctx.fillStyle = '#09090b';
    this.ctx.fillRect(0, 0, MAP_SIZE.width, MAP_SIZE.height);
    
    // Draw Grid
    this.drawGrid();

    // Draw Walls and Objects
    this.drawObstacles();

    // Draw Seekers (Vision Cones first for transparency layering)
    for (const s of this.engine.seekers) {
      this.drawSeekerVision(s);
    }

    // Draw Player Sound Ripple
    if (this.engine.player.soundRadius > 0) {
      this.drawSoundRipple();
    }

    // Draw Seekers
    for (const s of this.engine.seekers) {
      this.drawSeeker(s);
    }

    // Draw Player
    this.drawPlayer();
  }

  drawGrid() {
    this.ctx.strokeStyle = '#18181b';
    this.ctx.lineWidth = 1;
    const step = 50;
    for (let x = 0; x < MAP_SIZE.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, MAP_SIZE.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < MAP_SIZE.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(MAP_SIZE.width, y);
      this.ctx.stroke();
    }
  }

  drawObstacles() {
    for (const wall of this.engine.walls) {
      if (wall.type === 'wall') {
        this.ctx.fillStyle = '#27272a';
        this.ctx.strokeStyle = '#3f3f46';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
      } else if (wall.type === 'bush') {
        this.ctx.fillStyle = 'rgba(21, 128, 61, 0.4)';
        this.ctx.beginPath();
        this.ctx.roundRect(wall.x, wall.y, wall.width, wall.height, 10);
        this.ctx.fill();
      } else if (wall.type === 'shadow') {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      }
    }
  }

  drawSeekerVision(s: any) {
    const fov = s.fov * (this.engine.difficulty > 1.2 ? 1.2 : this.engine.difficulty);
    const dist = s.viewDistance * this.engine.difficulty;
    
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(s.pos.x, s.pos.y);
    this.ctx.arc(s.pos.x, s.pos.y, dist, s.angle - fov / 2, s.angle + fov / 2);
    this.ctx.closePath();
    
    const gradient = this.ctx.createRadialGradient(s.pos.x, s.pos.y, 0, s.pos.x, s.pos.y, dist);
    if (s.state === SeekerState.CHASE) {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.2)');
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    this.ctx.restore();
  }

  drawSeeker(s: any) {
    this.ctx.fillStyle = s.state === SeekerState.CHASE ? '#ef4444' : '#f87171';
    this.ctx.beginPath();
    this.ctx.arc(s.pos.x, s.pos.y, s.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Direction indicator
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(s.pos.x, s.pos.y);
    this.ctx.lineTo(s.pos.x + Math.cos(s.angle) * s.radius * 1.5, s.pos.y + Math.sin(s.angle) * s.radius * 1.5);
    this.ctx.stroke();

    // Alert status icons
    if (s.state === SeekerState.CHASE) {
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 20px Inter';
        this.ctx.fillText('!', s.pos.x - 4, s.pos.y - s.radius - 8);
    } else if (s.state === SeekerState.SEARCH) {
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = 'bold 16px Inter';
        this.ctx.fillText('?', s.pos.x - 4, s.pos.y - s.radius - 8);
    }
  }

  drawPlayer() {
    const p = this.engine.player;
    this.ctx.shadowBlur = p.isRunning ? 15 : 5;
    this.ctx.shadowColor = p.isHidden ? '#166534' : '#4ade80';
    
    this.ctx.fillStyle = p.isHidden ? '#16a34a' : '#4ade80';
    this.ctx.beginPath();
    this.ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.shadowBlur = 0;
  }

  drawSoundRipple() {
    const p = this.engine.player;
    const time = performance.now() / 1000;
    const rippleCount = p.isRunning ? 3 : 1;
    
    for (let i = 0; i < rippleCount; i++) {
        const offset = (time + i * 0.4) % 1.2; // 1.2s cycle
        const radius = p.soundRadius * (offset / 1.2);
        const opacity = 1 - (offset / 1.2);
        
        this.ctx.strokeStyle = p.isRunning 
            ? `rgba(239, 68, 68, ${opacity * 0.4})` // Red ripples for running
            : `rgba(74, 222, 128, ${opacity * 0.3})`; // Green ripples for walking
            
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(p.pos.x, p.pos.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
  }
}
