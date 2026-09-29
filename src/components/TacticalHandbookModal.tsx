import React, { useState, useRef, useEffect } from 'react';
import { MapId, MAPS_METADATA, WEAPONS, WeaponType, CS_BUY_ITEMS } from '../types/game';
import { getMapBlueprint } from '../game/map';
import { sounds } from '../game/audio';
import {
  BookOpen,
  X,
  Crosshair,
  MapPin,
  HelpCircle,
  Volume2,
  DollarSign,
  Shield,
  Zap,
  Target,
  Flame,
  Wind,
  Layers,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface TacticalHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'weapons' | 'maps' | 'tips';
  initialMapId?: MapId;
  initialWeaponId?: WeaponType;
}

const WEAPON_CATEGORIES: { id: string; label: string; weapons: WeaponType[] }[] = [
  {
    id: 'rifles',
    label: 'Súng Trường & Tỉa',
    weapons: ['ak47', 'm4a1s', 'awp']
  },
  {
    id: 'smg_shotgun',
    label: 'Tiểu Liên & Shotgun',
    weapons: ['mp9', 'xm1014']
  },
  {
    id: 'pistols',
    label: 'Súng Lục',
    weapons: ['usp', 'pistol']
  },
  {
    id: 'tactical',
    label: 'Lựu Đạn & Cận Chiến',
    weapons: ['hegrenade', 'smokegrenade', 'knife']
  }
];

