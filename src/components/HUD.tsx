import React, { useState, useEffect, useRef } from 'react';
import { WeaponType, KillFeedEvent, WEAPONS, ChatMessage, Team } from '../types/game';
import { Shield, Crosshair as CrosshairIcon, RotateCcw, Zap, Compass, ZoomIn, ZoomOut, Navigation, MessageSquare, Send, ShoppingCart, Skull } from 'lucide-react';
import { BuyMenu } from './BuyMenu';

interface HUDProps {
  health: number;
  armor: number;
  hasHelmet?: boolean;
  ammo: number;
  reserveAmmo: number;
  weapon: WeaponType;
  primaryWeapon?: WeaponType | null;
  secondaryWeapon?: WeaponType;
  isReloading: boolean;
  isScoped?: boolean;
  scopeLevel?: number;
  redScore: number;
  blueScore: number;
  round: number;
  timeLeft: number;
  isLocked: boolean;
  hitMarker: boolean;
  isDead: boolean;
  respawnTimer: number;
  killFeed: KillFeedEvent[];
  radarData: {
    playerPos: { x: number; y?: number; z: number; rotY: number };
    allies: { x: number; y?: number; z: number; name?: string; rotY?: number }[];
    enemies: { x: number; y?: number; z: number; rotY?: number }[];
  } | null;
  roundStatus: {
    show: boolean;
    winner?: 'red' | 'blue' | 'draw';
    message: string;
  };
  onRequestLock: () => void;
  onOpenSettings: () => void;
  money?: number;
  moneyRewardNotice?: { amount: number; reason: string } | null;
  chatMessages?: ChatMessage[];
  onSendChatMessage?: (text: string) => void;
  localPlayerTeam?: Team;
  onChatFocus?: () => void;
  isGodMode?: boolean;
  isBuyMenuOpen?: boolean;
  onToggleBuyMenu?: () => void;
  onBuyItem?: (itemId: string) => void;
  headshotEffect?: boolean;
}

// Map landmarks and colliders definition for radar visualization
interface RadarObstacle {
  x: number;
  z: number;
  w: number;
  d: number;
  type?: 'wall' | 'site' | 'spawn' | 'tunnel' | 'catwalk';
  label?: string;
}

const MAP_OBSTACLES: RadarObstacle[] = [
  // Outer perimeter walls
  { x: 0, z: -36, w: 72, d: 2, type: 'wall' },
  { x: 0, z: 36, w: 72, d: 2, type: 'wall' },
  { x: -36, z: 0, w: 2, d: 72, type: 'wall' },
  { x: 36, z: 0, w: 2, d: 72, type: 'wall' },

  // Center Mid structures
  { x: -18, z: -22, w: 1.5, d: 24, type: 'wall' },
  { x: -18, z: 22, w: 1.5, d: 24, type: 'wall' },
  { x: 18, z: -22, w: 1.5, d: 24, type: 'wall' },
  { x: 18, z: 22, w: 1.5, d: 24, type: 'wall' },
  { x: 0, z: -20, w: 20, d: 1.5, type: 'wall' },
  { x: 0, z: 20, w: 20, d: 1.5, type: 'wall' },
  { x: 0, z: 0, w: 6, d: 6, type: 'wall' }, // Center Mid Pillar

  // Underpass tunnel
  { x: 0, z: -11, w: 10, d: 14, type: 'tunnel', label: 'TUNNEL' },

  // Catwalk (Site A high ground)
  { x: 18, z: 0, w: 12, d: 16, type: 'catwalk', label: 'CATWALK' },

  // Long A corridor
  { x: -24, z: 0, w: 8, d: 36, type: 'tunnel', label: 'LONG' },

  // Crates & shipping containers
  { x: -8, z: -10, w: 4, d: 4, type: 'wall' },
  { x: 8, z: 10, w: 4, d: 4, type: 'wall' },
  { x: -24, z: 14, w: 5, d: 8, type: 'wall' }
];

function getLocationName(x: number, z: number): string {
  if (x >= 10 && x <= 26 && z >= -10 && z <= 10) return '📍 [A] KHU VỰC CATWALK (SITE A)';
  if (x <= -16 && z >= 8) return '📍 [B] KHU VỰC QUẢNG TRƯỜNG (SITE B)';
  if (x <= -16 && z >= -18 && z < 8) return '📍 [B] HÀNH LANG DÀI (LONG B)';
  if (x >= -8 && x <= 8 && z >= -20 && z <= -4) return '📍 ĐƯỜNG HẦM (UNDERPASS)';
  if (Math.abs(x) < 14 && Math.abs(z) < 14) return '📍 KHU TRUNG TÂM (MID COURTYARD)';
  if (x <= -18 && z <= -18) return '📍 CĂN CỨ PHE ĐỎ (T BASE)';
  if (x >= 18 && z >= 18) return '📍 CĂN CỨ PHE XANH (CT BASE)';
  return '📍 HÀNH LANG CHIẾN ĐẤU';
}

