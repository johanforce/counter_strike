export type WeaponType = 'ak47' | 'pistol' | 'knife';
export type Team = 'red' | 'blue';
export type GameMode = '1v1' | '2v2';
export type BotDifficulty = 'easy' | 'normal' | 'hard';

export interface WeaponData {
  id: WeaponType;
  name: string;
  vietnameseName: string;
  slot: number;
  damage: number;
  headshotMultiplier: number;
  magSize: number;
  maxReserveAmmo: number;
  fireRate: number; // ms between shots
  reloadTime: number; // ms
  spread: number;
  recoilKick: number;
  isAutomatic: boolean;
  range: number;
}

export const WEAPONS: Record<WeaponType, WeaponData> = {
  ak47: {
    id: 'ak47',
    name: 'AK-47 Kalashnikov',
    vietnameseName: 'AK-47',
    slot: 1,
    damage: 34,
    headshotMultiplier: 3.2, // ~108 dmg (1-shot headshot)
    magSize: 30,
    maxReserveAmmo: 90,
    fireRate: 105,
    reloadTime: 2200,
    spread: 0.024,
    recoilKick: 0.045,
    isAutomatic: true,
    range: 120,
  },
  pistol: {
    id: 'pistol',
    name: 'Desert Eagle .50',
    vietnameseName: 'Súng lục',
    slot: 2,
    damage: 28,
    headshotMultiplier: 2.8, // ~78 dmg (2 shots or 1 head + 1 body)
    magSize: 12,
    maxReserveAmmo: 36,
    fireRate: 200,
    reloadTime: 1600,
    spread: 0.012,
    recoilKick: 0.065,
    isAutomatic: false,
    range: 80,
  },
  knife: {
    id: 'knife',
    name: 'Combat Tactical Knife',
    vietnameseName: 'Dao găm',
    slot: 3,
    damage: 55, // 2-hit kill, or backstab 100
    headshotMultiplier: 1.5,
    magSize: 1,
    maxReserveAmmo: 0,
    fireRate: 420,
    reloadTime: 0,
    spread: 0,
    recoilKick: 0.02,
    isAutomatic: false,
    range: 2.6,
  }
};

export interface PlayerNetState {
  id: string;
  name: string;
  roomCode: string;
  team: Team;
  slot: number;
  isBot: boolean;
  x: number;
  y: number;
  z: number;
  rotY: number;
  pitch: number;
  health: number;
  kills: number;
  deaths: number;
  weapon: WeaponType;
  isAlive: boolean;
  ping: number;
  lastActive: number;
}

export interface KillFeedEvent {
  id: string;
  killerName: string;
  killerTeam: Team;
  victimName: string;
  victimTeam: Team;
  weapon: WeaponType;
  isHeadshot: boolean;
  timestamp: number;
}

export interface RoomState {
  code: string;
  mode: GameMode;
  state: 'waiting' | 'playing' | 'round_end';
  redScore: number;
  blueScore: number;
  round: number;
  maxRounds: number;
  roundTimeLeft: number;
  players: PlayerNetState[];
}

export interface HitEffect {
  x: number;
  y: number;
  z: number;
  isBlood: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  isMuted: boolean;
}

export interface GameSettings {
  mouseSensitivity: number;
  invertY: boolean;
  crosshairColor: string;
  crosshairSize: number;
  showFPS: boolean;
  fov: number;
}
