import { Player, Seeker, Wall, GameStatus, SeekerState, Vector } from './types';
import { getDistance, circleRectCollision, isPointVisible, angleBetween, normalizeAngle } from './utils';

export const MAP_SIZE = { width: 1200, height: 800 };

export class GameEngine {
  player: Player;
  seekers: Seeker[] = [];
  walls: Wall[] = [];
  status: GameStatus = GameStatus.START;
  timer: number = 60;
  score: number = 0;
  difficulty: number = 1.0;

  constructor() {
    this.player = this.createPlayer();
    this.generateMap();
  }

  createPlayer(): Player {
    return {
      id: 'player',
      pos: { x: 50, y: 50 },
      radius: 12,
      speed: 3,
      color: '#4ade80',
      isHidden: false,
      isRunning: false,
      soundRadius: 0
    };
  }

  generateMap() {
    this.walls = [];
    // Outer boundaries
    this.walls.push({ x: 0, y: 0, width: MAP_SIZE.width, height: 10, type: 'wall' });
    this.walls.push({ x: 0, y: MAP_SIZE.height - 10, width: MAP_SIZE.width, height: 10, type: 'wall' });
    this.walls.push({ x: 0, y: 0, width: 10, height: MAP_SIZE.height, type: 'wall' });
    this.walls.push({ x: MAP_SIZE.width - 10, y: 0, width: 10, height: MAP_SIZE.height, type: 'wall' });

    // Procedural random obstacles
    for (let i = 0; i < 25; i++) {
        const x = 100 + Math.random() * (MAP_SIZE.width - 250);
        const y = 100 + Math.random() * (MAP_SIZE.height - 250);
        const w = 40 + Math.random() * 100;
        const h = 40 + Math.random() * 100;
        
        // Ensure no spawn on player
        if (circleRectCollision(50, 50, 100, x, y, w, h)) continue;
        
        const type = Math.random() > 0.8 ? 'bush' : (Math.random() > 0.7 ? 'shadow' : 'wall');
        this.walls.push({ x, y, width: w, height: h, type });
    }

    this.spawnSeekers(3);
  }

  spawnSeekers(count: number) {
    this.seekers = [];
    for (let i = 0; i < count; i++) {
      let x, y, safe = false;
      let attempts = 0;
      
      // Attempt to find a safe spot not in a wall
      do {
        x = MAP_SIZE.width - 100 - Math.random() * 400;
        y = Math.random() * MAP_SIZE.height;
        safe = !this.walls.some(w => w.type === 'wall' && circleRectCollision(x, y, 20, w.x, w.y, w.width, w.height));
        attempts++;
      } while (!safe && attempts < 50);

      this.seekers.push({
        id: `seeker-${i}`,
        pos: { x, y },
        radius: 15,
        speed: 1.5 + Math.random() * 0.5,
        color: '#f87171',
        state: SeekerState.PATROL,
        angle: Math.random() * Math.PI * 2,
        fov: Math.PI / 3,
        viewDistance: 250,
        targetPos: null,
        lastKnownPlayerPos: null
      });
    }
  }

  update(keys: Record<string, boolean>, deltaTime: number, joystickVector?: { x: number, y: number }) {
    if (this.status !== GameStatus.PLAYING) return;

    this.timer -= deltaTime / 1000;
    this.score += deltaTime / 1000;
    this.difficulty = 1.0 + (60 - this.timer) / 30; // Scale over 1 min

    if (this.timer <= 0) {
      this.status = GameStatus.WON;
    }

    this.updatePlayer(keys, joystickVector);
    this.updateSeekers();
    this.checkCollisions();
  }

