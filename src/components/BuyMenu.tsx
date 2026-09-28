import React, { useEffect, useState } from 'react';
import { CS_BUY_ITEMS, WeaponType, WEAPONS } from '../types/game';
import { Shield, Crosshair, DollarSign, X, Zap, Check } from 'lucide-react';

interface BuyMenuProps {
  isOpen: boolean;
  money: number;
  currentWeapon: WeaponType;
  primaryWeapon: WeaponType | null;
  secondaryWeapon: WeaponType;
  currentArmor: number;
  hasHelmet: boolean;
  onBuyItem: (itemId: string) => void;
  onClose: () => void;
}

function WeaponSilhouette({ id }: { id: string }) {
  switch (id) {
    case 'usp':
      return (
        <svg viewBox="0 0 135 44" className="w-26 h-9 fill-current">
          <path d="M18 12h62v4h44v5H80v3H52l-5 15H33l4-15H18z" />
        </svg>
      );
    case 'pistol':
      return (
        <svg viewBox="0 0 120 44" className="w-24 h-9 fill-current">
          <path d="M24 10h66l6 5v6H56l-5 5v13H35l4-16-15-2z" />
          <rect x="38" y="13" width="44" height="3" opacity="0.35" fill="#000" />
        </svg>
      );
    case 'mp9':
      return (
        <svg viewBox="0 0 140 48" className="w-28 h-9 fill-current">
          <path d="M22 14h68v5h18v4H90v5H68v16H58V26H44l-4 14H28l4-16H14v-6h8z" />
        </svg>
      );
    case 'xm1014':
      return (
        <svg viewBox="0 0 160 44" className="w-32 h-9 fill-current">
          <path d="M10 20l22-4v-4h84v3h34v4h-34v3H64l-6 8H44l4-8H32l-16 8H8z" />
        </svg>
      );
    case 'm4a1s':
      return (
        <svg viewBox="0 0 170 48" className="w-34 h-9 fill-current">
          <path d="M8 18h22v-3h18v-4h28v4h44v2h42v6h-42v2H86l6 14H80l-6-14H58l-4 12H42l4-12H30v4H8z" />
        </svg>
      );
    case 'ak47':
      return (
        <svg viewBox="0 0 170 48" className="w-34 h-9 fill-current">
          <path d="M8 20l24-3v-4h58v3h38v-3h4v5h18v3h-22v3H88l8 15H84l-8-14H60l-5 12H43l4-12H32l-18 8H8z" />
        </svg>
      );
    case 'awp':
      return (
        <svg viewBox="0 0 190 48" className="w-36 h-9 fill-current">
          <path d="M6 20h26v-3h20v-6h6l4 2h24l4-2h6v6h38v2h50v3h-50v3H92v11H80V23H58l-4 11H42l3-9H32v5H6z" />
        </svg>
      );
    case 'hegrenade':
      return (
        <svg viewBox="0 0 80 44" className="w-16 h-9 fill-current text-red-400">
          <path d="M35 4h10v6h-10zM30 10h20v22c0 4-4 8-10 8s-10-4-10-8V10z" />
          <circle cx="48" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M28 14h24M28 20h24M28 26h24M34 10v26M46 10v26" stroke="#000" strokeWidth="1.2" opacity="0.4" />
        </svg>
      );
    case 'smokegrenade':
      return (
        <svg viewBox="0 0 80 44" className="w-16 h-9 fill-current text-cyan-400">
          <rect x="30" y="6" width="20" height="32" rx="3" />
          <rect x="36" y="2" width="8" height="4" />
          <circle cx="46" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="33" y1="14" x2="47" y2="14" stroke="#000" strokeWidth="2" opacity="0.4" />
          <line x1="33" y1="20" x2="47" y2="20" stroke="#000" strokeWidth="2" opacity="0.4" />
        </svg>
      );
    default:
      return null;
  }
}

