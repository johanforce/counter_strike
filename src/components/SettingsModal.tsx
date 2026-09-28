import React from 'react';
import { GameSettings } from '../types/game';
import { sounds } from '../game/audio';
import { X, Volume2, VolumeX, Sliders, Crosshair, LogOut } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  volume: number;
  isMuted: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onUpdateVolume: (vol: number) => void;
  onToggleMute: () => void;
  onQuitMatch?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  volume,
  isMuted,
  onClose,
  onUpdateSettings,
  onUpdateVolume,
  onToggleMute,
  onQuitMatch
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 font-mono select-none overflow-hidden">
      <div className="w-full max-w-md max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-neutral-950 px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Cài Đặt Trò Chơi</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Audio Volume */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
              <span>ÂM LƯỢNG HIỆU ỨNG</span>
              <span className="text-amber-400">{isMuted ? 'TẮT TIẾNG' : `${Math.round(volume * 100)}%`}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onToggleMute();
                  sounds.setMuted(!isMuted);
                }}
                className={`p-2 rounded border transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-red-950/50 border-red-800 text-red-400'
                    : 'bg-neutral-800 border-neutral-700 text-emerald-400'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateVolume(val);
                  sounds.setVolume(val);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Mouse Sensitivity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
              <span>ĐỘ NHẠY CHUỘT (SENSITIVITY)</span>
              <span className="text-amber-400">{settings.mouseSensitivity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.05"
              value={settings.mouseSensitivity}
              onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Invert Y Axis */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300">ĐẢO NGƯỢC TRỤC DỌC (INVERT Y)</span>
            <button
              onClick={() => onUpdateSettings({ invertY: !settings.invertY })}
              className={`px-3 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                settings.invertY
                  ? 'bg-amber-500 text-black border-amber-400'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              {settings.invertY ? 'BẬT' : 'TẮT'}
            </button>
          </div>

          <div className="h-px bg-neutral-800" />

          {/* Field of View */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
              <span>GÓC NHÌN CAMERA (FOV)</span>
              <span className="text-amber-400">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min="60"
              max="100"
              step="1"
              value={settings.fov}
              onChange={(e) => onUpdateSettings({ fov: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Controls Summary */}
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Crosshair className="w-3.5 h-3.5" />
              <span>PHÍM TẮT TRONG TRẬN</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-neutral-400">
              <div><strong className="text-white">W, A, S, D:</strong> Di chuyển</div>
              <div><strong className="text-white">Phím B:</strong> Chợ mua súng CS:GO</div>
              <div><strong className="text-white">Chuột Trái:</strong> Bắn / Chém</div>
              <div><strong className="text-white">Chuột Phải:</strong> Ngắm Scope / Đâm</div>
              <div><strong className="text-white">1 / 2 / 3:</strong> Đổi Súng / Dao</div>
              <div><strong className="text-white">Phím R:</strong> Nạp đạn</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-neutral-950 px-5 py-3 border-t border-neutral-800 flex items-center justify-between gap-2">
          {onQuitMatch ? (
            <button
              onClick={onQuitMatch}
              className="bg-red-900/90 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-lg border border-red-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>RỜI TRẬN ĐẤU</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
          >
            LƯU & ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};
