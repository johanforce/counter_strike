import React, { useRef, useEffect } from 'react';
import { MapId, MAPS_METADATA } from '../types/game';
import { getMapBlueprint } from '../game/map';
import { MapPin, X, Info, Shield, Bomb, Flag, Sparkles, Navigation } from 'lucide-react';

interface MapBlueprintModalProps {
  isOpen: boolean;
  mapId: MapId;
  onClose: () => void;
  onSelectMap?: (id: MapId) => void;
  selectable?: boolean;
}

export const MapBlueprintModal: React.FC<MapBlueprintModalProps> = ({
  isOpen,
  mapId,
  onClose,
  onSelectMap,
  selectable = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const meta = MAPS_METADATA[mapId] || MAPS_METADATA.dust2;
  const blueprint = getMapBlueprint(mapId);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const worldRadius = 38;
    const scale = (Math.min(width, height) / 2 - 18) / worldRadius;

    const toCanvas = (wx: number, wz: number) => ({
      x: cx + wx * scale,
      y: cy + wz * scale
    });

    // 1. Dark Blueprint Grid Background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    // Subtle tactical grid
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer radar ring
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) / 2 - 14, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Obstacles & Structures
    blueprint.obstacles.forEach((obs) => {
      const p1 = toCanvas(obs.x - obs.w / 2, obs.z - obs.d / 2);
      const p2 = toCanvas(obs.x + obs.w / 2, obs.z - obs.d / 2);
      const p3 = toCanvas(obs.x + obs.w / 2, obs.z + obs.d / 2);
      const p4 = toCanvas(obs.x - obs.w / 2, obs.z + obs.d / 2);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();

      if (obs.type === 'catwalk') {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (obs.type === 'tunnel') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (obs.type === 'crate') {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.45)';
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        // Standard wall
        ctx.fillStyle = 'rgba(52, 211, 153, 0.32)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // 3. Bombsites A & B
    blueprint.bombsites.forEach((site) => {
      const pt = toCanvas(site.x, site.z);

      // Glow circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fill();

      // Main pin
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 9.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(site.id, pt.x, pt.y + 0.5);

      // Site Name Text
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText(`SITE ${site.id}`, pt.x, pt.y + 17);
    });

    // 4. Spawns
    const redSpawn = toCanvas(blueprint.spawns.red.x, blueprint.spawns.red.z);
    ctx.beginPath();
    ctx.arc(redSpawn.x, redSpawn.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#fee2e2';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', redSpawn.x, redSpawn.y + 0.5);

    const blueSpawn = toCanvas(blueprint.spawns.blue.x, blueprint.spawns.blue.z);
    ctx.beginPath();
    ctx.arc(blueSpawn.x, blueSpawn.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CT', blueSpawn.x, blueSpawn.y + 0.5);

    // 5. Callouts Badges
    blueprint.callouts.forEach((co) => {
      const pt = toCanvas(co.x, co.z);
      ctx.fillStyle = co.color || '#38bdf8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`📍${co.name}`, pt.x, pt.y);
    });

    // Compass indicator (North is UP)
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BẮC (N)', cx, 14);
  }, [isOpen, mapId, blueprint]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 pointer-events-auto select-none overflow-hidden font-mono">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-neutral-950 border-2 border-amber-500/70 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-amber-950/80 via-neutral-900 to-neutral-950 px-5 py-3 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  {meta.vietnameseName} ({meta.code.toUpperCase()})
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: `${meta.accentColor}25`, color: meta.accentColor, border: `1px solid ${meta.accentColor}60` }}>
                  {meta.difficulty}
                </span>
              </div>
              <p className="text-xs text-neutral-400">{meta.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectable && onSelectMap && (
              <button
                onClick={() => {
                  onSelectMap(mapId);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide cursor-pointer transition-colors"
              >
                Chọn Bản Đồ Này
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900/60 text-neutral-400 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Minimap Canvas & Tactical Info */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 p-4 overflow-y-auto">
          {/* Left: 2D Minimap Canvas (5 cols) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-black/90 rounded-xl p-3 border border-neutral-800 relative">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="w-full max-w-[320px] aspect-square block rounded-lg shadow-inner"
            />
            {/* Map Legend */}
            <div className="w-full mt-3 pt-2.5 border-t border-neutral-800 grid grid-cols-3 gap-2 text-[10px] text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 border border-white font-bold text-black flex items-center justify-center text-[8px]">A</span>
                <span>Site A & B</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>T Spawn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>CT Spawn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500/70 border border-emerald-400" />
                <span>Tường / Cửa</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-cyan-500/70 border border-cyan-400" />
                <span>Đường Hầm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500/70 border border-amber-400" />
                <span>Catwalk Trên Cao</span>
              </div>
            </div>
          </div>

          {/* Right: Tactical Briefing & Smoke Line-ups (6 cols) */}
          <div className="md:col-span-6 flex flex-col justify-between gap-3 text-xs">
            {/* Overview */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Tổng Quan & Bối Cảnh Chiến Địa
              </span>
              <p className="text-neutral-300 text-[11.5px] leading-relaxed">
                {meta.description}
              </p>
            </div>

            {/* Tactical Briefing Bullet Points */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Cứ Điểm Chiến Thuật Huyết Mạch
              </span>
              <ul className="space-y-1.5 text-neutral-300 text-[11px]">
                {meta.tacticalBriefing.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Smoke Grenade Line-ups & Tactics */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Vị Trí Ném Lựu Đạn Khói (Smoke) & Nổ (HE)
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                {blueprint.tactics.smokeSpots.map((spot, idx) => (
                  <div key={idx} className="bg-neutral-950 px-2 py-1 rounded border border-neutral-800 text-neutral-300 flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">💨</span>
                    <span className="truncate">{spot}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Match Win Condition Banner */}
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black text-sm">🏆 THỂ THỨC TRẬN:</span>
                <span className="text-neutral-200">
                  Đội nào chạm <strong className="text-amber-300 font-bold">7 HIỆP THẮNG</strong> trước sẽ giành CHIẾN THẮNG CHUNG CUỘC!
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
