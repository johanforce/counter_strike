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
    damage: 32,
    headshotMultiplier: 2.2, // ~70 dmg with headshot (requires 2 shots, no instant 1-tap deaths)
    magSize: 30,
    maxReserveAmmo: 90,
    fireRate: 110,
    reloadTime: 2200,
    spread: 0.022,
    recoilKick: 0.040,
    isAutomatic: true,
    range: 120,
  },
  pistol: {
    id: 'pistol',
    name: 'Desert Eagle .50',
    vietnameseName: 'Súng lục',
    slot: 2,
    damage: 25,
    headshotMultiplier: 2.0, // ~50 dmg with headshot
    magSize: 12,
    maxReserveAmmo: 36,
    fireRate: 210,
    reloadTime: 1600,
    spread: 0.012,
    recoilKick: 0.055,
    isAutomatic: false,
    range: 80,
  },
  knife: {
    id: 'knife',
    name: 'Combat Tactical Knife',
    vietnameseName: 'Dao găm',
    slot: 3,
    damage: 45, // 3-hit kill or backstab 85
    headshotMultiplier: 1.4,
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
  hostId?: string;
  mode: GameMode;
  state: 'waiting' | 'playing' | 'round_end';
  redScore: number;
  blueScore: number;
  round: number;
  maxRounds: number;
  roundTimeLeft: number;
  players: PlayerNetState[];
}

export interface ActiveRoomInfo {
  code: string;
  mode: GameMode;
  state: 'waiting' | 'playing' | 'round_end';
  playerCount: number;
  maxPlayers: number;
  redCount: number;
  blueCount: number;
  hostName: string;
  isFull: boolean;
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
