import React, { useState } from 'react';
import { RoomState, Team, GameMode } from '../types/game';
import {
  Users,
  Copy,
  Check,
  Play,
  ArrowLeft,
  Shield,
  Crown,
  UserCheck,
  Loader2,
  Bot,
  Plus,
  Share2,
  Link as LinkIcon,
  AlertTriangle
} from 'lucide-react';

interface WaitingRoomProps {
  roomState: RoomState | null;
  localPlayerId: string | null;
  playerName: string;
  roomCode: string;
  mode: GameMode;
  isConnecting: boolean;
  errorMsg?: string | null;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSwitchTeam: (team: Team) => void;
  onAddBot: (team: Team) => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomState,
  localPlayerId,
  roomCode,
  mode,
  isConnecting,
  errorMsg,
  onStartGame,
  onLeaveRoom,
  onSwitchTeam,
  onAddBot
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const activeMode = roomState?.mode || mode;
  const maxPerTeam = activeMode === '1v1' ? 1 : 2;
  const maxPlayers = maxPerTeam * 2;

  const players = roomState?.players || [];
  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');

  const isHost = roomState ? roomState.hostId === localPlayerId : false;
  const localPlayer = players.find((p) => p.id === localPlayerId);

  const canStart = isHost && redPlayers.length >= 1 && bluePlayers.length >= 1;

