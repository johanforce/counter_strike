import React, { useState } from 'react';
import { RoomState, Team, GameMode } from '../types/game';
import { Copy, Check, Users, Shield, Flame, Play, LogOut, Loader2, Sparkles, Crosshair, Share2, AlertTriangle, ArrowLeft } from 'lucide-react';

interface WaitingRoomProps {
  roomState: RoomState | null;
  localPlayerId: string;
  playerName: string;
  roomCode: string;
  mode: GameMode;
  isConnecting: boolean;
  errorMsg: string | null;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSwitchTeam: (team: Team) => void;
  onAddBot?: (team: Team) => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomState,
  localPlayerId,
  playerName,
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

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(roomCode)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isHost = roomState?.hostId === localPlayerId;
  const players = roomState?.players || [];
  const maxPerTeam = mode === '1v1' ? 1 : 2;

  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');

  const localPlayer = players.find((p) => p.id === localPlayerId);
  const currentTeam = localPlayer?.team || 'red';

  return (
    <div className="fixed inset-0 bg-neutral-950/95 flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Subtle Dust-themed background grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-4xl bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col gap-6 my-auto">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Crosshair className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-wider text-white uppercase">
                  PHÒNG CHỜ TRỰC TUYẾN
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {mode === '1v1' ? '1 VS 1' : '2 VS 2'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Bản đồ: <span className="text-neutral-200 font-semibold">de_dust_classic</span> • Mục tiêu: 10 Hiệp
              </p>
            </div>
          </div>

          {/* Room Code & Copy & Link */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 flex items-center gap-3">
              <div>
                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Mã Phòng</div>
                <div className="text-lg font-mono font-black text-amber-400 tracking-widest leading-none">
                  {roomCode}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
                  title="Sao chép mã phòng"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline text-[11px]">{copiedCode ? 'Đã chép' : 'Mã'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-200 border border-cyan-800/40 transition-colors flex items-center gap-1 text-xs"
                  title="Sao chép link mời bạn bè"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  <span className="hidden sm:inline text-[11px]">{copiedLink ? 'Đã chép link' : 'Link mời'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onLeaveRoom}
              className="px-3.5 py-2.5 rounded-xl border border-red-900/50 bg-red-950/30 hover:bg-red-950/60 text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Rời Phòng</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-red-950/80 border border-red-700 rounded-xl text-red-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <strong className="block text-red-300 font-bold">Không thể tham gia phòng</strong>
                <span className="text-xs text-red-200/90">{errorMsg}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onLeaveRoom}
              className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại sảnh để nhập mã khác</span>
            </button>
          </div>
        )}

        {/* Connecting Banner */}
        {isConnecting && (
          <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl text-amber-300 text-sm flex items-center justify-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang đồng bộ dữ liệu phòng với máy chủ...</span>
          </div>
        )}