export const HUD: React.FC<HUDProps> = ({
  health,
  armor,
  hasHelmet = false,
  ammo,
  reserveAmmo,
  weapon,
  primaryWeapon = null,
  secondaryWeapon = 'usp',
  isReloading,
  isScoped = false,
  scopeLevel = 0,
  redScore,
  blueScore,
  round,
  timeLeft,
  isLocked,
  hitMarker,
  isDead,
  respawnTimer,
  killFeed,
  radarData,
  roundStatus,
  onRequestLock,
  onOpenSettings,
  money = 800,
  moneyRewardNotice = null,
  chatMessages = [],
  onSendChatMessage,
  localPlayerTeam = 'red',
  onChatFocus,
  isGodMode = false,
  isBuyMenuOpen = false,
  onToggleBuyMenu,
  onBuyItem,
  headshotEffect = false
}) => {
  const currentWeaponData = WEAPONS[weapon] || WEAPONS.usp;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isLowHealth = health <= 30;
  const isKnife = weapon === 'knife';

  // Chat & Money State
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatFocused, setIsChatFocused] = useState<boolean>(false);
  const [coinAnimation, setCoinAnimation] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const prevMoneyRef = useRef<number>(money);

  useEffect(() => {
    if (money > prevMoneyRef.current) {
      setCoinAnimation(true);
      const timer = setTimeout(() => setCoinAnimation(false), 1600);
      return () => clearTimeout(timer);
    }
    prevMoneyRef.current = money;
  }, [money]);

  // Auto scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmitChat = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (text) {
      onSendChatMessage?.(text);
      setChatInput('');
    }
    // Always blur and release focus on submit
    chatInputRef.current?.blur();
    setIsChatFocused(false);
    onRequestLock();
  };

  // Global Enter hotkey to start chat
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const active = document.activeElement;
        // If focus is currently in an input or textarea, do NOT re-focus
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        chatInputRef.current?.focus();
        setIsChatFocused(true);
        onChatFocus?.();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onChatFocus]);

  // Radar Settings
  const [rotateRadar, setRotateRadar] = useState<boolean>(true); // Up = Forward (CS:GO style)
  const [zoomLevel, setZoomLevel] = useState<number>(1.15); // Zoom scale
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngleRef = useRef<number>(0);

  // Radar animation sweep & rendering loop
  useEffect(() => {
    let animId: number;

    const renderRadar = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 190;
      const cx = size / 2;
      const cy = size / 2;
      const radius = 86;

      ctx.clearRect(0, 0, size, size);

      // 1. Radar background circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Deep tactical slate background with subtle radar grid
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      bgGrad.addColorStop(0, '#0a1614');
      bgGrad.addColorStop(1, '#030807');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Radar Range Rings
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.lineWidth = 1;
      [radius * 0.35, radius * 0.7, radius * 0.98].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      const pPos = radarData?.playerPos || { x: 0, y: 1.6, z: 0, rotY: 0 };
      const px = pPos.x;
      const pz = pPos.z;
      const yaw = pPos.rotY;

      // Coordinate converter helper
      // When rotateRadar is true, world points rotate around player so forward view direction is UP
      const worldToRadar = (wx: number, wz: number): { x: number; y: number } => {
        const dx = wx - px;
        const dz = wz - pz;
        const scale = (radius / 36) * zoomLevel;

        if (rotateRadar) {
          // Camera basis vectors in Three.js world:
          // Forward: (-sin(yaw), -cos(yaw)) -> maps to UP (0, -1) on radar
          // Right:   ( cos(yaw), -sin(yaw)) -> maps to RIGHT (1, 0) on radar
          // For any world displacement (dx, dz):
          // rx = dx * cos(yaw) - dz * sin(yaw)
          // ry = dx * sin(yaw) + dz * cos(yaw)
          const rx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
          const ry = dx * Math.sin(yaw) + dz * Math.cos(yaw);
          return {
            x: cx + rx * scale,
            y: cy + ry * scale
          };
        } else {
          // Fixed North radar: North (-Z) is UP, East (+X) is RIGHT
          return {
            x: cx + dx * scale,
            y: cy + dz * scale
          };
        }
      };

      // 2. Draw Map Blueprint Geometry
      MAP_OBSTACLES.forEach(obs => {
        const p1 = worldToRadar(obs.x - obs.w / 2, obs.z - obs.d / 2);
        const p2 = worldToRadar(obs.x + obs.w / 2, obs.z - obs.d / 2);
        const p3 = worldToRadar(obs.x + obs.w / 2, obs.z + obs.d / 2);
        const p4 = worldToRadar(obs.x - obs.w / 2, obs.z + obs.d / 2);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();

        if (obs.type === 'catwalk') {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (obs.type === 'tunnel') {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Standard solid wall
          ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      });

      // 3. Bombsites & Spawns Icons on Blueprint
      // Bombsite [A] at Catwalk (18, 0)
      const siteA = worldToRadar(18, 0);
      ctx.beginPath();
      ctx.arc(siteA.x, siteA.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A', siteA.x, siteA.y + 0.5);

      // Bombsite [B] at Long A Plaza (-24, 14)
      const siteB = worldToRadar(-24, 14);
      ctx.beginPath();
      ctx.arc(siteB.x, siteB.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', siteB.x, siteB.y + 0.5);

      // Terrorist Spawn [T] at (-28, -28)
      const spawnT = worldToRadar(-28, -28);
      ctx.beginPath();
      ctx.arc(spawnT.x, spawnT.y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('T', spawnT.x, spawnT.y + 0.5);

      // Counter-Terrorist Spawn [CT] at (28, 28)
      const spawnCT = worldToRadar(28, 28);
      ctx.beginPath();
      ctx.arc(spawnCT.x, spawnCT.y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 6.5px monospace';
      ctx.fillText('CT', spawnCT.x, spawnCT.y + 0.5);

      // 4. Rotating Radar Sweep Beam (Military tactical effect)
      sweepAngleRef.current = (sweepAngleRef.current + 0.025) % (Math.PI * 2);
      const sweep = sweepAngleRef.current;
      const sweepX = cx + Math.cos(sweep) * radius;
      const sweepY = cy + Math.sin(sweep) * radius;

      const sweepGrad = ctx.createLinearGradient(cx, cy, sweepX, sweepY);
      sweepGrad.addColorStop(0, 'rgba(52, 211, 153, 0.45)');
      sweepGrad.addColorStop(1, 'rgba(52, 211, 153, 0.0)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, sweep - 0.35, sweep);
      ctx.closePath();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = sweepGrad;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 5. Allies Markers (Cyan/Blue dots with direction)
      if (radarData?.allies) {
        radarData.allies.forEach(ally => {
          const pt = worldToRadar(ally.x, ally.z);
          // Check if within radar circle bounds
          const dFromCenter = Math.hypot(pt.x - cx, pt.y - cy);
          if (dFromCenter <= radius - 4) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Direction pointer line for ally
            if (ally.rotY !== undefined) {
              const allyAngle = rotateRadar
                ? -(ally.rotY - yaw) - Math.PI / 2
                : -ally.rotY - Math.PI / 2;
              const ptrX = pt.x + Math.cos(allyAngle) * 7;
              const ptrY = pt.y + Math.sin(allyAngle) * 7;
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
              ctx.lineTo(ptrX, ptrY);
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            // Elevation indicator
            if (ally.y !== undefined && ally.y > (pPos.y || 1.6) + 1.2) {
              ctx.fillStyle = '#38bdf8';
              ctx.font = '7px sans-serif';
              ctx.fillText('▲', pt.x, pt.y - 7);
            } else if (ally.y !== undefined && ally.y < (pPos.y || 1.6) - 1.2) {
              ctx.fillStyle = '#38bdf8';
              ctx.font = '7px sans-serif';
              ctx.fillText('▼', pt.x, pt.y + 11);
            }
          }
        });
      }

      // 6. Enemies Markers (Bright Red pulsing diamond with elevation)
      if (radarData?.enemies) {
        radarData.enemies.forEach(enemy => {
          const pt = worldToRadar(enemy.x, enemy.z);
          const dFromCenter = Math.hypot(pt.x - cx, pt.y - cy);
          if (dFromCenter <= radius - 4) {
            // Pulsing diamond
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-3.5, -3.5, 7, 7);
            ctx.strokeStyle = '#fee2e2';
            ctx.lineWidth = 1;
            ctx.strokeRect(-3.5, -3.5, 7, 7);
            ctx.restore();

            // Direction pointer line for enemy
            if (enemy.rotY !== undefined) {
              const enemyAngle = rotateRadar
                ? -(enemy.rotY - yaw) - Math.PI / 2
                : -enemy.rotY - Math.PI / 2;
              const ptrX = pt.x + Math.cos(enemyAngle) * 6;
              const ptrY = pt.y + Math.sin(enemyAngle) * 6;
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
              ctx.lineTo(ptrX, ptrY);
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            // Elevation indicator
            if (enemy.y !== undefined && enemy.y > (pPos.y || 1.6) + 1.2) {
              ctx.fillStyle = '#f87171';
              ctx.font = 'bold 7px sans-serif';
              ctx.fillText('▲', pt.x, pt.y - 8);
            } else if (enemy.y !== undefined && enemy.y < (pPos.y || 1.6) - 1.2) {
              ctx.fillStyle = '#f87171';
              ctx.font = 'bold 7px sans-serif';
              ctx.fillText('▼', pt.x, pt.y + 12);
            }
          }
        });
      }

      // 7. Local Player FOV Vision Cone & Center Arrow
      // When rotateRadar is true, player always faces UP (-PI/2)
      // When rotateRadar is false, player direction on canvas is -yaw - PI/2
      const playerAngle = rotateRadar ? -Math.PI / 2 : -yaw - Math.PI / 2;

      // Vision cone (65 degrees field of view)
      const fovAngle = (65 * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 38, playerAngle - fovAngle / 2, playerAngle + fovAngle / 2);
      ctx.closePath();
      const fovGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 38);
      fovGrad.addColorStop(0, 'rgba(52, 211, 153, 0.45)');
      fovGrad.addColorStop(1, 'rgba(52, 211, 153, 0.02)');
      ctx.fillStyle = fovGrad;
      ctx.fill();

      // Player Arrow
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(playerAngle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5, 5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // Restore clip

      // 8. Outer Tactical Bezel & Compass Points
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cardinal direction letters (N, E, S, W)
      // World North is along -Z. On radar, its angle from center is:
      const northAngle = rotateRadar ? (yaw - Math.PI / 2) : -Math.PI / 2;
      const getCompassPos = (angOffset: number) => {
        const a = northAngle + angOffset;
        return {
          x: cx + Math.cos(a) * (radius - 9),
          y: cy + Math.sin(a) * (radius - 9)
        };
      };

      const cardinals: { label: string; offset: number; color: string; bold: boolean }[] = [
        { label: 'N', offset: 0, color: '#34d399', bold: true },
        { label: 'E', offset: Math.PI / 2, color: '#6ee7b7', bold: false },
        { label: 'S', offset: Math.PI, color: '#6ee7b7', bold: false },
        { label: 'W', offset: -Math.PI / 2, color: '#6ee7b7', bold: false },
      ];

      cardinals.forEach(card => {
        const pos = getCompassPos(card.offset);
        ctx.fillStyle = card.color;
        ctx.font = card.bold ? 'bold 9px monospace' : '7.5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.label, pos.x, pos.y);
      });

      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, [radarData, rotateRadar, zoomLevel]);

  const currentLocation = radarData ? getLocationName(radarData.playerPos.x, radarData.playerPos.z) : '📍 ĐANG TẢI...';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono">
      {/* 1. Low Health Red Vignette / Damage Flash */}
      {isLowHealth && !isDead && (
        <div className="absolute inset-0 border-8 border-red-600/35 animate-pulse pointer-events-none" />
      )}

      {/* 2. Top Match Status Banner */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/85 backdrop-blur-md px-5 py-1.5 rounded-md border border-neutral-700 shadow-2xl z-20">
        {/* Red Team */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 font-bold text-xs tracking-wider">ĐỘI ĐỎ</span>
          <span className="text-xl font-black text-red-500 ml-1">{redScore}</span>
        </div>

        <div className="h-5 w-px bg-neutral-700 mx-1" />

        {/* Round & Timer */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-neutral-400 uppercase tracking-widest">HIỆP {round}</span>
          <span className={`text-lg font-black leading-tight ${timeLeft <= 15 ? 'text-red-400 animate-bounce' : 'text-amber-400'}`}>
            {timeFormatted}
          </span>
        </div>

        <div className="h-5 w-px bg-neutral-700 mx-1" />

        {/* Blue Team */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-blue-500 mr-1">{blueScore}</span>
          <span className="text-blue-400 font-bold text-xs tracking-wider">ĐỘI XANH</span>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
        </div>
      </div>

      {/* 3. Top-Left High-Definition Tactical Minimap / Radar */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-auto z-20">
        <div className="relative w-[160px] h-[160px] bg-black/90 rounded-2xl border-2 border-emerald-500/70 p-1 shadow-2xl overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={190}
            height={190}
            className="w-full h-full block rounded-xl"
          />

          {/* Radar Quick Controls (Rotate view mode & Zoom +/-) */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-emerald-500/40">
            <button
              onClick={() => setRotateRadar(prev => !prev)}
              className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5 cursor-pointer"
              title={rotateRadar ? 'Chế độ xoay theo tầm nhìn (Bấm để cố định Bắc)' : 'Chế độ cố định Bắc (Bấm để xoay theo tầm nhìn)'}
            >
              <Navigation className={`w-2.5 h-2.5 ${rotateRadar ? 'text-emerald-400' : 'text-neutral-400'}`} />
              <span>{rotateRadar ? 'XOAY' : 'BẮC'}</span>
            </button>
            <div className="w-px h-2.5 bg-neutral-700" />
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.6, prev + 0.15))}
              className="text-[10px] font-bold text-neutral-300 hover:text-white px-0.5 cursor-pointer"
              title="Phóng to radar"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.15))}
              className="text-[10px] font-bold text-neutral-300 hover:text-white px-0.5 cursor-pointer"
              title="Thu nhỏ radar"
            >
              -
            </button>
          </div>

          {/* Tactical Radar Badge Bottom */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[8px] text-emerald-300 font-bold tracking-widest">RADAR</span>
          </div>
        </div>

        {/* Current Location Zone Banner */}
        <div className="bg-black/85 backdrop-blur-md px-2 py-0.5 rounded border border-neutral-700/80 shadow-lg text-[10px] font-bold text-amber-300 tracking-wide text-center truncate w-[160px]">
          {currentLocation}
        </div>

        {/* CS:GO Money Cash Counter & Buy Button */}
        <div className="relative flex items-center justify-between px-2 py-1 w-[160px] bg-black/80 rounded-lg border border-emerald-500/40 shadow-lg">
          <div className="flex items-center gap-1">
            <span className="text-xs font-black font-mono text-emerald-500">$</span>
            <span className="text-sm font-black font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
              {money.toLocaleString()}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBuyMenu?.();
            }}
            className="flex items-center gap-1 bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 hover:text-amber-100 px-2 py-0.5 rounded border border-amber-500/60 text-[10px] font-bold tracking-wider transition-colors cursor-pointer"
            title="Mở cửa hàng mua vũ khí & trang bị (Phím B)"
          >
            <ShoppingCart className="w-3 h-3 text-amber-400" />
            <span>CHỢ [B]</span>
          </button>

          {/* Floating Money Reward Notification */}
          {(moneyRewardNotice || coinAnimation) && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-emerald-950/90 border border-emerald-500/60 px-2 py-0.5 rounded text-[10px] font-black text-emerald-300 shadow-lg animate-bounce">
              +${(moneyRewardNotice?.amount || 10000).toLocaleString()} {moneyRewardNotice?.reason || ''}
            </div>
          )}
        </div>

        {/* Compact Transparent Chat Tab Under Radar */}
        <div className="flex flex-col w-[250px] max-w-[75vw] select-text pointer-events-auto mt-0.5">
          <div
            ref={chatScrollRef}
            className="flex flex-col gap-0.5 max-h-[95px] overflow-y-auto overflow-x-hidden pr-1 text-[10.5px] leading-tight [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {chatMessages.length > 0 &&
              chatMessages.slice(-15).map((msg, idx) => {
                const isAll = msg.channel === 'all';
                const isSys = msg.channel === 'system';
                return (
                  <div
                    key={`${msg.id}_${idx}`}
                    className="flex flex-wrap items-baseline gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] [text-shadow:_0_1px_2px_rgb(0_0_0_/_90%)]"
                  >
                    {isSys ? (
                      <span className="text-emerald-400 font-bold tracking-wider">[HỆ THỐNG]</span>
                    ) : isAll ? (
                      <span className="text-amber-400 font-bold tracking-wider">[TẤT CẢ]</span>
                    ) : (
                      <span className={msg.team === 'red' ? 'text-red-400 font-bold tracking-wider' : 'text-sky-400 font-bold tracking-wider'}>
                        [ĐỘI]
                      </span>
                    )}
                    {!isSys && (
                      <span className={msg.team === 'red' ? 'text-red-300 font-bold' : 'text-sky-300 font-bold'}>
                        {msg.senderName}:
                      </span>
                    )}
                    <span className={isSys ? 'text-emerald-200 font-semibold' : 'text-neutral-100 font-medium'}>
                      {msg.text}
                    </span>
                  </div>
                );
              })}
          </div>

          <form
            onSubmit={handleSubmitChat}
            className="flex items-center gap-1.5 mt-0.5 border-b border-white/30 focus-within:border-amber-400 transition-colors py-0.5 bg-black/20 focus-within:bg-black/50 rounded-sm px-1"
          >
            <span className="text-[9.5px] font-bold shrink-0 select-none">
              {chatInput.toLowerCase().startsWith('/all ') || chatInput.toLowerCase() === '/all' ? (
                <span className="text-amber-400 font-black tracking-wider">[TẤT CẢ]</span>
              ) : (
                <span className={localPlayerTeam === 'red' ? 'text-red-400 font-bold' : 'text-sky-400 font-bold'}>
                  [ĐỘI]
                </span>
              )}
            </span>

            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onFocus={() => {
                setIsChatFocused(true);
                onChatFocus?.();
              }}
              onBlur={() => setIsChatFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  setIsChatFocused(false);
                  onRequestLock();
                } else if (e.key === 'Enter') {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSubmitChat();
                }
              }}
              placeholder="Nhấn Enter để chat..."
              maxLength={120}
              className="w-full bg-transparent text-[10.5px] text-white placeholder-neutral-400/80 focus:outline-none drop-shadow-[0_1px_2px_rgba(0,0,0,1)] font-mono"
            />
          </form>
        </div>
      </div>

      {/* 4. Top-Right Killfeed */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 max-w-xs pointer-events-none z-20">
        {killFeed.slice(-5).map((kf) => {
          const kfWeapon = WEAPONS[kf.weapon] || WEAPONS.ak47;
          return (
            <div
              key={kf.id}
              className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded border border-neutral-800 text-[11px] shadow-md animate-fade-in"
            >
              <span className={kf.killerTeam === 'red' ? 'text-red-400 font-bold truncate max-w-[90px]' : 'text-blue-400 font-bold truncate max-w-[90px]'}>
                {kf.killerName}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${kf.weapon === 'knife' ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-neutral-800/80 text-neutral-300'}`}>
                {kf.weapon === 'knife' ? '🔪 ' + kfWeapon.name : kfWeapon.name}
              </span>
              {kf.isHeadshot && (
                <span className="text-red-500 font-black text-xs" title="Headshot!">
                  🎯
                </span>
              )}
              <span className="text-neutral-500">→</span>
              <span className={kf.victimTeam === 'red' ? 'text-red-400 font-bold truncate max-w-[90px]' : 'text-blue-400 font-bold truncate max-w-[90px]'}>
                {kf.victimName}
              </span>
            </div>
          );
        })}
      </div>

      {/* 5A. AWP Sniper Scope Overlay */}
      {isScoped && weapon === 'awp' && !isDead && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          {/* Darkened outer scope mask */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(0,0,0,0.96)_31%)]" />
          {/* Scope Ring Bezel */}
          <div className="relative w-[58vh] h-[58vh] rounded-full border-4 border-neutral-900 shadow-[0_0_60px_rgba(0,0,0,1)] flex items-center justify-center">
            {/* Horizontal & Vertical Hairlines */}
            <div className="absolute inset-x-0 h-[1px] bg-black/90" />
            <div className="absolute inset-y-0 w-[1px] bg-black/90" />
            {/* Thick outer stadia bars */}
            <div className="absolute left-0 w-[18%] h-[3px] bg-black" />
            <div className="absolute right-0 w-[18%] h-[3px] bg-black" />
            <div className="absolute top-0 h-[18%] w-[3px] bg-black" />
            <div className="absolute bottom-0 h-[18%] w-[3px] bg-black" />
            {/* Center red illuminated dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            {/* Scope Zoom Indicator */}
            <div className="absolute bottom-6 bg-black/80 border border-emerald-500/40 px-2.5 py-0.5 rounded text-[10px] text-emerald-400 font-bold tracking-widest">
              AWP OPTICS • ZOOM {scopeLevel === 2 ? '8X' : '3.5X'}
            </div>
          </div>
        </div>
      )}

      {/* 5B. M4A1-S Tactical ADS Sight Overlay */}
      {isScoped && weapon === 'm4a1s' && !isDead && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
      )}

      {/* 5C. Center Dynamic Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        {!(isScoped && weapon === 'awp') && (
          !isKnife ? (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute -top-3 w-0.5 h-2.5 bg-emerald-400 shadow-[0_0_4px_#34d399]" />
              <div className="absolute -bottom-3 w-0.5 h-2.5 bg-emerald-400 shadow-[0_0_4px_#34d399]" />
              <div className="absolute -left-3 h-0.5 w-2.5 bg-emerald-400 shadow-[0_0_4px_#34d399]" />
              <div className="absolute -right-3 h-0.5 w-2.5 bg-emerald-400 shadow-[0_0_4px_#34d399]" />
              <div className="w-1 h-1 bg-emerald-400 rounded-full" />
            </div>
          ) : (
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400 shadow-[0_0_5px_#f59e0b]" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400 shadow-[0_0_5px_#f59e0b]" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400 shadow-[0_0_5px_#f59e0b]" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400 shadow-[0_0_5px_#f59e0b]" />
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_4px_#f59e0b]" />
            </div>
          )
        )}

        {/* Hitmarker X Animation */}
        {hitMarker && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-125 transition-transform duration-75">
            <span className="text-red-500 font-black text-2xl select-none animate-ping">✕</span>
          </div>
        )}

        {/* Headshot Elimination Special FX */}
        {headshotEffect && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(220,38,38,0.38)_100%)] animate-pulse pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full bg-red-600/30 animate-ping" />
            <div className="absolute w-32 h-32 rounded-full border-2 border-red-500/80 animate-pulse" />

            <div className="flex flex-col items-center justify-center animate-headshot-pop drop-shadow-[0_0_24px_rgba(239,68,68,1)]">
              <div className="flex items-center gap-2.5 bg-black/95 px-4 py-1.5 rounded-full border-2 border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.8)]">
                <Skull className="w-5 h-5 text-red-500 animate-pulse drop-shadow-[0_0_8px_#ef4444]" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xs font-black tracking-widest text-red-400 uppercase font-mono drop-shadow-[0_0_6px_#ef4444]">
                    HEADSHOT!
                  </span>
                  <span className="text-[9px] font-bold text-amber-300 tracking-wider font-mono mt-0.5">
                    PHÁT BẮN VÀO ĐẦU
                  </span>
                </div>
                <span className="text-sm select-none">🎯</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reloading notification */}
      {isReloading && (
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/85 px-4 py-1.5 rounded border border-amber-500/60 text-amber-400 text-xs animate-pulse z-20">
          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
          <span>ĐANG NẠP ĐẠN...</span>
        </div>
      )}

      {/* 6. Bottom-Left: Retro Health & Armor Display */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-black/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-neutral-700 shadow-2xl z-20">
        {/* Health Section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className={`text-xl font-black ${isLowHealth ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
              +
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-400 tracking-wider">MÁU (HP)</span>
              <span className={`text-2xl font-black tracking-tight leading-none ${isLowHealth ? 'text-red-500' : 'text-emerald-400'}`}>
                {health}
              </span>
            </div>
          </div>
          <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${isLowHealth ? 'bg-red-500' : 'bg-emerald-400'}`}
              style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
            />
          </div>
        </div>

        <div className="h-8 w-px bg-neutral-700" />

        {/* Armor Section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-neutral-400 tracking-wider">
                GIÁP {hasHelmet ? '+ MŨ' : ''}
              </span>
              <span className="text-2xl font-black text-sky-400 tracking-tight leading-none">
                {armor}
              </span>
            </div>
          </div>
          <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, armor))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7. Bottom-Center: CS:GO 3-Slot Weapon Bar (1: Primary, 2: Pistol, 3: Knife) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-neutral-700 shadow-2xl z-20">
        {/* Slot 1: Primary Weapon */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
            primaryWeapon && weapon === primaryWeapon
              ? 'bg-amber-500/25 border border-amber-500 text-amber-300 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : primaryWeapon
              ? 'bg-neutral-800/60 border border-transparent text-neutral-300'
              : 'bg-neutral-900/50 border border-dashed border-neutral-700 text-neutral-600'
          }`}
        >
          <span className="text-[10px] font-bold text-neutral-300 bg-neutral-700/80 px-1.5 py-0.5 rounded">1</span>
          <span className="text-[11px] font-semibold uppercase">
            {primaryWeapon ? WEAPONS[primaryWeapon].name : 'MUA SÚNG [B]'}
          </span>
        </div>

        {/* Slot 2: Secondary Pistol */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
            weapon === secondaryWeapon
              ? 'bg-amber-500/25 border border-amber-500 text-amber-300 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : 'bg-neutral-800/60 border border-transparent text-neutral-300'
          }`}
        >
          <span className="text-[10px] font-bold text-neutral-300 bg-neutral-700/80 px-1.5 py-0.5 rounded">2</span>
          <span className="text-[11px] font-semibold uppercase">{WEAPONS[secondaryWeapon].name}</span>
        </div>

        {/* Slot 3: Knife */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
            weapon === 'knife'
              ? 'bg-amber-500/25 border border-amber-500 text-amber-300 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
              : 'bg-neutral-800/60 border border-transparent text-neutral-300'
          }`}
        >
          <span className="text-[10px] font-bold text-neutral-300 bg-neutral-700/80 px-1.5 py-0.5 rounded">3</span>
          <span className="text-[11px] font-semibold uppercase">{WEAPONS.knife.vietnameseName}</span>
        </div>
      </div>

      {/* 8. Bottom-Right: Ammo / Melee Tactical Counter */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-black/85 backdrop-blur-md px-4 py-2.5 rounded-lg border border-neutral-700 shadow-2xl z-20">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-neutral-400 tracking-wider uppercase flex items-center gap-1">
            {isKnife && <Zap className="w-3 h-3 text-amber-400" />}
            {currentWeaponData.vietnameseName}
          </span>
          <div className="flex items-baseline gap-1.5">
            {!isKnife ? (
              <>
                {isGodMode ? (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-yellow-400 tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                      ∞ / ∞
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 font-bold uppercase tracking-widest animate-pulse">
                      GODMODE
                    </span>
                  </div>
                ) : (
                  <>
                    <span className={`text-3xl font-black tracking-tighter ${ammo <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                      {ammo}
                    </span>
                    <span className="text-base text-neutral-500">/</span>
                    <span className="text-lg font-bold text-neutral-400">{reserveAmmo}</span>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-base font-black text-amber-400 tracking-wider">CHÉM CẬN CHIẾN</span>
                <span className="text-[10px] text-neutral-400">Chuột Trái: Chém • Chuột Phải: Đâm</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 9. Death Screen */}
      {isDead && (
        <div className="absolute inset-0 bg-red-950/65 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto z-30">
          <h2 className="text-4xl sm:text-5xl font-black text-red-500 tracking-widest mb-2 animate-pulse">
            BẠN ĐÃ BỊ HẠ GỤC
          </h2>
          <p className="text-neutral-200 text-sm sm:text-base mb-4">
            Đang chờ kết thúc hiệp đấu để bước sang hiệp mới...
          </p>
          <div className="w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${Math.max(15, ((4 - respawnTimer) / 4) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 10. Round Victory / Defeat Announcement Banner */}
      {roundStatus.show && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-black/90 border-2 border-amber-500 px-8 py-5 rounded-xl shadow-2xl animate-bounce pointer-events-none z-40">
          <span className="text-3xl sm:text-4xl font-black text-amber-400 mb-1.5 text-center">
            {roundStatus.winner === 'red' ? 'ĐỘI ĐỎ THẮNG HIỆP' : roundStatus.winner === 'blue' ? 'ĐỘI XANH THẮNG HIỆP' : 'HÒA HIỆP ĐẤU'}
          </span>
          <span className="text-neutral-300 text-xs sm:text-sm tracking-wide text-center">{roundStatus.message}</span>
        </div>
      )}

      {/* 11. Sleek Non-Blocking Click-to-Lock Top Bar */}
      {!isLocked && !isDead && !isBuyMenuOpen && (
        <div
          onClick={onRequestLock}
          className="absolute top-14 left-1/2 -translate-x-1/2 bg-amber-950/90 hover:bg-amber-900 border-2 border-amber-500/80 px-5 py-2 rounded-full shadow-2xl cursor-pointer pointer-events-auto flex items-center gap-2.5 transition-transform hover:scale-105 z-30"
        >
          <CrosshairIcon className="w-4 h-4 text-amber-400 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
          <div className="text-left">
            <span className="text-[11px] font-bold text-amber-300 block">
              NHẤP VÀO ĐÂY (HOẶC VÀO GAME) ĐỂ KHÓA CHUỘT NGẮM BẮN
            </span>
            <span className="text-[9.5px] text-amber-200/80 hidden sm:block">
              WASD: Di chuyển • 1,2,3: Đổi súng • Chuột phải: Ngắm AWP/M4A1-S • B: Chợ mua súng CS:GO
            </span>
          </div>
        </div>
      )}

      {/* 12. Tactical CS:GO Buy Menu (Phím B) */}
      <BuyMenu
        isOpen={!!isBuyMenuOpen}
        money={money || 0}
        currentWeapon={weapon}
        primaryWeapon={primaryWeapon}
        secondaryWeapon={secondaryWeapon}
        currentArmor={armor}
        hasHelmet={hasHelmet}
        onBuyItem={(itemId) => {
          onBuyItem?.(itemId);
        }}
        onClose={() => {
          onToggleBuyMenu?.();
          onRequestLock();
        }}
      />
    </div>
  );
};