export const TacticalHandbookModal: React.FC<TacticalHandbookModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'weapons',
  initialMapId = 'dust2',
  initialWeaponId = 'ak47'
}) => {
  const [activeTab, setActiveTab] = useState<'weapons' | 'maps' | 'tips'>(initialTab);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>(initialWeaponId);
  const [selectedMap, setSelectedMap] = useState<MapId>(initialMapId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (initialMapId) setSelectedMap(initialMapId);
      if (initialWeaponId) setSelectedWeapon(initialWeaponId);
    }
  }, [isOpen, initialTab, initialMapId, initialWeaponId]);

  // Canvas radar renderer for maps tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'maps' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const worldRadius = 38;
    const scale = (Math.min(width, height) / 2 - 16) / worldRadius;

    const toCanvas = (wx: number, wz: number) => ({
      x: cx + wx * scale,
      y: cy + wz * scale
    });

    // Dark grid background
    ctx.fillStyle = '#0b0e14';
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

    const blueprint = getMapBlueprint(selectedMap);

    // Obstacles / Buildings
    ctx.fillStyle = '#1c2230';
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1.5;
    blueprint.obstacles.forEach((obs) => {
      const p1 = toCanvas(obs.x - obs.w / 2, obs.z - obs.d / 2);
      const w = obs.w * scale;
      const h = obs.d * scale;
      ctx.fillRect(p1.x, p1.y, w, h);
      ctx.strokeRect(p1.x, p1.y, w, h);
    });

    // Spawns
    const redPos = toCanvas(blueprint.spawns.red.x, blueprint.spawns.red.z);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.arc(redPos.x, redPos.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T SPAWN', redPos.x, redPos.y);

    const bluePos = toCanvas(blueprint.spawns.blue.x, blueprint.spawns.blue.z);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.beginPath();
    ctx.arc(bluePos.x, bluePos.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('CT SPAWN', bluePos.x, bluePos.y);

    // Bombsites
    blueprint.bombsites.forEach((b) => {
      const bPos = toCanvas(b.x, b.z);
      const radius = 18;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.beginPath();
      ctx.arc(bPos.x, bPos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(b.id, bPos.x, bPos.y);
    });

    // Callouts
    blueprint.callouts.forEach((c) => {
      const pos = toCanvas(c.x, c.z);
      ctx.fillStyle = c.color || '#94a3b8';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.name, pos.x, pos.y);
    });
  }, [isOpen, activeTab, selectedMap]);

  if (!isOpen) return null;

  const currentWeapon = WEAPONS[selectedWeapon];
  const currentMap = MAPS_METADATA[selectedMap];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0f1217] border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-800 bg-neutral-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wider text-amber-400 uppercase flex items-center gap-2">
                <span>CẨM NANG CHIẾN THUẬT</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-normal">
                  CS FIELD MANUAL
                </span>
              </h2>
              <p className="text-[10.5px] text-neutral-400">
                Thông số vũ khí, sơ đồ bản đồ 2D và hướng dẫn tác chiến
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Đóng cẩm nang"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/70 px-4 sm:px-6 shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('weapons')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'weapons'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Kho Vũ Khí & Trang Bị</span>
          </button>

          <button
            onClick={() => setActiveTab('maps')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'maps'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Bản Đồ & Sơ Đồ 2D</span>
          </button>

          <button
            onClick={() => setActiveTab('tips')}
            className={`py-2.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'tips'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Phím Tắt & Mẹo Bắn</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          {/* TAB 1: KHO VŨ KHÍ */}
          {activeTab === 'weapons' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left Selector (5 cols) */}
              <div className="md:col-span-5 space-y-3.5">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Danh mục trang bị tác chiến
                </span>

                <div className="space-y-3">
                  {WEAPON_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">
                        {cat.label}
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {cat.weapons.map((wId) => {
                          const w = WEAPONS[wId];
                          const isSel = selectedWeapon === wId;
                          return (
                            <button
                              key={wId}
                              onClick={() => {
                                setSelectedWeapon(wId);
                                sounds.playWeaponShot(wId);
                              }}
                              className={`w-full py-2 px-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">{w.name}</span>
                                <span className="text-[10px] text-neutral-500">{w.vietnameseName}</span>
                              </div>
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {w.price > 0 ? `$${w.price}` : 'Miễn phí'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Weapon Details Card (7 cols) */}
              <div className="md:col-span-7 bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  {/* Weapon Name & Price */}
                  <div className="flex items-start justify-between border-b border-neutral-800 pb-3 mb-4">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <span>{currentWeapon.name}</span>
                        <span className="text-xs font-normal text-amber-400">
                          ({currentWeapon.vietnameseName})
                        </span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">{currentWeapon.description}</p>
                    </div>

                    <button
                      onClick={() => sounds.playWeaponShot(selectedWeapon)}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      title="Nghe tiếng bắn"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Thử âm thanh</span>
                    </button>
                  </div>

                  {/* Weapon Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase block">Giá mua phím [B]</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {currentWeapon.price > 0 ? `$${currentWeapon.price}` : 'Mặc định'}
                      </span>
                    </div>

                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase block">Sát thương cơ bản</span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {currentWeapon.damage} HP
                      </span>
                    </div>

                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase block">Bắn trúng đầu (Headshot)</span>
                      <span className="text-sm font-black text-red-400 font-mono">
                        {Math.round(currentWeapon.damage * currentWeapon.headshotMultiplier)} HP
                        {currentWeapon.headshotMultiplier >= 4 && ' (1-Tap!)'}
                      </span>
                    </div>

                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase block">Băng đạn / Dự trữ</span>
                      <span className="text-sm font-black text-neutral-200 font-mono">
                        {currentWeapon.magSize > 0
                          ? `${currentWeapon.magSize} / ${currentWeapon.maxReserveAmmo}`
                          : '1 Quả'}
                      </span>
                    </div>

                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase block">Độ giật (Recoil)</span>
                      <span className="text-sm font-black text-neutral-200 font-mono">
                        {currentWeapon.recoilKick > 0.05
                          ? 'Mạnh (Kéo tâm xuống)'
                          : currentWeapon.recoilKick > 0.02
                          ? 'Trung bình'
                          : 'Rất êm'}
                      </span>
                    </div>

                    <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80">
                      <span className="text-[10px] text-neutral-500 uppercase block">Thưởng hạ gục</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        +${currentWeapon.killReward}
                      </span>
                    </div>
                  </div>

                  {/* Tactical Advice Box */}
                  <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-3 text-xs">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Chiến thuật khuyến nghị với {currentWeapon.name}:
                    </span>
                    <p className="text-neutral-300 leading-relaxed text-[11px]">
                      {selectedWeapon === 'ak47' &&
                        'Phát bắn đầu tiên cực kỳ chuẩn xác với khả năng One-tap tiêu diệt đối phương có nón bảo hiểm. Khi bắn liên thanh, ghì nhẹ chuột xuống dưới để kiểm soát độ giật.'}
                      {selectedWeapon === 'm4a1s' &&
                        'Nòng giảm thanh triệt tiêu vệt đạn (tracer) và không lộ vị trí khi bắn qua làn khói smoke. Băng đạn 20 viên cần nhấp từng loạt (burst fire) 2-3 viên.'}
                      {selectedWeapon === 'awp' &&
                        'Phát bắn tử thần 1 mạng chết ngay khi trúng thân hoặc đầu. Tận dụng khoảng cách xa tại Long A hoặc Mid. Di chuyển làm lệch hoàn toàn tâm ngắm, phải đứng yên khi siết cò.'}
                      {selectedWeapon === 'mp9' &&
                        'Tốc độ xả đạn cực cao, độ giật thấp khi vừa di chuyển vừa sấy. Lý tưởng cho các hiệp đấu bán phần (half-buy) hoặc áp sát đường hầm góc hẹp.'}
                      {selectedWeapon === 'xm1014' &&
                        'Shotgun bán tự động với 6 viên đạn chùm. Tàn phá khủng khiếp ở cự ly dưới 10m tại ngõ Banana hoặc Căn Hộ B.'}
                      {selectedWeapon === 'usp' &&
                        'Vũ khí khởi đầu đắc lực trong Round Pistol $800. Độ chính xác cao ở cự ly xa khi nhấp từng viên vào đầu địch.'}
                      {selectedWeapon === 'pistol' &&
                        'Súng lục uy lực mạnh mẽ với 7 viên đạn. Hai viên vào thân hoặc một viên vào đầu ở cự ly trung bình là đủ hạ gục mục tiêu.'}
                      {selectedWeapon === 'hegrenade' &&
                        'Tích hợp vật lý nảy va đập tường và sàn. Ném dội góc tường vào vị trí đối thủ đang cố thủ để gây tối đa 90 sát thương nổ nén.'}
                      {selectedWeapon === 'smokegrenade' &&
                        'Xả màn khói mù dày đặc trong 15 giây, vô hiệu hóa hoàn toàn tay ngắm Sniper AWP tại cổng Mid và ban công. Có thể dùng dội góc tường.'}
                      {selectedWeapon === 'knife' &&
                        'Đâm sau lưng gây 100 sát thương chí mạng chết ngay lập tức. Cầm dao tăng tối đa tốc độ di chuyển chạy nhanh.'}
                    </p>
                  </div>
                </div>

                {/* Footer reminder */}
                <div className="mt-3 pt-2.5 border-t border-neutral-800 text-[10.5px] text-neutral-500 flex items-center justify-between">
                  <span>Nhấn phím [B] ở đầu mỗi hiệp đấu để mở menu mua trang bị</span>
                  <span className="text-amber-400 font-bold">Chạm 7 hiệp thắng = Vô Địch</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BẢN ĐỒ & SƠ ĐỒ 2D */}
          {activeTab === 'maps' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Map Selector & Info (5 cols) */}
              <div className="md:col-span-5 space-y-3">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Chọn bản đồ tác chiến
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {(['dust2', 'mirage', 'inferno'] as MapId[]).map((mId) => {
                    const m = MAPS_METADATA[mId];
                    const isSel = selectedMap === mId;
                    return (
                      <button
                        key={mId}
                        onClick={() => {
                          setSelectedMap(mId);
                          sounds.playCoinSound();
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSel
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-400/40 shadow-lg'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
                          {m.code}
                        </div>
                        <div className="text-xs font-black text-white truncate">{m.name}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Map description */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400">{currentMap.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {currentMap.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    {currentMap.description}
                  </p>

                  {/* Key Callouts */}
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                      Các vị trí giao tranh trọng điểm:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {currentMap.keyCallouts.map((c, i) => (
                        <span
                          key={i}
                          className="text-[9.5px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Briefing */}
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                      Hướng dẫn di chuyển & tác chiến:
                    </span>
                    <ul className="text-[10.5px] text-neutral-400 space-y-1 list-disc list-inside">
                      {currentMap.tacticalBriefing.map((tip, i) => (
                        <li key={i} className="leading-snug">{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 2D Tactical Blueprint Radar (7 cols) */}
              <div className="md:col-span-7 bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col items-center justify-between">
                <div className="w-full flex items-center justify-between border-b border-neutral-800 pb-2 mb-2 text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Sơ Đồ Radar 2D: {currentMap.name}
                  </span>
                  <div className="flex items-center gap-2 text-[9.5px]">
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> T
                    </span>
                    <span className="flex items-center gap-1 text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> CT
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Bomb A/B
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" /> Smoke
                    </span>
                  </div>
                </div>

                <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-lg overflow-hidden border border-neutral-800 shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={340}
                    className="w-full h-full object-contain"
                  />
                </div>

                <p className="text-[10px] text-neutral-500 mt-2 text-center">
                  Đường đứt nét màu xanh thể hiện quỹ đạo ném lựu đạn khói che tầm nhìn địch.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PHÍM TẮT & MẸO BẮN */}
          {activeTab === 'tips' && (
            <div className="space-y-4">
              {/* Controls table */}
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Bảng Phím Tắt Điều Khiển
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">W / A / S / D</span>
                    <span className="font-bold text-neutral-200">Di chuyển</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Chuột Trái</span>
                    <span className="font-bold text-neutral-200">Bắn / Ném lựu đạn</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Chuột Phải</span>
                    <span className="font-bold text-neutral-200">Ngắm AWP / Ống ngắm</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Phím [B]</span>
                    <span className="font-bold text-emerald-400">Mở cửa hàng mua súng</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Phím [R]</span>
                    <span className="font-bold text-neutral-200">Thay nạp băng đạn</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Phím 1, 2, 3, 4</span>
                    <span className="font-bold text-neutral-200">Súng chính / Lục / Dao / Nades</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Shift / Ctrl</span>
                    <span className="font-bold text-neutral-200">Đi chậm (êm) / Ngồi</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Phím [Tab]</span>
                    <span className="font-bold text-neutral-200">Bảng điểm KDA</span>
                  </div>
                </div>
              </div>

              {/* Pro tips */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5">
                  <span className="text-xs font-black text-amber-400 uppercase flex items-center gap-1.5 mb-1.5">
                    🎯 Bí Quyết Bắn Chuẩn (Aim)
                  </span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Đứng yên hoàn toàn khi nhả đạn để đạt độ chuẩn xác tối đa. Hãy dừng bước trước khi bắn (counter-strafe) và nhắm tầm ngang đầu đối thủ.
                  </p>
                </div>

                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5">
                  <span className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1.5 mb-1.5">
                    💰 Quản Lý Tiền Tệ (Economy)
                  </span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Bắt đầu với $800, thắng hiệp nhận $3250. Đừng tiêu sạch tiền nếu đội không đủ mua súng mạnh, hãy Eco (tiết kiệm) để hiệp sau cùng mua AK-47 hoặc M4A1-S.
                  </p>
                </div>

                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5">
                  <span className="text-xs font-black text-cyan-400 uppercase flex items-center gap-1.5 mb-1.5">
                    💣 Bom & Vật Lý Lựu Đạn
                  </span>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Lựu đạn nảy khi va vào tường và vật cản. Bom C4 đếm ngược 40 giây; thời gian gỡ bom là 5 giây (hoặc 10 giây nếu không có kìm).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs shrink-0">
          <span className="text-neutral-500 text-[10.5px]">
            Hệ thống dữ liệu vũ khí & bản đồ chuẩn Counter-Strike Tactical Operations
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-lg transition-colors cursor-pointer"
          >
            ĐÃ HIỂU & ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
