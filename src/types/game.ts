export type WeaponType = 'ak47' | 'm4a4' | 'awp' | 'mp9' | 'shotgun' | 'pistol' | 'glock' | 'knife';
export type Team = 'red' | 'blue';
export type GameMode = '1v1' | '2v2';
export type BotDifficulty = 'easy' | 'normal' | 'hard';

export interface WeaponData {
  id: WeaponType;
  name: string;
  vietnameseName: string;
  slot: number; // 1: Primary, 2: Secondary, 3: Knife
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
  cost: number;
  isSniper?: boolean;
  pellets?: number;
}

export const WEAPONS: Record<WeaponType, WeaponData> = {
  ak47: {
    id: 'ak47',
    name: 'AK-47 Kalashnikov',
    vietnameseName: 'AK-47',
    slot: 1,
    damage: 36,
    headshotMultiplier: 3.2, // 115+ dmg (Classic CS 1-tap headshot kill!)
    magSize: 30,
    maxReserveAmmo: 90,
    fireRate: 105,
    reloadTime: 2300,
    spread: 0.018,
    recoilKick: 0.042,
    isAutomatic: true,
    range: 120,
    cost: 2700
  },
  m4a4: {
    id: 'm4a4',
    name: 'M4A4 Carbine',
    vietnameseName: 'M4A4',
    slot: 1,
    damage: 33,
    headshotMultiplier: 2.8, // 92 dmg headshot
    magSize: 30,
    maxReserveAmmo: 90,
    fireRate: 92,
    reloadTime: 2100,
    spread: 0.014,
    recoilKick: 0.032,
    isAutomatic: true,
    range: 120,
    cost: 3100
  },
  awp: {
    id: 'awp',
    name: 'AWP Arctic Warfare Police',
    vietnameseName: 'AWP Bắn Tỉa',
    slot: 1,
    damage: 115, // 1-shot body kill
    headshotMultiplier: 4.0, // 460 dmg headshot
    magSize: 5,
    maxReserveAmmo: 30,
    fireRate: 1050,
    reloadTime: 2800,
    spread: 0.002, // High precision
    recoilKick: 0.09,
    isAutomatic: false,
    range: 180,
    cost: 4750,
    isSniper: true
  },
  mp9: {
    id: 'mp9',
    name: 'MP9 Tactical SMG',
    vietnameseName: 'MP9 Tiểu Liên',
    slot: 1,
    damage: 26,
    headshotMultiplier: 2.2,
    magSize: 30,
    maxReserveAmmo: 120,
    fireRate: 72, // 850 RPM
    reloadTime: 1800,
    spread: 0.024,
    recoilKick: 0.024,
    isAutomatic: true,
    range: 70,
    cost: 1250
  },
  shotgun: {
    id: 'shotgun',
    name: 'XM1014 Auto Shotgun',
    vietnameseName: 'XM1014 Shotgun',
    slot: 1,
    damage: 20, // per pellet
    headshotMultiplier: 1.8,
    magSize: 7,
    maxReserveAmmo: 32,
    fireRate: 260,
    reloadTime: 2500,
    spread: 0.065,
    recoilKick: 0.07,
    isAutomatic: true,
    range: 45,
    cost: 2000,
    pellets: 6
  },
  pistol: {
    id: 'pistol',
    name: 'Desert Eagle .50 AE',
    vietnameseName: 'Desert Eagle',
    slot: 2,
    damage: 53,
    headshotMultiplier: 2.4, // 127 dmg: 1-tap headshot!
    magSize: 7,
    maxReserveAmmo: 35,
    fireRate: 240,
    reloadTime: 1800,
    spread: 0.012,
    recoilKick: 0.065,
    isAutomatic: false,
    range: 90,
    cost: 700
  },
  glock: {
    id: 'glock',
    name: 'Glock-18 9mm',
    vietnameseName: 'Glock-18',
    slot: 2,
    damage: 28,
    headshotMultiplier: 2.1,
    magSize: 20,
    maxReserveAmmo: 120,
    fireRate: 150,
    reloadTime: 1600,
    spread: 0.015,
    recoilKick: 0.035,
    isAutomatic: false,
    range: 75,
    cost: 200
  },
  knife: {
    id: 'knife',
    name: 'Tactical Combat Knife',
    vietnameseName: 'Dao găm',
    slot: 3,
    damage: 40, // Slash
    headshotMultiplier: 1.8,
    magSize: 1,
    maxReserveAmmo: 0,
    fireRate: 350,
    reloadTime: 0,
    spread: 0,
    recoilKick: 0.015,
    isAutomatic: false,
    range: 2.6,
    cost: 0
  }
};

export interface BuyItem {
  id: string;
  name: string;
  category: 'pistols' | 'rifles' | 'smgs' | 'gear';
  price: number;
  weaponType?: WeaponType;
  description: string;
  shortcut: string;
}

export const CS_BUY_ITEMS: BuyItem[] = [
  // Pistols
  { id: 'glock', name: 'Glock-18', category: 'pistols', price: 200, weaponType: 'glock', description: '20 viên, độ linh hoạt cao', shortcut: '1' },
  { id: 'deagle', name: 'Desert Eagle .50', category: 'pistols', price: 700, weaponType: 'pistol', description: 'Uy lực kinh hoàng, 1 viên vào đầu hạ gục', shortcut: '2' },

  // Rifles
  { id: 'ak47', name: 'AK-47 Kalashnikov', category: 'rifles', price: 2700, weaponType: 'ak47', description: 'Sát thương cực mạnh, 1-shot headshot', shortcut: '3' },
  { id: 'm4a4', name: 'M4A4 Carbine', category: 'rifles', price: 3100, weaponType: 'm4a4', description: 'Độ giật êm ái, tốc độ bắn nhanh và chính xác', shortcut: '4' },
  { id: 'awp', name: 'AWP Sniper Rifle', category: 'rifles', price: 4750, weaponType: 'awp', description: 'Bắn tỉa 1 phát chết ngay (One Shot One Kill)', shortcut: '5' },

  // SMGs & Shotguns
  { id: 'mp9', name: 'MP9 Tiểu liên', category: 'smgs', price: 1250, weaponType: 'mp9', description: 'Tốc độ xả đạn cực nhanh, vừa chạy vừa bắn', shortcut: '6' },
  { id: 'shotgun', name: 'XM1014 Shotgun', category: 'smgs', price: 2000, weaponType: 'shotgun', description: 'Chùm đạn chùm xé tan mục tiêu tầm gần', shortcut: '7' },

  // Gear
  { id: 'kevlar', name: 'Giáp Kevlar (Thân)', category: 'gear', price: 650, description: 'Giảm 50% sát thương vào ngực và tay', shortcut: '8' },
  { id: 'helmet', name: 'Giáp Kevlar + Mũ Sắt', category: 'gear', price: 1000, description: 'Bảo vệ toàn diện, giảm sát thương bắn vào đầu', shortcut: '9' },
  { id: 'ammo_refill', name: 'Nạp đầy băng đạn', category: 'gear', price: 250, description: 'Tiếp tế đạn dự trữ cho mọi vũ khí', shortcut: '0' }
];

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

export interface ChatMessage {
  id: string;
  senderName: string;
  senderTeam?: Team;
  text: string;
  isAll: boolean;
  isSystem?: boolean;
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
