import React from 'react';
import { Team } from '../types/game';
import { Trophy, Skull, Shield, Bot, User, RotateCcw, Users, Home, Crown, CheckCircle2 } from 'lucide-react';

export interface PlayerRow {
  id: string;
  name: string;
  team: Team;
  kills: number;
  deaths: number;
  health: number;
  isBot?: boolean;
  isLocal?: boolean;
}

export interface ScoreboardProps {
  isOpen: boolean;
  isMatchOver?: boolean;
  winner?: Team | 'draw' | null;
  matchEndMessage?: string;
  isOnline?: boolean;
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
  onPlayAgain?: () => void;
  onReturnToWaitingRoom?: () => void;
  onReturnToMenu?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  isOpen,
  isMatchOver = false,
  winner = null,
  matchEndMessage = '',
  isOnline = false,
  redScore,
  blueScore,
  currentRound,
  localPlayer,
  otherPlayers,
  onPlayAgain,
  onReturnToWaitingRoom,
  onReturnToMenu
}) => {
  // Show scoreboard if user is pressing Tab OR if the match is officially over
  const shouldRender = isOpen || isMatchOver;
  if (!shouldRender) return null;

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

  const isLocalWinner = isMatchOver && winner === localPlayer.team;
  const isOpponentWinner = isMatchOver && winner && winner !== 'draw' && winner !== localPlayer.team;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 font-mono select-none ${
        isMatchOver
          ? 'bg-black/85 backdrop-blur-md pointer-events-auto'
          : 'bg-black/75 backdrop-blur-sm pointer-events-none'
      }`}
    >
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0f1218] border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden text-neutral-200">
        {/* Top Header */}
        {isMatchOver ? (
          <div className="shrink-0 bg-neutral-950 px-5 py-4 border-b border-neutral-800 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Trophy
                className={`w-6 h-6 ${
                  isLocalWinner ? 'text-amber-400 animate-bounce' : 'text-neutral-400'
                }`}
              />
              <h2
                className={`text-lg sm:text-2xl font-black uppercase tracking-wider ${
                  isLocalWinner
                    ? 'text-amber-400'
                    : isOpponentWinner
                    ? 'text-red-400'
                    : 'text-neutral-300'
                }`}
              >
                {isLocalWinner
                  ? 'CHIẾN THẮNG CHUNG CUỘC!'
                  : isOpponentWinner
                  ? 'THẤT BẠI CHUNG CUỘC'
                  : 'TRẬN ĐẤU KẾT THÚC HÒA'}
              </h2>
            </div>
            <p className="text-xs text-neutral-400">
              {matchEndMessage ||
                (isLocalWinner
                  ? 'Đội của bạn đã chạm 7 hiệp thắng trước và đoạt cúp vô địch!'
                  : 'Đội đối phương đã chạm 7 hiệp thắng trước.')}
            </p>
          </div>
        ) : (
          <div className="shrink-0 bg-neutral-950 px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-black text-sm sm:text-base text-amber-400 tracking-wider uppercase">
                BẢNG ĐIỂM TRẬN ĐẤU — HIỆP {currentRound}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-bold">
              {isOnline ? 'CHẾ ĐỘ ONLINE' : 'CHẾ ĐỘ BOT AI'}
            </span>
          </div>
        )}

        {/* Team Scores Summary Bar */}
        <div className="shrink-0 grid grid-cols-2 border-b border-neutral-800">
          <div
            className={`p-3 sm:p-4 flex items-center justify-between border-r border-neutral-800 ${
              winner === 'red' && isMatchOver ? 'bg-red-950/60 ring-1 ring-inset ring-red-500/50' : 'bg-red-950/20'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-400 font-black text-xs sm:text-sm">
                  TERRORIST (PHE ĐỎ)
                </span>
                {winner === 'red' && isMatchOver && (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <span className="text-[10px] text-neutral-400">Phe Tấn Công</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-red-500 font-mono">
              {redScore}
            </span>
          </div>

          <div
            className={`p-3 sm:p-4 flex items-center justify-between ${
              winner === 'blue' && isMatchOver ? 'bg-blue-950/60 ring-1 ring-inset ring-blue-500/50' : 'bg-blue-950/20'
            }`}
          >
            <span className="text-2xl sm:text-3xl font-black text-blue-500 font-mono">
              {blueScore}
            </span>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                {winner === 'blue' && isMatchOver && (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-blue-400 font-black text-xs sm:text-sm">
                  COUNTER-TERRORIST (PHE XANH)
                </span>
              </div>
              <span className="text-[10px] text-neutral-400">Phe Phòng Thủ</span>
            </div>
          </div>
        </div>

        {/* Players Roster Table */}
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto flex-1 min-h-0">
          {/* Red Team List */}
          <div>
            <div className="text-xs font-bold text-red-400 uppercase mb-2 flex justify-between px-2">
              <span>Phe Đỏ ({redTeam.length})</span>
              <span>HP / KDA (K/D)</span>
            </div>
            <div className="space-y-1.5">
              {redTeam.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                    p.isLocal
                      ? 'bg-red-950/50 border-red-500/70 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.isBot ? (
                      <Bot className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span className="truncate">{p.name}</span>
                    {p.isLocal && (
                      <span className="text-[10px] text-amber-400 font-bold">(Bạn)</span>
                    )}
                    {p.health <= 0 && !isMatchOver && (
                      <Skull className="w-3 h-3 text-neutral-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs ${
                        p.health > 0 ? 'text-red-400 font-bold' : 'text-neutral-500'
                      }`}
                    >
                      {p.health > 0 ? `${p.health} HP` : 'HẠ GỤC'}
                    </span>
                    <span className="text-amber-400 font-bold font-mono min-w-[40px] text-right">
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
              <span>Phe Xanh ({blueTeam.length})</span>
              <span>HP / KDA (K/D)</span>
            </div>
            <div className="space-y-1.5">
              {blueTeam.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                    p.isLocal
                      ? 'bg-blue-950/50 border-blue-500/70 text-white font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {p.isBot ? (
                      <Bot className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                    <span className="truncate">{p.name}</span>
                    {p.isLocal && (
                      <span className="text-[10px] text-amber-400 font-bold">(Bạn)</span>
                    )}
                    {p.health <= 0 && !isMatchOver && (
                      <Skull className="w-3 h-3 text-neutral-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs ${
                        p.health > 0 ? 'text-blue-400 font-bold' : 'text-neutral-500'
                      }`}
                    >
                      {p.health > 0 ? `${p.health} HP` : 'HẠ GỤC'}
                    </span>
                    <span className="text-amber-400 font-bold font-mono min-w-[40px] text-right">
                      {p.kills} / {p.deaths}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer / Actions Bar */}
        {isMatchOver ? (
          <div className="shrink-0 bg-neutral-950 p-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            {isOnline ? (
              <>
                <button
                  type="button"
                  onClick={onReturnToWaitingRoom}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs sm:text-sm rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 stroke-[2.5]" />
                  <span>QUAY LẠI PHÒNG ĐỢI</span>
                </button>

                <button
                  type="button"
                  onClick={onReturnToMenu}
                  className="w-full sm:w-auto px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>QUAY LẠI MENU CHÍNH</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onPlayAgain}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs sm:text-sm rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  <span>CHƠI LẠI TRẬN MỚI</span>
                </button>

                <button
                  type="button"
                  onClick={onReturnToWaitingRoom}
                  className="w-full sm:w-auto px-4 py-2.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>SẢNH CHỜ BOT</span>
                </button>

                <button
                  type="button"
                  onClick={onReturnToMenu}
                  className="w-full sm:w-auto px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>MENU CHÍNH</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="shrink-0 bg-neutral-950 px-5 py-2 text-center text-xs text-neutral-500 border-t border-neutral-800 flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Thả phím TAB để đóng bảng điểm</span>
          </div>
        )}
      </div>
    </div>
  );
};