  updatePlayer(keys: Record<string, boolean>, joystickVector?: { x: number, y: number }) {
    const p = this.player;
    p.isRunning = !!keys['Shift'];
    const currentSpeed = (p.isRunning ? p.speed * 1.8 : p.speed) * (p.isHidden ? 0.7 : 1);
    
    let dx = joystickVector?.x || 0;
    let dy = joystickVector?.y || 0;

    if (dx === 0 && dy === 0) {
      if (keys['w'] || keys['ArrowUp']) dy -= 1;
      if (keys['s'] || keys['ArrowDown']) dy += 1;
      if (keys['a'] || keys['ArrowLeft']) dx -= 1;
      if (keys['d'] || keys['ArrowRight']) dx += 1;
    }

    // Normalize diagonal speed
    if (dx !== 0 && dy !== 0) {
        const mag = Math.sqrt(dx * dx + dy * dy);
        dx /= mag;
        dy /= mag;
    }

    const moveX = dx * currentSpeed;
    const moveY = dy * currentSpeed;

    // Sliding collision in X
    let collidedX = false;
    for (const wall of this.walls) {
        if (wall.type === 'wall' && circleRectCollision(p.pos.x + moveX, p.pos.y, p.radius, wall.x, wall.y, wall.width, wall.height)) {
            collidedX = true;
            break;
        }
    }
    if (!collidedX) p.pos.x += moveX;

    // Sliding collision in Y
    let collidedY = false;
    for (const wall of this.walls) {
        if (wall.type === 'wall' && circleRectCollision(p.pos.x, p.pos.y + moveY, p.radius, wall.x, wall.y, wall.width, wall.height)) {
            collidedY = true;
            break;
        }
    }
    if (!collidedY) p.pos.y += moveY;

    // Stealth & Sound
    p.isHidden = false;
    for (const wall of this.walls) {
        if ((wall.type === 'bush' || wall.type === 'shadow') && circleRectCollision(p.pos.x, p.pos.y, p.radius * 0.5, wall.x, wall.y, wall.width, wall.height)) {
            p.isHidden = true;
            break;
        }
    }

    // Dynamic sound radius based on actual velocity
    const speedMag = Math.sqrt(dx * dx + dy * dy);
    if (speedMag > 0) {
      const baseRadius = p.isRunning ? 180 : 60;
      // Fade sound slightly if hidden (bushes dampen sound)
      p.soundRadius = baseRadius * (p.isHidden ? 0.6 : 1.0);
    } else {
      p.soundRadius = 0;
    }
  }

  updateSeekers() {
    for (const s of this.seekers) {
      // Difficulty modifier
      const scaledSpeed = s.speed * this.difficulty;
      const scaledFOV = s.fov * (this.difficulty > 1.2 ? 1.2 : this.difficulty);
      const scaledDist = s.viewDistance * this.difficulty;

      // Logic: detect player
      const canSee = this.canSeekerSeePlayer(s, scaledDist, scaledFOV);
      const canHear = getDistance(s.pos, this.player.pos) < this.player.soundRadius;

      if (canSee) {
        s.state = SeekerState.CHASE;
        s.lastKnownPlayerPos = { ...this.player.pos };
      } else if (canHear && s.state !== SeekerState.CHASE) {
        // Heard but didn't see - Investigate!
        s.state = SeekerState.SEARCH;
        s.targetPos = { ...this.player.pos };
      }

      // State machine logic
      switch (s.state) {
        case SeekerState.PATROL:
          this.patrolBehavior(s, scaledSpeed);
          break;
        case SeekerState.CHASE:
          this.chaseBehavior(s, scaledSpeed);
          if (!canSee) {
            s.state = SeekerState.SEARCH;
            s.targetPos = s.lastKnownPlayerPos;
          }
          break;
        case SeekerState.SEARCH:
          this.searchBehavior(s, scaledSpeed);
          break;
      }
    }
  }

  canSeekerSeePlayer(s: Seeker, dist: number, fov: number): boolean {
    const d = getDistance(s.pos, this.player.pos);
    if (d > dist) return false;

    // Angle check
    const angleToPlayer = angleBetween(s.pos, this.player.pos);
    const diff = Math.abs(normalizeAngle(angleToPlayer - s.angle));
    const normalizedDiff = Math.min(diff, Math.PI * 2 - diff);

    if (normalizedDiff > fov / 2) return false;

    // Bush reduction - player 50% harder to see in bushes
    if (this.player.isHidden && d > dist * 0.5) return false;

    // Obstacle check
    return isPointVisible(s.pos, this.player.pos, this.walls, dist);
  }

