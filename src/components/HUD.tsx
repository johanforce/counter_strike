import React from 'react';
import { WeaponType, KillFeedEvent, WEAPONS } from '../types/game';
import { Shield, Crosshair as CrosshairIcon, RotateCcw, Zap } from 'lucide-react';

interface HUDProps {
  health: number;
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
    playerPos: { x: number; z: number; rotY: number };
    allies: { x: number; z: number }[];
    enemies: { x: number; z: number }[];
  } | null;
  roundStatus: {
    show: boolean;
    winner?: 'red' | 'blue' | 'draw';
    message: string;
  };
  onRequestLock: () => void;
  onOpenSettings: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  health,
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
  onRequestLock,
  onOpenSettings
}) => {
  const currentWeaponData = WEAPONS[weapon];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isLowHealth = health <= 30;
  const isKnife = weapon === 'knife';

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

      {/* 3. Top-Left Radar / Minimap */}
      <div className="absolute top-4 left-4 w-36 h-36 bg-black/85 rounded-full border-2 border-emerald-600/60 p-1 shadow-lg overflow-hidden flex items-center justify-center pointer-events-none">
        {/* Radar grid lines */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-full h-px bg-emerald-500" />
          <div className="h-full w-px bg-emerald-500 absolute" />
          <div className="w-20 h-20 rounded-full border border-emerald-500" />
        </div>

        {/* Player and Entity markers relative to map size */}
        {radarData && (
          <div className="relative w-full h-full">
            {/* Center Player arrow */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-emerald-400"
              style={{ transform: `translate(-50%, -50%) rotate(${(-radarData.playerPos.rotY * 180) / Math.PI}deg)` }}
            />

            {/* Allies */}
            {radarData.allies.map((a, idx) => {
              const rx = ((a.x - radarData.playerPos.x) / 70) * 60 + 72;
              const rz = ((a.z - radarData.playerPos.z) / 70) * 60 + 72;
              return (
                <div
                  key={'al_' + idx}
                  className="absolute w-2 h-2 bg-blue-400 rounded-full ring-1 ring-blue-200"
                  style={{ left: `${Math.max(4, Math.min(138, rx))}px`, top: `${Math.max(4, Math.min(138, rz))}px` }}
                />
              );
            })}

            {/* Enemies */}
            {radarData.enemies.map((e, idx) => {
              const rx = ((e.x - radarData.playerPos.x) / 70) * 60 + 72;
              const rz = ((e.z - radarData.playerPos.z) / 70) * 60 + 72;
              return (
                <div
                  key={'en_' + idx}
                  className="absolute w-2 h-2 bg-red-500 rounded-full animate-ping"
                  style={{ left: `${Math.max(4, Math.min(138, rx))}px`, top: `${Math.max(4, Math.min(138, rz))}px` }}
                />
              );
            })}
          </div>
        )}
        <span className="absolute bottom-1 text-[9px] text-emerald-500/80 font-mono tracking-tighter">RADAR</span>
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

      {/* 6. Bottom-Left: Retro Health & Armor Display */}
      <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-black/85 backdrop-blur-md p-3.5 rounded-lg border border-neutral-700 shadow-2xl">
        {/* Health */}
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-black ${isLowHealth ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
            +
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 tracking-wider">MÁU (HP)</span>
            <span className={`text-3xl font-black tracking-tight ${isLowHealth ? 'text-red-500' : 'text-emerald-400'}`}>
              {health}
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-neutral-700" />

        {/* Armor */}
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-sky-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 tracking-wider">GIÁP</span>
            <span className="text-2xl font-black text-sky-400">100</span>
          </div>
        </div>
      </div>

      {/* 7. Bottom-Center: Weapon Slot Selector Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-2 rounded-lg border border-neutral-700 shadow-2xl">
        {(['ak47', 'pistol', 'knife'] as WeaponType[]).map((wKey, idx) => {
          const w = WEAPONS[wKey];
          const active = weapon === wKey;
          return (
            <div
              key={wKey}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${
                active
                  ? 'bg-amber-500/25 border border-amber-500 text-amber-300 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-neutral-800/40 border border-transparent text-neutral-400'
              }`}
            >
              <span className="text-xs font-bold text-neutral-400 bg-neutral-700/80 px-1.5 py-0.5 rounded">
                {idx + 1}
              </span>
              <span className="text-xs font-semibold uppercase">{w.vietnameseName}</span>
            </div>
          );
        })}
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

      {/* 11. Sleek Non-Blocking Click-to-Lock Top Bar (Never blocks movement or clicks!) */}
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
              Giữ W, A, S, D để di chuyển • 1, 2, 3 đổi AK/Lục/Dao • R: Nạp đạn • Space: Nhảy • C: Ngồi
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
