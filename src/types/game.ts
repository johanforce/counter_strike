export type WeaponType = 'usp' | 'pistol' | 'mp9' | 'xm1014' | 'ak47' | 'm4a1s' | 'awp' | 'knife';
export type Team = 'red' | 'blue';
export type GameMode = '1v1' | '2v2';
export type BotDifficulty = 'easy' | 'normal' | 'hard';

export interface WeaponData {
  id: WeaponType;
  name: string;
  vietnameseName: string;
  slot: 1 | 2 | 3; // 1: Primary, 2: Secondary (Pistol), 3: Melee (Knife)
  category: 'rifles' | 'smgs' | 'pistols' | 'melee';
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
  price: number;
  killReward: number;
  isSilenced?: boolean;
  hasScope?: boolean;
  pellets?: number;
  description: string;
}

export const WEAPONS: Record<WeaponType, WeaponData> = {
  usp: {
    id: 'usp',
    name: 'USP-S Tactical Silencer',
    vietnameseName: 'USP-S Giảm Thanh',
    slot: 2,
    category: 'pistols',
    damage: 25,
    headshotMultiplier: 2.4, // ~60 dmg headshot
    magSize: 12,
    maxReserveAmmo: 36,
    fireRate: 180,
    reloadTime: 1500,
    spread: 0.009,
    recoilKick: 0.024,
    isAutomatic: false,
    range: 80,
    price: 200,
    killReward: 300,
    isSilenced: true,
    description: 'Súng lục khởi đầu chuẩn CS:GO có gắn ống giảm thanh, độ chính xác cao và ít giật.'
  },
  pistol: {
    id: 'pistol',
    name: 'Desert Eagle .50 AE',
    vietnameseName: 'Desert Eagle .50',
    slot: 2,
    category: 'pistols',
    damage: 44,
    headshotMultiplier: 2.5, // 110 dmg 1-tap headshot!
    magSize: 7,
    maxReserveAmmo: 35,
    fireRate: 265,
    reloadTime: 1750,
    spread: 0.013,
    recoilKick: 0.062,
    isAutomatic: false,
    range: 95,
    price: 700,
    killReward: 300,
    description: 'Đại bác cầm tay .50 AE uy lực khủng khiếp, 1 viên vào đầu hạ gục ngay lập tức.'
  },
  mp9: {
    id: 'mp9',
    name: 'MP9 Tactical SMG',
    vietnameseName: 'Tiểu Liên MP9',
    slot: 1,
    category: 'smgs',
    damage: 22,
    headshotMultiplier: 2.0,
    magSize: 30,
    maxReserveAmmo: 120,
    fireRate: 75, // 800 RPM ultra-fast
    reloadTime: 1650,
    spread: 0.025,
    recoilKick: 0.021,
    isAutomatic: true,
    range: 70,
    price: 1250,
    killReward: 600,
    description: 'Tiểu liên tốc độ xả đạn cực nhanh, cơ động cao, thưởng +$600 mỗi mạng hạ gục.'
  },
  xm1014: {
    id: 'xm1014',
    name: 'XM1014 Auto-Shotgun',
    vietnameseName: 'Shotgun XM1014',
    slot: 1,
    category: 'smgs',
    damage: 14, // 6 pellets x 14 = 84 body / 150+ headshot close range
    headshotMultiplier: 1.8,
    magSize: 7,
    maxReserveAmmo: 32,
    fireRate: 310,
    reloadTime: 2100,
    spread: 0.052,
    recoilKick: 0.068,
    isAutomatic: true,
    range: 42,
    price: 2000,
    killReward: 900,
    pellets: 6,
    description: 'Shotgun bán tự động bắn chùm 6 viên đạn ghém, thống trị tầm gần, thưởng +$900/mạng.'
  },
  ak47: {
    id: 'ak47',
    name: 'AK-47 Kalashnikov',
    vietnameseName: 'AK-47',
    slot: 1,
    category: 'rifles',
    damage: 36,
    headshotMultiplier: 2.8, // 100+ dmg headshot
    magSize: 30,
    maxReserveAmmo: 90,
    fireRate: 105,
    reloadTime: 2150,
    spread: 0.019,
    recoilKick: 0.040,
    isAutomatic: true,
    range: 130,
    price: 2700,
    killReward: 300,
    description: 'Súng trường tấn công huyền thoại, sát thương cực mạnh, 1 viên headshot hạ gục.'
  },
  m4a1s: {
    id: 'm4a1s',
    name: 'M4A1-S Silencer Carbine',
    vietnameseName: 'M4A1-S Giảm Thanh',
    slot: 1,
    category: 'rifles',
    damage: 33,
    headshotMultiplier: 2.6,
    magSize: 25,
    maxReserveAmmo: 75,
    fireRate: 92,
    reloadTime: 1950,
    spread: 0.011,
    recoilKick: 0.025,
    isAutomatic: true,
    range: 135,
    price: 2900,
    killReward: 300,
    isSilenced: true,
    description: 'Súng trường đặc nhiệm có ống giảm thanh, đường đạn cực chuẩn và độ giật rất thấp.'
  },
  awp: {
    id: 'awp',
    name: 'AWP Magnum Sniper',
    vietnameseName: 'AWP Bắn Tỉa',
    slot: 1,
    category: 'rifles',
    damage: 115, // 1-shot kill body/head
    headshotMultiplier: 3.5,
    magSize: 10,
    maxReserveAmmo: 30,
    fireRate: 1100,
    reloadTime: 2700,
    spread: 0.001,
    recoilKick: 0.095,
    isAutomatic: false,
    range: 240,
    price: 4750,
    killReward: 100,
    hasScope: true,
    description: 'Súng bắn tỉa AWP huyền thoại của CS:GO. Chuột phải bật ống ngắm 2 nấc, 1 phát kết liễu!'
  },
  knife: {
    id: 'knife',
    name: 'M9 Bayonet Tactical Knife',
    vietnameseName: 'Dao M9 Bayonet',
    slot: 3,
    category: 'melee',
    damage: 45, // 55 slash / 85 stab
    headshotMultiplier: 1.8,
    magSize: 1,
    maxReserveAmmo: 0,
    fireRate: 400,
    reloadTime: 0,
    spread: 0,
    recoilKick: 0.02,
    isAutomatic: false,
    range: 2.7,
    price: 0,
    killReward: 1500,
    description: 'Dao găm cận chiến tốc độ cao (+8% chạy nhanh), thưởng nóng +$1,500 khi hạ gục!'
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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  team: Team;
  senderTeam?: Team;
  channel: 'team' | 'all' | 'system';
  isSystem?: boolean;
  isAll?: boolean;
  text: string;
  timestamp: number;
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

export interface BuyItem {
  id: string;
  name: string;
  category: 'rifles' | 'smgs' | 'pistols' | 'gear';
  price: number;
  shortcut: string;
  hotkey: string;
  description: string;
  weaponType?: WeaponType;
  weaponId?: WeaponType;
}

export const CS_BUY_ITEMS: BuyItem[] = [
  {
    id: 'usp',
    name: 'USP-S Tactical Silencer',
    category: 'pistols',
    price: 200,
    shortcut: '1',
    hotkey: '1',
    description: 'Súng lục giảm thanh chuẩn xác, 12/36 viên, tâm ngắm cực kỳ ổn định',
    weaponType: 'usp',
    weaponId: 'usp'
  },
  {
    id: 'pistol',
    name: 'Desert Eagle .50 AE',
    category: 'pistols',
    price: 700,
    shortcut: '2',
    hotkey: '2',
    description: 'Súng lục hạng nặng .50 Cal, 7/35 viên, 1 viên vào đầu hạ gục ngay',
    weaponType: 'pistol',
    weaponId: 'pistol'
  },
  {
    id: 'mp9',
    name: 'MP9 Tactical SMG',
    category: 'smgs',
    price: 1250,
    shortcut: '3',
    hotkey: '3',
    description: 'Tiểu liên tốc độ cao 800 RPM, cơ động, thưởng hạ gục +$600',
    weaponType: 'mp9',
    weaponId: 'mp9'
  },
  {
    id: 'xm1014',
    name: 'XM1014 Auto-Shotgun',
    category: 'smgs',
    price: 2000,
    shortcut: '4',
    hotkey: '4',
    description: 'Shotgun liên thanh bắn chùm 6 viên đạn ghém, thưởng hạ gục +$900',
    weaponType: 'xm1014',
    weaponId: 'xm1014'
  },
  {
    id: 'ak47',
    name: 'AK-47 Kalashnikov',
    category: 'rifles',
    price: 2700,
    shortcut: '5',
    hotkey: '5',
    description: 'Súng trường tấn công uy lực mạnh, 30/90 viên, 1-Tap Headshot',
    weaponType: 'ak47',
    weaponId: 'ak47'
  },
  {
    id: 'm4a1s',
    name: 'M4A1-S Silencer Carbine',
    category: 'rifles',
    price: 2900,
    shortcut: '6',
    hotkey: '6',
    description: 'Súng trường giảm thanh chuẩn xác, 25/75 viên, độ giật cực thấp',
    weaponType: 'm4a1s',
    weaponId: 'm4a1s'
  },
  {
    id: 'awp',
    name: 'AWP Magnum Sniper',
    category: 'rifles',
    price: 4750,
    shortcut: '7',
    hotkey: '7',
    description: 'Súng bắn tỉa hạng nặng có ống ngắm (Chuột phải), 1 phát hạ gục',
    weaponType: 'awp',
    weaponId: 'awp'
  },
  {
    id: 'kevlar',
    name: 'Giáp Chống Đạn Kevlar',
    category: 'gear',
    price: 650,
    shortcut: '8',
    hotkey: '8',
    description: 'Phục hồi 100 Giáp, giảm 50% sát thương đạn và dao vào phần thân'
  },
  {
    id: 'helmet',
    name: 'Giáp Kevlar + Mũ Sắt',
    category: 'gear',
    price: 1000,
    shortcut: '9',
    hotkey: '9',
    description: 'Bảo vệ toàn diện 100 Giáp + Mũ chống đạn giảm sát thương chí mạng vào đầu'
  },
  {
    id: 'ammo',
    name: 'Băng Đạn Tiếp Tế Đầy Đủ',
    category: 'gear',
    price: 200,
    shortcut: '0',
    hotkey: '0',
    description: 'Nạp đầy tối đa toàn bộ đạn dự trữ cho cả Súng chính (Ô 1) và Súng lục (Ô 2)'
  }
];