  patrolBehavior(s: Seeker, speed: number) {
    if (!s.targetPos || getDistance(s.pos, s.targetPos) < 20) {
      s.targetPos = {
        x: Math.random() * MAP_SIZE.width,
        y: Math.random() * MAP_SIZE.height
      };
    }
    this.moveTowards(s, s.targetPos, speed);
  }

  chaseBehavior(s: Seeker, speed: number) {
    this.moveTowards(s, this.player.pos, speed * 1.5);
  }

  searchBehavior(s: Seeker, speed: number) {
    if (s.targetPos && getDistance(s.pos, s.targetPos) > 10) {
      this.moveTowards(s, s.targetPos, speed);
    } else {
      // Look around for a bit?
      s.angle += 0.05;
      if (!s.targetPos) s.state = SeekerState.PATROL; // Reset if lost
      
      // Simple logic: return to patrol after some time?
      // For now, if at target, go back to patrol after 3 seconds search
      setTimeout(() => { if (s.state === SeekerState.SEARCH) s.state = SeekerState.PATROL; }, 3000);
    }
  }

  moveTowards(s: Seeker, target: Vector, speed: number) {
    const targetAngle = angleBetween(s.pos, target);
    
    // Smoothly turn toward the target angle
    const angleDiff = normalizeAngle(targetAngle - s.angle);
    const rotationStep = (angleDiff > Math.PI ? angleDiff - Math.PI * 2 : angleDiff) * 0.1;
    s.angle += rotationStep;

    const checkCollision = (x: number, y: number, radius: number) => {
      for (const wall of this.walls) {
        if (wall.type === 'wall' && circleRectCollision(x, y, radius, wall.x, wall.y, wall.width, wall.height)) {
            return true;
        }
      }
      return false;
    };

    // Try moving at the current angle
    let dx = Math.cos(s.angle) * speed;
    let dy = Math.sin(s.angle) * speed;

    // If directly blocked, try to "veer" left or right to find a way around
    if (checkCollision(s.pos.x + dx, s.pos.y + dy, s.radius + 2)) {
      // Stuck state: search for a valid angle by sweeping +/- 90 degrees
      let foundPath = false;
      for (let offset = 0.2; offset < Math.PI / 2; offset += 0.2) {
        for (const side of [1, -1]) {
          const testAngle = s.angle + offset * side;
          const testDx = Math.cos(testAngle) * speed;
          const testDy = Math.sin(testAngle) * speed;
          
          if (!checkCollision(s.pos.x + testDx, s.pos.y + testDy, s.radius + 2)) {
            s.angle = testAngle; // Adjust heading to the clear path
            dx = testDx;
            dy = testDy;
            foundPath = true;
            break;
          }
        }
        if (foundPath) break;
      }
      
      if (!foundPath) {
        s.targetPos = null; // Truly stuck, pick a new random target
        return;
      }
    }

    // Apply movement with per-axis sliding
    const canMoveX = !checkCollision(s.pos.x + dx, s.pos.y, s.radius);
    const canMoveY = !checkCollision(s.pos.x, s.pos.y + dy, s.radius);

    if (canMoveX) s.pos.x += dx;
    if (canMoveY) s.pos.y += dy;
  }

  checkCollisions() {
    for (const s of this.seekers) {
      if (getDistance(this.player.pos, s.pos) < this.player.radius + s.radius) {
        this.status = GameStatus.CAUGHT;
      }
    }
  }

  start() {
    this.status = GameStatus.PLAYING;
    this.timer = 60;
    this.score = 0;
    this.player.pos = { x: 50, y: 50 };
    this.spawnSeekers(3);
  }
}
