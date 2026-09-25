import React, { useState, useEffect, useRef } from 'react';
import { WeaponType, KillFeedEvent, WEAPONS, ChatMessage, Team } from '../types/game';
import { Shield, Crosshair as CrosshairIcon, RotateCcw, Zap, Compass, ZoomIn, ZoomOut, Navigation, ShoppingBag, DollarSign } from 'lucide-react';
import { MiniChat } from './MiniChat';

interface HUDProps {
  health: number;
  armor: number;
  ammo: number;
  reserveAmmo: number;
  weapon: WeaponType;
  isReloading: boolean;
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
  money?: number;
  inBuyZone?: boolean;
  isScoped?: boolean;
  chatMessages?: ChatMessage[];
  playerTeam?: Team;
  onSendMessage?: (text: string) => void;
  onChatFocusChange?: (focused: boolean) => void;
  onRequestLock: () => void;
  onOpenSettings: () => void;
  onOpenBuyMenu?: () => void;
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
  ammo,
  reserveAmmo,
  weapon,
  isReloading,
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
  money = 16000,
  inBuyZone = false,
  isScoped = false,
  chatMessages = [],
  playerTeam = 'red',
  onSendMessage,
  onChatFocusChange,
  onRequestLock,
  onOpenSettings,
  onOpenBuyMenu
}) => {
  const currentWeaponData = WEAPONS[weapon];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isLowHealth = health <= 30;
  const isKnife = weapon === 'knife';

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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/85 backdrop-blur-md px-6 py-2.5 rounded-md border border-neutral-700 shadow-2xl">
        {/* Red Team */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 font-bold text-sm tracking-wider">ĐỘI ĐỎ</span>
          <span className="text-2xl font-black text-red-500 ml-1">{redScore}</span>
        </div>

        <div className="h-6 w-px bg-neutral-700 mx-2" />

        {/* Round & Timer */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-neutral-400 uppercase tracking-widest">HIỆP {round}</span>
          <span className={`text-xl font-black ${timeLeft <= 15 ? 'text-red-400 animate-bounce' : 'text-amber-400'}`}>
            {timeFormatted}
          </span>
        </div>

        <div className="h-6 w-px bg-neutral-700 mx-2" />

        {/* Blue Team */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-blue-500 mr-1">{blueScore}</span>
          <span className="text-blue-400 font-bold text-sm tracking-wider">ĐỘI XANH</span>
          <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
        </div>
      </div>

      {/* 3. Top-Left High-Definition Tactical Minimap / Radar */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-auto">
        <div className="relative w-[190px] h-[190px] bg-black/90 rounded-2xl border-2 border-emerald-500/70 p-1 shadow-2xl overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={190}
            height={190}
            className="w-full h-full block rounded-xl"
          />

          {/* Radar Quick Controls (Rotate view mode & Zoom +/-) */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-emerald-500/40">
            <button
              onClick={() => setRotateRadar(prev => !prev)}
              className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5"
              title={rotateRadar ? 'Chế độ xoay theo tầm nhìn (Bấm để cố định Bắc)' : 'Chế độ cố định Bắc (Bấm để xoay theo tầm nhìn)'}
            >
              <Navigation className={`w-2.5 h-2.5 ${rotateRadar ? 'text-emerald-400' : 'text-neutral-400'}`} />
              <span>{rotateRadar ? 'XOAY' : 'BẮC'}</span>
            </button>
            <div className="w-px h-2.5 bg-neutral-700" />
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.6, prev + 0.15))}
              className="text-[10px] font-bold text-neutral-300 hover:text-white px-0.5"
              title="Phóng to radar"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.15))}
              className="text-[10px] font-bold text-neutral-300 hover:text-white px-0.5"
              title="Thu nhỏ radar"
            >
              -
            </button>
          </div>

          {/* Tactical Radar Badge Bottom */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[9px] text-emerald-300 font-bold tracking-widest">RADAR TÁC CHIẾN</span>
          </div>
        </div>

        {/* Current Location Zone Banner */}
        <div className="bg-black/85 backdrop-blur-md px-2.5 py-1 rounded border border-neutral-700/80 shadow-lg text-[10.5px] font-bold text-amber-300 tracking-wide text-center truncate max-w-[190px]">
          {currentLocation}
        </div>

        {/* Small Tactical Chat Tab under radar (No background, team / all / coin commands) */}
        {onSendMessage && (
          <MiniChat
            messages={chatMessages}
            onSendMessage={onSendMessage}
            playerTeam={playerTeam}
            onRequestLock={onRequestLock}
            onFocusChange={onChatFocusChange}
          />
        )}
      </div>

      {/* 4. Top-Right Killfeed */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 max-w-sm pointer-events-none">
        {killFeed.slice(-5).map((kf) => (
          <div
            key={kf.id}
            className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded border border-neutral-800 text-xs shadow-md animate-fade-in"
          >
            <span className={kf.killerTeam === 'red' ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>
              {kf.killerName}
            </span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${kf.weapon === 'knife' ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-neutral-800/80 text-neutral-400'}`}>
              {kf.weapon === 'knife' ? '🔪 ' + WEAPONS[kf.weapon].vietnameseName : WEAPONS[kf.weapon].vietnameseName}
            </span>
            {kf.isHeadshot && (
              <span className="text-red-500 font-black text-xs" title="Headshot!">
                🎯
              </span>
            )}
            <span className="text-neutral-500">→</span>
            <span className={kf.victimTeam === 'red' ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>
              {kf.victimName}
            </span>
          </div>
        ))}
      </div>

      {/* 5. Center Dynamic Crosshair (Weapon-Specific: Gun vs Melee Knife) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {!isKnife ? (
          /* Gun Crosshair (AK-47 / Pistol) */
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute -top-3 w-0.5 h-2.5 bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            <div className="absolute -bottom-3 w-0.5 h-2.5 bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            <div className="absolute -left-3 h-0.5 w-2.5 bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            <div className="absolute -right-3 h-0.5 w-2.5 bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            <div className="w-1 h-1 bg-emerald-400 rounded-full" />
          </div>
        ) : (
          /* Knife Melee Crosshair: Tactical brackets around center point */
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Top-Left Bracket */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400 shadow-[0_0_5px_#f59e0b]" />
            {/* Top-Right Bracket */}
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400 shadow-[0_0_5px_#f59e0b]" />
            {/* Bottom-Left Bracket */}
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400 shadow-[0_0_5px_#f59e0b]" />
            {/* Bottom-Right Bracket */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400 shadow-[0_0_5px_#f59e0b]" />
            {/* Center melee dot */}
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_4px_#f59e0b]" />
          </div>
        )}

        {/* Hitmarker X Animation */}
        {hitMarker && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-125 transition-transform duration-75">
            <span className="text-red-500 font-black text-2xl select-none animate-ping">✕</span>
          </div>
        )}
      </div>

      {/* Reloading notification */}
      {isReloading && (
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/85 px-4 py-1.5 rounded border border-amber-500/60 text-amber-400 text-sm animate-pulse">
          <RotateCcw className="w-4 h-4 animate-spin" />
          <span>ĐANG NẠP ĐẠN...</span>
        </div>
      )}

      {/* 6. Bottom-Left: Retro Health & Armor Display with Progress Gauges */}
      <div className="absolute bottom-6 left-6 flex items-center gap-5 bg-black/85 backdrop-blur-md p-3.5 rounded-xl border border-neutral-700 shadow-2xl">
        {/* Health Section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${isLowHealth ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
              +
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 tracking-wider">MÁU (HP)</span>
              <span className={`text-3xl font-black tracking-tight leading-none ${isLowHealth ? 'text-red-500' : 'text-emerald-400'}`}>
                {health}
              </span>
            </div>
          </div>
          {/* Health Bar */}
          <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${isLowHealth ? 'bg-red-500' : 'bg-emerald-400'}`}
              style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
            />
          </div>
        </div>

        <div className="h-10 w-px bg-neutral-700" />

        {/* Armor Section */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 tracking-wider">GIÁP</span>
              <span className="text-3xl font-black text-sky-400 tracking-tight leading-none">
                {armor}
              </span>
            </div>
          </div>
          {/* Armor Bar */}
          <div className="w-20 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, armor))}%` }}
            />
          </div>
        </div>

        <div className="h-10 w-px bg-neutral-700" />

        {/* Money Section */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-neutral-400 tracking-wider">NGÂN SÁCH</span>
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight leading-none">
            ${money.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Buy Zone Indicator Button */}
      {inBuyZone && !isDead && (
        <button
          onClick={onOpenBuyMenu}
          className="absolute top-20 right-6 flex items-center gap-2.5 bg-emerald-950/90 hover:bg-emerald-900 border-2 border-emerald-500/80 px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer pointer-events-auto transition-transform hover:scale-105"
        >
          <ShoppingBag className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div className="text-left font-mono">
            <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
              <span>[B] CỬA HÀNG VŨ KHÍ</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500 text-black font-bold rounded">MỞ</span>
            </div>
            <span className="text-[10px] text-emerald-200/80">Khu vực mua sắm hiệp đấu</span>
          </div>
        </button>
      )}

      {/* Sniper Optical Scope View */}
      {isScoped && !isDead && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
          <div
            className="w-full h-full"
            style={{
              background: 'radial-gradient(circle at center, transparent 38%, rgba(0,0,0,0.92) 55%, rgba(0,0,0,0.99) 70%)'
            }}
          />
          <div className="absolute w-full h-[1px] bg-black/80" />
          <div className="absolute h-full w-[1px] bg-black/80" />
          <div className="absolute w-3.5 h-3.5 border border-red-500/70 rounded-full" />
        </div>
      )}

      {/* 7. Bottom-Center: Weapon Slot Selector Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-2 rounded-lg border border-neutral-700 shadow-2xl">
        {[
          { slot: 1, label: weapon === 'knife' || weapon === 'pistol' || weapon === 'glock' ? 'SÚNG CHÍNH' : currentWeaponData.vietnameseName, active: weapon !== 'knife' && weapon !== 'pistol' && weapon !== 'glock' },
          { slot: 2, label: weapon === 'pistol' || weapon === 'glock' ? currentWeaponData.vietnameseName : 'SÚNG LỤC', active: weapon === 'pistol' || weapon === 'glock' },
          { slot: 3, label: 'DAO GĂM', active: weapon === 'knife' }
        ].map(item => (
          <div
            key={item.slot}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
              item.active
                ? 'bg-amber-500/25 border border-amber-500 text-amber-300 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-neutral-800/40 border border-transparent text-neutral-400'
            }`}
          >
            <span className="text-xs font-bold text-neutral-400 bg-neutral-700/80 px-1.5 py-0.5 rounded">
              {item.slot}
            </span>
            <span className="text-xs font-semibold uppercase">{item.label}</span>
          </div>
        ))}
      </div>

      {/* 8. Bottom-Right: Ammo / Melee Tactical Counter */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-black/85 backdrop-blur-md px-5 py-3.5 rounded-lg border border-neutral-700 shadow-2xl">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-neutral-400 tracking-wider uppercase flex items-center gap-1">
            {isKnife && <Zap className="w-3 h-3 text-amber-400" />}
            {currentWeaponData.vietnameseName}
          </span>
          <div className="flex items-baseline gap-1.5">
            {!isKnife ? (
              <>
                <span className={`text-4xl font-black tracking-tighter ${ammo <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                  {ammo}
                </span>
                <span className="text-lg text-neutral-500">/</span>
                <span className="text-xl font-bold text-neutral-400">{reserveAmmo}</span>
              </>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-lg font-black text-amber-400 tracking-wider">CHÉM CẬN CHIẾN</span>
                <span className="text-[11px] text-neutral-400">Chuột Trái: Chém • Chuột Phải: Đâm</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 9. Death Screen */}
      {isDead && (
        <div className="absolute inset-0 bg-red-950/75 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
          <h2 className="text-5xl font-black text-red-500 tracking-widest mb-2 animate-pulse">
            BẠN ĐÃ BỊ HẠ GỤC
          </h2>
          <p className="text-neutral-300 text-lg mb-4">Hồi sinh sau: {respawnTimer} giây</p>
          <div className="w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${((3 - respawnTimer) / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 10. Round Victory / Defeat Announcement Banner */}
      {roundStatus.show && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-black/90 border-2 border-amber-500 px-10 py-6 rounded-xl shadow-2xl animate-bounce pointer-events-none">
          <span className="text-4xl font-black text-amber-400 mb-2">
            {roundStatus.winner === 'red' ? 'ĐỘI ĐỎ THẮNG HIỆP' : roundStatus.winner === 'blue' ? 'ĐỘI XANH THẮNG HIỆP' : 'HÒA HIỆP ĐẤU'}
          </span>
          <span className="text-neutral-300 text-sm tracking-wide">{roundStatus.message}</span>
        </div>
      )}

      {/* 11. Sleek Non-Blocking Click-to-Lock Top Bar */}
      {!isLocked && !isDead && (
        <div
          onClick={onRequestLock}
          className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-950/90 hover:bg-amber-900 border-2 border-amber-500/80 px-6 py-2.5 rounded-full shadow-2xl cursor-pointer pointer-events-auto flex items-center gap-3 transition-transform hover:scale-105"
        >
          <CrosshairIcon className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="text-left">
            <span className="text-xs font-bold text-amber-300 block">
              NHẤP VÀO ĐÂY (HOẶC VÀO GAME) ĐỂ KHÓA CHUỘT NGẮM BẮN
            </span>
            <span className="text-[10px] text-amber-200/80">
              W, A, S, D di chuyển • Shift: Đi chậm • 1, 2, 3 đổi súng/dao • R: Nạp đạn • Space: Nhảy • C: Ngồi
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