        {/* Teams Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team Red */}
          <div className="bg-neutral-950/60 border border-red-900/40 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-red-950">
              <div className="flex items-center gap-2 text-red-400 font-black tracking-wider text-sm">
                <Flame className="w-4 h-4" />
                <span>ĐỘI ĐỎ (PHOENIX)</span>
              </div>
              <div className="flex items-center gap-2">
                {isHost && redPlayers.length < maxPerTeam && onAddBot && (
                  <button
                    type="button"
                    onClick={() => onAddBot('red')}
                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/60 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    + Thêm BOT
                  </button>
                )}
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/40">
                  {redPlayers.length}/{maxPerTeam} Người
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-h-[110px]">
              {Array.from({ length: maxPerTeam }).map((_, idx) => {
                const player = redPlayers[idx];
                if (player) {
                  const isPlayerHost = roomState?.hostId === player.id;
                  const isMe = player.id === localPlayerId;
                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                        isMe
                          ? 'bg-red-950/50 border-red-600/70 text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                          : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-xs font-black text-red-400">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold flex items-center gap-2">
                            <span>{player.name}</span>
                            {isMe && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-500 text-white">
                                BẠN
                              </span>
                            )}
                            {player.isBot && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                                BOT MÁY
                              </span>
                            )}
                            {isPlayerHost && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> CHỦ PHÒNG
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500">Khăn đỏ • Phe Tấn công</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                        {player.isBot ? '0ms' : `${player.ping}ms`}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={`red_empty_${idx}`}
                    className="p-3 rounded-lg border border-dashed border-neutral-800/80 bg-neutral-950/30 flex items-center justify-between text-neutral-400"
                  >
                    <span className="text-xs">Trống (BOT tự động tham gia nếu thiếu)</span>
                    {currentTeam !== 'red' && (
                      <button
                        type="button"
                        onClick={() => onSwitchTeam('red')}
                        className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 border border-red-800/40 px-3 py-1 rounded transition-colors"
                      >
                        Đổi sang Đội Đỏ
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Blue */}
          <div className="bg-neutral-950/60 border border-blue-900/40 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-950">
              <div className="flex items-center gap-2 text-blue-400 font-black tracking-wider text-sm">
                <Shield className="w-4 h-4" />
                <span>ĐỘI XANH (CT / SEAL)</span>
              </div>
              <div className="flex items-center gap-2">
                {isHost && bluePlayers.length < maxPerTeam && onAddBot && (
                  <button
                    type="button"
                    onClick={() => onAddBot('blue')}
                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    + Thêm BOT
                  </button>
                )}
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/40">
                  {bluePlayers.length}/{maxPerTeam} Người
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-h-[110px]">
              {Array.from({ length: maxPerTeam }).map((_, idx) => {
                const player = bluePlayers[idx];
                if (player) {
                  const isPlayerHost = roomState?.hostId === player.id;
                  const isMe = player.id === localPlayerId;
                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                        isMe
                          ? 'bg-blue-950/50 border-blue-600/70 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                          : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-black text-blue-400">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold flex items-center gap-2">
                            <span>{player.name}</span>
                            {isMe && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500 text-white">
                                BẠN
                              </span>
                            )}
                            {player.isBot && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                                BOT MÁY
                              </span>
                            )}
                            {isPlayerHost && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> CHỦ PHÒNG
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500">Mũ sắt • Phe Phòng thủ</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                        {player.isBot ? '0ms' : `${player.ping}ms`}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={`blue_empty_${idx}`}
                    className="p-3 rounded-lg border border-dashed border-neutral-800/80 bg-neutral-950/30 flex items-center justify-between text-neutral-400"
                  >
                    <span className="text-xs">Trống (BOT tự động tham gia nếu thiếu)</span>
                    {currentTeam !== 'blue' && (
                      <button
                        type="button"
                        onClick={() => onSwitchTeam('blue')}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-950/80 border border-blue-800/40 px-3 py-1 rounded transition-colors"
                      >
                        Đổi sang Đội Xanh
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Room Info Tips */}
        <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl p-3 text-xs text-neutral-400 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>
              Tổng số người trong phòng: <strong className="text-white">{players.length}</strong> / {maxPerTeam * 2}
            </span>
          </div>
          <div className="text-neutral-400 text-xs">
            💡 Mẹo: Hệ thống sẽ tự động thêm BOT chiến thuật nếu chưa đủ người khi bắt đầu để trận đấu luôn đông đủ!
          </div>
        </div>

        {/* Action Controls */}
        <div className="border-t border-neutral-800 pt-5">
          {isHost ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onStartGame}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-4 px-6 rounded-xl text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>BẮT ĐẦU TRẬN ĐẤU (CHỦ PHÒNG)</span>
              </button>
              <div className="text-center text-xs text-amber-400/80 font-medium">
                👑 Bạn là chủ phòng. Nhấn nút trên để bắt đầu trận đấu cho tất cả người chơi trong phòng.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <div className="text-sm font-black text-amber-300 uppercase tracking-wide">
                  ĐANG CHỜ CHỦ PHÒNG BẮT ĐẦU TRẬN ĐẤU...
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Trận đấu sẽ tự động tải ngay khi chủ phòng ấn Bắt đầu. Hãy sẵn sàng!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
