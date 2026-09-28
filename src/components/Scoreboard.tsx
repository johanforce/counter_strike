import React from 'react';
import { Team } from '../types/game';
import { Trophy, Skull, Shield, Bot, User } from 'lucide-react';

interface PlayerRow {
  id: string;
  name: string;
  team: Team;
  kills: number;
  deaths: number;
  health: number;
  isBot?: boolean;
  isLocal?: boolean;
}

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
  otherPlayers: PlayerRow[];
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

  const allPlayers: PlayerRow[] = [
    {
      id: 'local',
      name: localPlayer.name,
      team: localPlayer.team,
      kills: localPlayer.kills,
      deaths: localPlayer.deaths,
      health: localPlayer.health,
      isLocal: true
    },
    ...otherPlayers
  ];

  const redTeam = allPlayers.filter((p) => p.team === 'red');
  const blueTeam = allPlayers.filter((p) => p.team === 'blue');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 font-mono select-none pointer-events-none">
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-neutral-900/95 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Top Banner */}
        <div className="shrink-0 bg-neutral-950 px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-black text-sm sm:text-base text-amber-400 tracking-wider">
              BẢNG ĐIỂM CHIẾN TRƯỜNG — HIỆP {currentRound}
            </span>
          </div>
          <span className="text-[11px] text-neutral-500">Bản đồ: de_dust_classic</span>
        </div>

        {/* Team Scores Summary */}
        <div className="shrink-0 grid grid-cols-2 border-b border-neutral-800">
          <div className="bg-red-950/30 p-3 flex items-center justify-between border-r border-neutral-800">
            <div>
              <span className="text-red-400 font-black text-sm block">ĐỘI ĐỎ (TERRORIST)</span>
              <span className="text-[10px] text-neutral-400">Phe Tấn Công</span>
            </div>
            <span className="text-3xl font-black text-red-500">{redScore}</span>
          </div>

          <div className="bg-blue-950/30 p-3 flex items-center justify-between">
            <span className="text-3xl font-black text-blue-500">{blueScore}</span>
            <div className="text-right">
              <span className="text-blue-400 font-black text-sm block">ĐỘI XANH (COUNTER-TERRORIST)</span>
              <span className="text-[10px] text-neutral-400">Phe Phòng Thủ</span>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1">
          {/* Red Team List */}
          <div>
            <div className="text-xs font-bold text-red-400 uppercase mb-2 flex justify-between px-2">
              <span>Thành viên Đội Đỏ ({redTeam.length})</span>
              <span>HP / K / D</span>
            </div>
            <div className="space-y-1.5">
              {redTeam.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
                    p.isLocal
                      ? 'bg-red-900/30 border-red-500/60 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.isBot ? <Bot className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> : <User className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    <span className="truncate">{p.name}</span>
                    {p.health <= 0 && <Skull className="w-3.5 h-3.5 text-neutral-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={p.health > 0 ? 'text-red-400 font-bold font-mono' : 'text-neutral-500 line-through'}>
                        {p.health > 0 ? `${p.health} HP` : 'HẠ GỤC'}
                      </span>
                      {p.health > 0 && (
                        <div className="w-14 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-red-900/50">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-200"
                            style={{ width: `${Math.max(0, Math.min(100, p.health))}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-amber-400 font-bold font-mono min-w-[36px] text-right">
                      {p.kills} / {p.deaths}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blue Team List */}
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase mb-2 flex justify-between px-2">
              <span>Thành viên Đội Xanh ({blueTeam.length})</span>
              <span>HP / K / D</span>
            </div>
            <div className="space-y-1.5">
              {blueTeam.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
                    p.isLocal
                      ? 'bg-blue-900/30 border-blue-500/60 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.isBot ? <Bot className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> : <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    <span className="truncate">{p.name}</span>
                    {p.health <= 0 && <Skull className="w-3.5 h-3.5 text-neutral-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={p.health > 0 ? 'text-blue-400 font-bold font-mono' : 'text-neutral-500 line-through'}>
                        {p.health > 0 ? `${p.health} HP` : 'HẠ GỤC'}
                      </span>
                      {p.health > 0 && (
                        <div className="w-14 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-blue-900/50">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-200"
                            style={{ width: `${Math.max(0, Math.min(100, p.health))}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-amber-400 font-bold font-mono min-w-[36px] text-right">
                      {p.kills} / {p.deaths}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 bg-neutral-950 px-5 py-2 text-center text-[11px] text-neutral-500 border-t border-neutral-800 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Thả phím TAB để đóng bảng điểm • Tiêu diệt toàn bộ phe địch (người + Bot) để thắng hiệp</span>
        </div>
      </div>
    </div>
  );
};
