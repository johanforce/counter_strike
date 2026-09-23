import React from 'react';
import { GameSettings } from '../types/game';
import { sounds } from '../game/audio';
import { Settings, Volume2, VolumeX, Sliders, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  volume: number;
  isMuted: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onUpdateVolume: (volume: number) => void;
  onToggleMute: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  volume,
  isMuted,
  onClose,
  onUpdateSettings,
  onUpdateVolume,
  onToggleMute
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-neutral-900 border-2 border-neutral-700 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-400 font-black text-xl mb-6">
          <Settings className="w-6 h-6" />
          <span>CÀI ĐẶT TRÒ CHƠI</span>
        </div>

        <div className="space-y-5">
          {/* Mouse Sensitivity */}
          <div>
            <div className="flex justify-between text-xs text-neutral-300 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Độ nhạy chuột
              </span>
              <span className="text-amber-400 font-bold">{settings.mouseSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={settings.mouseSensitivity}
              onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer h-2"
            />
          </div>

          {/* Volume */}
          <div>
            <div className="flex justify-between text-xs text-neutral-300 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                Âm lượng hiệu ứng súng & bước chân
              </span>
              <span className="text-amber-400 font-bold">{isMuted ? 'Tắt' : `${Math.round(volume * 100)}%`}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                disabled={isMuted}
                value={volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateVolume(val);
                  sounds.setVolume(val);
                }}
                className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer h-2 disabled:opacity-50"
              />
              <button
                onClick={() => {
                  onToggleMute();
                  sounds.setMuted(!isMuted);
                }}
                className={`p-2 rounded border text-xs font-bold ${
                  isMuted
                    ? 'bg-red-950 border-red-600 text-red-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                }`}
              >
                {isMuted ? 'BẬT' : 'TẮT'}
              </button>
            </div>
          </div>

          {/* Field of view (FOV) */}
          <div>
            <div className="flex justify-between text-xs text-neutral-300 mb-2">
              <span className="font-bold">Góc nhìn FOV</span>
              <span className="text-amber-400 font-bold">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min="60"
              max="95"
              step="1"
              value={settings.fov}
              onChange={(e) => onUpdateSettings({ fov: parseInt(e.target.value) })}
              className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer h-2"
            />
          </div>

          {/* Invert Y */}
          <div className="flex items-center justify-between p-3 bg-neutral-800/60 rounded-lg border border-neutral-700/60">
            <span className="text-xs text-neutral-300 font-bold">Đảo trục Y (Invert Mouse Y)</span>
            <input
              type="checkbox"
              checked={settings.invertY}
              onChange={(e) => onUpdateSettings({ invertY: e.target.checked })}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-amber-600 hover:bg-amber-500 text-black font-black py-2.5 rounded-lg transition-colors text-sm uppercase tracking-wider"
        >
          ÁP DỤNG & ĐÓNG
        </button>
      </div>
    </div>
  );
};
