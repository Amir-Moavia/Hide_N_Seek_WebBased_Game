export interface Vector {
  x: number;
  y: number;
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  WON = 'WON',
  CAUGHT = 'CAUGHT'
}

export enum SeekerState {
  PATROL = 'PATROL',
  CHASE = 'CHASE',
  SEARCH = 'SEARCH'
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'shadow' | 'bush';
}

export interface Entity {
  id: string;
  pos: Vector;
  radius: number;
  speed: number;
  color: string;
}

export interface Player extends Entity {
  isHidden: boolean;
  isRunning: boolean;
  soundRadius: number;
}

export interface Seeker extends Entity {
  state: SeekerState;
  angle: number; // View angle
  fov: number; // Field of view in radians
  viewDistance: number;
  targetPos: Vector | null;
  lastKnownPlayerPos: Vector | null;
}
