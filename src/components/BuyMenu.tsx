import React, { useState, useEffect } from 'react';
import { CS_BUY_ITEMS, BuyItem, WEAPONS, WeaponType } from '../types/game';
import { Shield, Zap, Crosshair, DollarSign, X, Check, ShoppingBag, Flame, Sparkles } from 'lucide-react';
import { sounds } from '../game/audio';

interface BuyMenuProps {
  isOpen: boolean;
  money: number;
  currentWeapon: WeaponType;
  hasHelmet: boolean;
  armor: number;
  timeLeft: number;
  inBuyZone: boolean;
  onBuyItem: (itemId: string) => void;
  onClose: () => void;
}

export const BuyMenu: React.FC<BuyMenuProps> = ({
  isOpen,
  money,
  currentWeapon,
  hasHelmet,
  armor,
  timeLeft,
  inBuyZone,
  onBuyItem,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rifles' | 'smgs' | 'pistols' | 'gear'>('all');

  // Handle hotkeys (1-9 and 0 for quick buying, B and ESC for close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyB' || e.key === 'b') {
        e.preventDefault();
        onClose();
        return;
      }

      // Quick buy shortcuts
      const matched = CS_BUY_ITEMS.find(item => item.shortcut === e.key);
      if (matched) {
        e.preventDefault();
        if (money >= matched.price && inBuyZone) {
          onBuyItem(matched.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, money, inBuyZone, onBuyItem, onClose]);

  if (!isOpen) return null;

  const filteredItems = selectedCategory === 'all'
    ? CS_BUY_ITEMS
    : CS_BUY_ITEMS.filter(item => item.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md select-none pointer-events-auto">
      <div className="relative w-full max-w-4xl bg-neutral-950/95 border-2 border-amber-500/80 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900/90 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/40 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-amber-400 tracking-wider uppercase font-mono">
                  CỬA HÀNG VŨ KHÍ CHIẾN THUẬT
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded border border-neutral-700">
                  CS BUY MENU
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Nhấn phím số [1-9] để mua nhanh • Nhấn [B] hoặc [ESC] để quay lại trận đấu
              </p>
            </div>
          </div>

          {/* Player Money & Close */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-emerald-500/40 px-4 py-2 rounded-xl shadow-inner">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                ${money.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg border border-neutral-700 transition-colors"
              title="Đóng cửa hàng (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-neutral-900/50 border-b border-neutral-800/80 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất Cả Vũ Khí' },
            { id: 'rifles', label: 'Súng Trường (Rifles)' },
            { id: 'smgs', label: 'Tiểu Liên & Shotgun' },
            { id: 'pistols', label: 'Súng Lục (Pistols)' },
            { id: 'gear', label: 'Trang Bị & Giáp' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider font-mono cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {filteredItems.map(item => {
            const canAfford = money >= item.price;
            const wData = item.weaponType ? WEAPONS[item.weaponType] : null;
            const isEquipped = item.weaponType === currentWeapon;
            const isAlreadyMaxGear = (item.id === 'helmet' && hasHelmet && armor >= 100) ||
                                     (item.id === 'kevlar' && armor >= 100 && !hasHelmet);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (canAfford && inBuyZone) {
                    onBuyItem(item.id);
                  }
                }}
                className={`relative group flex flex-col justify-between p-4 rounded-xl border transition-all duration-150 ${
                  isEquipped
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-inner'
                    : canAfford
                    ? 'bg-neutral-900/80 hover:bg-neutral-800/90 border-neutral-700/80 hover:border-amber-500/60 cursor-pointer shadow-md hover:scale-[1.01]'
                    : 'bg-neutral-900/40 border-neutral-800 opacity-55 cursor-not-allowed'
                }`}
              >
                {/* Top Info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded bg-neutral-800 text-amber-400 font-mono font-bold text-xs border border-neutral-700">
                      {item.shortcut}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                          {item.name}
                        </h3>
                        {isEquipped && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                            <Check className="w-3 h-3" /> ĐANG DÙNG
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <span
                    className={`font-mono font-black text-base px-2.5 py-1 rounded-lg ${
                      canAfford
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-950/40 text-red-400 border border-red-500/30'
                    }`}
                  >
                    ${item.price.toLocaleString()}
                  </span>
                </div>

                {/* Weapon Stats Bar (if firearm) */}
                {wData && (
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-neutral-800 text-[11px] font-mono">
                    <div className="flex flex-col">
                      <span className="text-neutral-500">SÁT THƯƠNG</span>
                      <span className="font-bold text-neutral-300">{wData.damage} {wData.headshotMultiplier >= 3.0 ? '⚡1-Tap' : ''}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-neutral-500">BĂNG ĐẠN</span>
                      <span className="font-bold text-neutral-300">{wData.magSize}/{wData.maxReserveAmmo}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-neutral-500">TỐC ĐỘ</span>
                      <span className="font-bold text-neutral-300">{Math.round(60000 / wData.fireRate)} RPM</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-neutral-500">ĐỘ GIẬT</span>
                      <span className="font-bold text-neutral-300">{Math.round(wData.recoilKick * 1000)} CS</span>
                    </div>
                  </div>
                )}

                {/* Purchase Button */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {canAfford ? 'Nhấp chuột hoặc nhấn phím để mua' : 'Không đủ tiền'}
                  </span>
                  <button
                    disabled={!canAfford}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all font-mono ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {isEquipped ? 'Mua Lại' : 'Trang Bị'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-neutral-900 border-t border-neutral-800 text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" /> VÙNG MUA: {inBuyZone ? 'KÍCH HOẠT (Trong Spawn/Đầu Hiệp)' : 'HẾT GIỜ MUA'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Thời gian còn lại trong hiệp: <strong className="text-white">{timeLeft}s</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