export const BuyMenu: React.FC<BuyMenuProps> = ({
  isOpen,
  money,
  currentWeapon,
  primaryWeapon,
  secondaryWeapon,
  currentArmor,
  hasHelmet,
  onBuyItem,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'weapons' | 'grenades' | 'gear'>('all');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        const item = CS_BUY_ITEMS.find((it) => it.hotkey === e.key || it.shortcut === e.key);
        if (item) {
          e.preventDefault();
          e.stopPropagation();
          onBuyItem(item.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onBuyItem, money]);

  if (!isOpen) return null;

  const filteredItems = CS_BUY_ITEMS.filter((it) => {
    if (activeTab === 'weapons') return it.category === 'rifles' || it.category === 'smgs' || it.category === 'pistols';
    if (activeTab === 'grenades') return it.category === 'grenades';
    if (activeTab === 'gear') return it.category === 'gear';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 pointer-events-auto select-none overflow-hidden">
      <div className="w-full max-w-4xl max-h-[94vh] flex flex-col bg-neutral-950/95 border border-amber-500/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden font-mono">
        {/* Header Bar */}
        <div className="shrink-0 bg-gradient-to-r from-amber-950/70 via-neutral-900 to-neutral-900 px-4 py-2.5 border-b border-amber-500/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wider text-white uppercase leading-tight">
                CHỢ VŨ KHÍ CS:GO <span className="text-amber-400 text-xs">[PHÍM B]</span>
              </h2>
              <p className="text-[10px] text-neutral-400 hidden sm:block">
                Nhấn phím số <span className="text-amber-300 font-bold">[1 - 0]</span> hoặc click chuột để trang bị nhanh • Sống sót qua hiệp sẽ giữ nguyên súng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Current Loadout Summary Pill */}
            <div className="hidden md:flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-2.5 py-1 rounded text-[11px]">
              <span className="text-neutral-500">Súng chính:</span>
              <span className="text-amber-300 font-bold">
                {primaryWeapon ? WEAPONS[primaryWeapon].name : 'Chưa có'}
              </span>
              <span className="text-neutral-700">|</span>
              <span className="text-neutral-500">Súng lục:</span>
              <span className="text-cyan-300 font-bold">{WEAPONS[secondaryWeapon].name}</span>
            </div>

            {/* Player Balance */}
            <div className="bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded flex items-center gap-1.5 shadow-inner">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-black text-base sm:text-lg tracking-wider">
                {money.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded bg-neutral-800 hover:bg-red-900/60 text-neutral-400 hover:text-white border border-neutral-700 transition-colors cursor-pointer"
              title="Đóng (B hoặc ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="shrink-0 bg-neutral-900/70 px-4 py-1.5 border-b border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-black'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              Tất cả (1-0)
            </button>
            <button
              onClick={() => setActiveTab('weapons')}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'weapons'
                  ? 'bg-amber-500 text-black'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              Súng CS:GO (1-7)
            </button>
            <button
              onClick={() => setActiveTab('grenades')}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'grenades'
                  ? 'bg-amber-500 text-black'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              Lựu Đạn (8-9)
            </button>
            <button
              onClick={() => setActiveTab('gear')}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'gear'
                  ? 'bg-amber-500 text-black'
                  : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
              }`}
            >
              Giáp & Đạn
            </button>
          </div>

          <div className="text-[10px] text-neutral-400 hidden sm:flex items-center gap-3">
            <span>Khởi đầu Hiệp 1: <strong className="text-emerald-400">$800 + USP-S</strong></span>
            <span>•</span>
            <span>Thắng hiệp: <strong className="text-emerald-400">+$3250</strong></span>
            <span>•</span>
            <span>Thua hiệp: <strong className="text-amber-400">+$1900</strong></span>
          </div>
        </div>

        {/* Compact Grid of CS:GO Items (Fits screen without scrolling) */}
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 flex-1 content-start overflow-y-auto">
          {filteredItems.map((item) => {
            const canAfford = money >= item.price;
            const wStats = item.weaponId ? WEAPONS[item.weaponId] : null;
            const isOwned =
              (item.weaponId && (primaryWeapon === item.weaponId || secondaryWeapon === item.weaponId || currentWeapon === item.weaponId)) ||
              (item.id === 'kevlar' && currentArmor >= 100) ||
              (item.id === 'helmet' && currentArmor >= 100 && hasHelmet);

            return (
              <button
                key={item.id}
                onClick={() => onBuyItem(item.id)}
                disabled={!canAfford || !!isOwned}
                className={`group relative flex flex-col justify-between p-2.5 rounded-lg border text-left transition-all ${
                  isOwned
                    ? 'bg-emerald-950/25 border-emerald-500/50 cursor-default'
                    : canAfford
                    ? 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700 hover:border-amber-500/80 cursor-pointer shadow-md'
                    : 'bg-neutral-900/35 border-neutral-800/70 opacity-55 cursor-not-allowed'
                }`}
              >
                {/* Top Row: Hotkey + Category Badge + Price */}
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-neutral-800 border border-neutral-600 text-amber-400 font-black text-[11px] flex items-center justify-center">
                      {item.hotkey}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800/90 text-neutral-300">
                      {item.category === 'pistols'
                        ? 'SÚNG LỤC'
                        : item.category === 'smgs'
                        ? item.id === 'xm1014'
                          ? 'SHOTGUN'
                          : 'TIỂU LIÊN'
                        : item.category === 'rifles'
                        ? item.id === 'awp'
                          ? 'BẮN TỈA'
                          : 'SÚNG TRƯỜNG'
                        : 'TRANG BỊ'}
                    </span>
                  </div>

                  <span
                    className={`font-black text-sm tracking-tight ${
                      isOwned ? 'text-emerald-400' : canAfford ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isOwned ? 'ĐÃ CÓ' : `$${item.price.toLocaleString()}`}
                  </span>
                </div>

                {/* Middle Row: Name + Silhouette Icon */}
                <div className="flex items-center justify-between gap-2 my-1">
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-black text-sm tracking-wide group-hover:text-amber-300 transition-colors truncate">
                      {item.name}
                    </div>
                    <p className="text-[10px] text-neutral-400 line-clamp-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-neutral-300 group-hover:text-amber-400 transition-colors flex items-center justify-center">
                    {item.weaponId ? (
                      <WeaponSilhouette id={item.weaponId} />
                    ) : item.id === 'kevlar' || item.id === 'helmet' ? (
                      <Shield className="w-7 h-7 text-cyan-400" />
                    ) : (
                      <Zap className="w-7 h-7 text-amber-400" />
                    )}
                  </div>
                </div>

                {/* Bottom Row: Weapon Stats Bars or Action Status */}
                <div className="mt-1.5 pt-1.5 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                  {wStats ? (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <span>
                        ST: <strong className="text-white">{wStats.damage}{wStats.pellets ? `x${wStats.pellets}` : ''}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Đạn: <strong className="text-white">{wStats.magSize}/{wStats.maxReserveAmmo}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">
                        +${wStats.killReward}/kill
                      </span>
                    </div>
                  ) : (
                    <span className="text-neutral-400">Hồi phục & Bảo vệ chiến thuật</span>
                  )}

                  {isOwned ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> ĐANG DÙNG
                    </span>
                  ) : (
                    <span className={canAfford ? 'text-amber-400 font-bold' : 'text-red-500 font-bold'}>
                      {canAfford ? 'MUA' : 'THIẾU $'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-neutral-900 px-4 py-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span>
            Mẹo: Nhấn <strong className="text-white">Chuột Phải</strong> khi cầm <strong className="text-amber-400">AWP</strong> hoặc <strong className="text-amber-400">M4A1-S</strong> để bật ống ngắm (Scope).
          </span>
          <button
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-500 text-black font-black px-3.5 py-1 rounded transition-colors cursor-pointer uppercase text-xs"
          >
            Đóng Chợ (B)
          </button>
        </div>
      </div>
    </div>
  );
};
