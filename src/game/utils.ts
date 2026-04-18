import { Vector, Wall } from './types';

export const getDistance = (v1: Vector, v2: Vector) => {
  return Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
};

export const circleRectCollision = (circleX: number, circleY: number, radius: number, rectX: number, rectY: number, rectW: number, rectH: number) => {
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectW));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectH));
  const distance = getDistance({ x: circleX, y: circleY }, { x: closestX, y: closestY });
  return distance < radius;
};

export const circleCircleCollision = (c1: Vector, r1: number, c2: Vector, r2: number) => {
  return getDistance(c1, c2) < r1 + r2;
};

// Line of sight check
export const isPointVisible = (
  origin: Vector,
  target: Vector,
  walls: Wall[],
  maxDist: number
) => {
  const dist = getDistance(origin, target);
  if (dist > maxDist) return false;

  // Simple line-segment obstacle check
  for (const wall of walls) {
    if (wall.type !== 'wall') continue;
    if (lineIntersectsRect(origin, target, wall)) {
      return false;
    }
  }
  return true;
};

const lineIntersectsRect = (v1: Vector, v2: Vector, rect: Wall) => {
  // Liang-Barsky or just check intersection with 4 sides
  const { x, y, width, height } = rect;
  return lineIntersectsLine(v1, v2, { x, y }, { x: x + width, y }) ||
    lineIntersectsLine(v1, v2, { x: x + width, y }, { x: x + width, y: y + height }) ||
    lineIntersectsLine(v1, v2, { x: x + width, y: y + height }, { x, y: y + height }) ||
    lineIntersectsLine(v1, v2, { x, y: y + height }, { x, y });
};

const lineIntersectsLine = (p1: Vector, p2: Vector, p3: Vector, p4: Vector) => {
  const det = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (det === 0) return false;
  const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det; // This formula is a bit wrong let's use standard one
  
  // Standard intersection check
  const uA = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
  const uB = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
  
  return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
};

export const normalizeAngle = (angle: number) => {
  let a = angle % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
};

export const angleBetween = (v1: Vector, v2: Vector) => {
  return Math.atan2(v2.y - v1.y, v2.x - v1.x);
};