  return (
    <div className="relative h-screen max-h-screen w-screen bg-[#0d0e11] text-white font-mono flex flex-col items-center justify-between px-3 py-2.5 sm:px-6 sm:py-4 select-none overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#d49938_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-5xl shrink-0 flex items-center justify-between border-b border-neutral-800 pb-2.5">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-700 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RỜI PHÒNG</span>
        </button>

        <div className="text-center">
          <h1 className="text-base sm:text-xl font-black tracking-wider text-amber-400 uppercase">
            SẢNH CHỜ CHIẾN THUẬT ({activeMode.toUpperCase()})
          </h1>
          <p className="text-[10px] sm:text-xs text-neutral-400">
            Đấu {activeMode === '1v1' ? '1vs1 Đơn Đấu' : '2vs2 Đồng Đội'} • {players.length}/{maxPlayers} Vị trí sẵn sàng
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">ONLINE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-5xl flex-1 min-h-0 flex flex-col justify-between gap-3 my-2 overflow-hidden">
        {/* Room Code Banner */}
        <div className="shrink-0 bg-gradient-to-r from-neutral-900 via-neutral-900/95 to-neutral-900 border border-amber-500/50 rounded-xl p-3 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="space-y-0.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <Share2 className="w-3.5 h-3.5" />
              <span>Mời bạn bè vào phòng ({activeMode.toUpperCase()})</span>
            </div>
            <p className="text-[11px] text-neutral-300">
              Gửi <strong className="text-amber-300">Mã Phòng</strong> hoặc thêm <strong className="text-cyan-300">Bot AI</strong> vào đội còn thiếu. Đội thắng khi tiêu diệt hết phe địch (người + Bot)!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
            <div className="flex items-center bg-black border border-amber-500 rounded-lg px-3 py-1.5 gap-2">
              <div>
                <span className="text-[9px] text-neutral-500 block uppercase leading-none">MÃ PHÒNG</span>
                <span className="text-lg sm:text-xl font-black tracking-widest text-amber-400 font-mono leading-tight">
                  {roomCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Chép mã</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleCopyInviteLink}
              className="px-3 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Đã chép Link!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Chép Link mời</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Banner if room join failed */}
        {errorMsg && (
          <div className="shrink-0 bg-red-950/80 border border-red-500 text-red-200 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-bold">{errorMsg}</span>
            </div>
            <button
              onClick={onLeaveRoom}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded cursor-pointer shrink-0"
            >
              Quay lại
            </button>
          </div>
        )}

        {/* Loading state or Teams Grid */}
        {isConnecting || !roomState ? (
          <div className="flex-1 bg-neutral-900/80 border border-neutral-800 rounded-xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-neutral-300">Đang đồng bộ phòng đấu với máy chủ...</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-hidden">
            {/* RED TEAM COLUMN */}
            <div className="bg-red-950/15 border border-red-900/50 rounded-xl p-3.5 flex flex-col justify-between min-h-0">
              <div className="flex flex-col min-h-0 flex-1">
                <div className="flex items-center justify-between border-b border-red-900/40 pb-2 mb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    <div>
                      <h2 className="font-black text-sm sm:text-base text-red-400 tracking-wide">
                        ĐỘI ĐỎ (TERRORIST)
                      </h2>
                      <span className="text-[10px] text-neutral-400">Phe Tấn Công</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/50">
                    {redPlayers.length} / {maxPerTeam}
                  </span>
                </div>

                {/* Slots */}
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {Array.from({ length: maxPerTeam }).map((_, idx) => {
                    const p = redPlayers[idx];
                    const isMe = p?.id === localPlayerId;
                    const isRoomHost = p?.id === roomState.hostId;

                    return p ? (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                          isMe
                            ? 'bg-red-900/40 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                            : 'bg-neutral-900/90 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black text-sm shrink-0">
                            {p.isBot ? <Bot className="w-4 h-4" /> : p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs sm:text-sm truncate">{p.name}</span>
                              {isMe && (
                                <span className="text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded">
                                  BẠN
                                </span>
                              )}
                              {isRoomHost && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> HOST
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-3 h-3" /> Sẵn sàng tham chiến
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={`red-empty-${idx}`}
                        className="p-2.5 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 flex items-center justify-between text-neutral-600"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg border border-dashed border-neutral-800 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs italic">Đang chờ người chơi hoặc Bot...</span>
                        </div>
                        {isHost && (
                          <button
                            onClick={() => onAddBot('red')}
                            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-[10px] font-bold rounded border border-neutral-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Thêm Bot AI
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {localPlayer?.team !== 'red' && redPlayers.length < maxPerTeam && (
                <button
                  onClick={() => onSwitchTeam('red')}
                  className="mt-2.5 w-full py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  CHUYỂN SANG ĐỘI ĐỎ
                </button>
              )}
            </div>

            {/* BLUE TEAM COLUMN */}
            <div className="bg-blue-950/15 border border-blue-900/50 rounded-xl p-3.5 flex flex-col justify-between min-h-0">
              <div className="flex flex-col min-h-0 flex-1">
                <div className="flex items-center justify-between border-b border-blue-900/40 pb-2 mb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                    <div>
                      <h2 className="font-black text-sm sm:text-base text-blue-400 tracking-wide">
                        ĐỘI XANH (COUNTER-TERRORIST)
                      </h2>
                      <span className="text-[10px] text-neutral-400">Phe Phòng Thủ</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50">
                    {bluePlayers.length} / {maxPerTeam}
                  </span>
                </div>

                {/* Slots */}
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {Array.from({ length: maxPerTeam }).map((_, idx) => {
                    const p = bluePlayers[idx];
                    const isMe = p?.id === localPlayerId;
                    const isRoomHost = p?.id === roomState.hostId;

                    return p ? (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                          isMe
                            ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                            : 'bg-neutral-900/90 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-sm shrink-0">
                            {p.isBot ? <Bot className="w-4 h-4" /> : p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs sm:text-sm truncate">{p.name}</span>
                              {isMe && (
                                <span className="text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded">
                                  BẠN
                                </span>
                              )}
                              {isRoomHost && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> HOST
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-3 h-3" /> Sẵn sàng tham chiến
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={`blue-empty-${idx}`}
                        className="p-2.5 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 flex items-center justify-between text-neutral-600"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg border border-dashed border-neutral-800 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs italic">Đang chờ người chơi hoặc Bot...</span>
                        </div>
                        {isHost && (
                          <button
                            onClick={() => onAddBot('blue')}
                            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-[10px] font-bold rounded border border-neutral-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Thêm Bot AI
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {localPlayer?.team !== 'blue' && bluePlayers.length < maxPerTeam && (
                <button
                  onClick={() => onSwitchTeam('blue')}
                  className="mt-2.5 w-full py-2 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/50 text-blue-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  CHUYỂN SANG ĐỘI XANH
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="shrink-0 bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-neutral-300">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            {isHost ? (
              <span>
                Bạn là <strong>Chủ phòng (Host)</strong>. Hãy thêm <strong>Bot AI</strong> hoặc đợi bạn bè vào đủ 2 phe rồi bấm <strong>Bắt đầu trận đấu</strong>!
              </span>
            ) : (
              <span>
                Đang chờ Chủ phòng bấm <strong>Bắt đầu trận đấu</strong>...
              </span>
            )}
          </div>

          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 ${
                canStart
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{canStart ? 'BẮT ĐẦU TRẬN ĐẤU' : 'CẦN ÍT NHẤT 1 NGƯỜI MỖI ĐỘI'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-400 text-xs font-bold shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>ĐANG CHỜ CHỦ PHÒNG...</span>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 text-[10px] text-neutral-500 shrink-0">
        Bản đồ: de_dust_classic • Chế độ {activeMode.toUpperCase()} • Tiêu diệt toàn bộ đối phương (Người + Bot) để thắng hiệp
      </footer>
    </div>
  );
};
