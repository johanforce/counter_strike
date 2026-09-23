import React from 'react';
import { Team } from '../types/game';

interface ScoreboardProps {
  isOpen: boolean;
  redScore: number;
  blueScore: number;
  currentRound: number;
  localPlayer: {
    name: string;
    team: Team;
    kills: number;
    deaths: number;
    health: number;
  };
  otherPlayers: {
    id: string;
    name: string;
    team: Team;
    kills: number;
    deaths: number;
    health: number;
    isBot: boolean;
  }[];
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  isOpen,
  redScore,
  blueScore,
  currentRound,
  localPlayer,
  otherPlayers
}) => {
  if (!isOpen) return null;

  const allPlayers = [
    { ...localPlayer, id: 'local', isBot: false },
    ...otherPlayers
  ];

  const redPlayers = allPlayers.filter(p => p.team === 'red');
  const bluePlayers = allPlayers.filter(p => p.team === 'blue');

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center pointer-events-none z-50 font-mono select-none">
      <div className="w-full max-w-3xl bg-neutral-900/95 border-2 border-neutral-700 rounded-xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-700 pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-amber-400 tracking-wider">BẢNG ĐIỂM CHIẾN TRƯỜNG</h2>
            <span className="text-xs text-neutral-400">Bản đồ: de_dust_classic • Hiệp đấu: {currentRound}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs text-red-400 font-bold block">ĐỘI ĐỎ</span>
              <span className="text-3xl font-black text-red-500">{redScore}</span>
            </div>
            <span className="text-2xl text-neutral-600 font-bold">:</span>
            <div>
              <span className="text-xs text-blue-400 font-bold block">ĐỘI XANH</span>
              <span className="text-3xl font-black text-blue-500">{blueScore}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Team Red Phoenix */}
          <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3">
            <div className="flex items-center justify-between border-b border-red-900/40 pb-2 mb-2 text-xs font-bold text-red-400 uppercase">
              <span>Đội Đỏ (Tấn Công)</span>
              <div className="flex gap-6">
                <span>HP</span>
                <span>K</span>
                <span>D</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {redPlayers.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs ${
                    p.id === 'local' ? 'bg-red-600/30 font-bold text-white ring-1 ring-red-400' : 'bg-neutral-800/40 text-neutral-300'
                  }`}
                >
                  <span className="truncate max-w-[140px]">
                    {p.name} {p.id === 'local' && '(Bạn)'}
                  </span>
                  <div className="flex gap-6 text-neutral-400">
                    <span className={p.health > 0 ? 'text-emerald-400 font-semibold' : 'text-red-500'}>
                      {p.health > 0 ? p.health : 'TỬ'}
                    </span>
                    <span className="text-white">{p.kills}</span>
                    <span>{p.deaths}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Blue CT */}
          <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-3">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-2 mb-2 text-xs font-bold text-blue-400 uppercase">
              <span>Đội Xanh (Phòng Thủ)</span>
              <div className="flex gap-6">
                <span>HP</span>
                <span>K</span>
                <span>D</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {bluePlayers.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs ${
                    p.id === 'local' ? 'bg-blue-600/30 font-bold text-white ring-1 ring-blue-400' : 'bg-neutral-800/40 text-neutral-300'
                  }`}
                >
                  <span className="truncate max-w-[140px]">
                    {p.name} {p.id === 'local' && '(Bạn)'}
                  </span>
                  <div className="flex gap-6 text-neutral-400">
                    <span className={p.health > 0 ? 'text-emerald-400 font-semibold' : 'text-red-500'}>
                      {p.health > 0 ? p.health : 'TỬ'}
                    </span>
                    <span className="text-white">{p.kills}</span>
                    <span>{p.deaths}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-neutral-500 text-xs">
          Giữ phím <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">Tab</kbd> để hiển thị bảng điểm
        </div>
      </div>
    </div>
  );
};
