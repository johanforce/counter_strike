import React, { useState, useEffect, useRef } from 'react';
import { RoomState, Team, GameMode, MapId, MAPS_METADATA, ChatMessage, BotDifficulty } from '../types/game';
import { TacticalHandbookModal } from './TacticalHandbookModal';
import {
  Users,
  Copy,
  Check,
  Play,
  ArrowLeft,
  Crown,
  Loader2,
  Bot,
  Plus,
  Send,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

interface WaitingRoomProps {
  roomState: RoomState | null;
  localPlayerId: string | null;
  playerName: string;
  roomCode: string;
  mode: GameMode;
  mapId?: MapId;
  isOnline?: boolean;
  botDifficulty?: BotDifficulty;
  isConnecting: boolean;
  errorMsg?: string | null;
  chatMessages?: ChatMessage[];
  onSendChatMessage?: (text: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSwitchTeam: (team: Team) => void;
  onAddBot: (team: Team) => void;
  onChangeMap?: (mapId: MapId) => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomState,
  localPlayerId,
  playerName,
  roomCode,
  mode,
  mapId = 'dust2',
  isOnline = true,
  botDifficulty = 'normal',
  isConnecting,
  errorMsg,
  chatMessages = [],
  onSendChatMessage,
  onStartGame,
  onLeaveRoom,
  onSwitchTeam,
  onAddBot,
  onChangeMap
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeMapId: MapId = roomState?.mapId || mapId || 'dust2';
  const mapMeta = MAPS_METADATA[activeMapId] || MAPS_METADATA.dust2;

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || !onSendChatMessage) return;
    onSendChatMessage(text);
    setChatInput('');
  };

  const activeMode = roomState?.mode || mode;
  const maxPerTeam = activeMode === '1v1' ? 1 : 2;

  const players = roomState?.players || [];
  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');

  const isHost = roomState ? roomState.hostId === localPlayerId : true;
  const localPlayer = players.find((p) => p.id === localPlayerId);

  const canStart = isHost && redPlayers.length >= 1 && bluePlayers.length >= 1;

  return (
    <div className="relative min-h-screen w-screen bg-[#0b0d11] text-white font-mono flex flex-col justify-between px-3 py-3 sm:px-6 select-none overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-transparent to-black pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RỜI PHÒNG</span>
        </button>

        {/* Center: Title & Room Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1">
            <span className="text-[10px] text-neutral-400 font-bold uppercase">Mã:</span>
            <span className="text-xs sm:text-sm font-black font-mono text-amber-400 tracking-wider">
              {roomCode}
            </span>
            {isOnline && (
              <button
                onClick={handleCopyCode}
                className="text-neutral-400 hover:text-amber-300 ml-1 transition-colors cursor-pointer"
                title="Sao chép mã phòng"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-neutral-400">Map:</span>
            <span className="font-bold text-white">{mapMeta.name}</span>
            <span className="text-[10px] text-amber-400 uppercase">({activeMode})</span>
          </div>
        </div>

        {/* Right Action: Open Field Handbook */}
        <button
          onClick={() => setIsHandbookOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded-lg border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CẨM NANG MAP</span>
        </button>
      </header>

      {/* Main Roster Area */}
      <main className="relative z-10 w-full max-w-4xl mx-auto my-auto py-3 flex flex-col gap-3">
        {/* Error notification */}
        {errorMsg && (
          <div className="bg-red-950/80 border border-red-500 text-red-200 px-3 py-2 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={onLeaveRoom}
              className="text-xs text-red-300 underline font-bold cursor-pointer"
            >
              Thoát
            </button>
          </div>
        )}

        {/* Connecting state */}
        {isConnecting && !roomState ? (
          <div className="h-64 bg-neutral-900/60 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            <p className="text-xs text-neutral-400">Đang đồng bộ phòng đấu...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* TERRORIST (RED TEAM) */}
            <div className="bg-[#120d0f]/90 border border-red-900/60 rounded-2xl p-4 shadow-xl flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-red-900/40 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    <span className="font-black text-xs sm:text-sm text-red-400 uppercase tracking-wider">
                      TERRORIST (PHE ĐỎ)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-red-300">
                    {redPlayers.length}/{maxPerTeam}
                  </span>
                </div>

                {/* Player slots */}
                <div className="space-y-2">
                  {Array.from({ length: maxPerTeam }).map((_, idx) => {
                    const p = redPlayers[idx];
                    const isSelf = p && p.id === localPlayerId;
                    const pIsHost = p && roomState && p.id === roomState.hostId;

                    if (p) {
                      return (
                        <div
                          key={p.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            isSelf
                              ? 'bg-red-950/50 border-red-500/80 text-white'
                              : 'bg-neutral-900/60 border-neutral-800 text-neutral-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {p.isBot ? (
                              <Bot className="w-4 h-4 text-neutral-400 shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            )}
                            <span className="font-bold truncate">{p.name}</span>
                            {isSelf && (
                              <span className="text-[10px] text-amber-400 font-bold">(Bạn)</span>
                            )}
                            {pIsHost && (
                              <span title="Chủ phòng" className="inline-flex">
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {p.isBot ? 'BOT' : `${p.ping || 18}ms`}
                          </span>
                        </div>
                      );
                    }

                    // Empty Slot
                    return (
                      <div
                        key={`empty-red-${idx}`}
                        className="p-2.5 rounded-xl border border-dashed border-red-900/40 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-500"
                      >
                        <span>Vị trí trống</span>
                        {isHost && (
                          <button
                            type="button"
                            onClick={() => onAddBot('red')}
                            className="px-2 py-0.5 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm Bot AI</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Switch to Red button */}
              {localPlayer?.team !== 'red' && redPlayers.length < maxPerTeam && (
                <button
                  type="button"
                  onClick={() => onSwitchTeam('red')}
                  className="mt-3 w-full py-1.5 px-3 bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-700/60 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Đổi sang Phe Đỏ
                </button>
              )}
            </div>

            {/* COUNTER-TERRORIST (BLUE TEAM) */}
            <div className="bg-[#0b1019]/90 border border-blue-900/60 rounded-2xl p-4 shadow-xl flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-blue-900/40 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                    <span className="font-black text-xs sm:text-sm text-blue-400 uppercase tracking-wider">
                      COUNTER-TERRORIST (PHE XANH)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-300">
                    {bluePlayers.length}/{maxPerTeam}
                  </span>
                </div>

                {/* Player slots */}
                <div className="space-y-2">
                  {Array.from({ length: maxPerTeam }).map((_, idx) => {
                    const p = bluePlayers[idx];
                    const isSelf = p && p.id === localPlayerId;
                    const pIsHost = p && roomState && p.id === roomState.hostId;

                    if (p) {
                      return (
                        <div
                          key={p.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            isSelf
                              ? 'bg-blue-950/50 border-blue-500/80 text-white'
                              : 'bg-neutral-900/60 border-neutral-800 text-neutral-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {p.isBot ? (
                              <Bot className="w-4 h-4 text-neutral-400 shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            )}
                            <span className="font-bold truncate">{p.name}</span>
                            {isSelf && (
                              <span className="text-[10px] text-amber-400 font-bold">(Bạn)</span>
                            )}
                            {pIsHost && (
                              <span title="Chủ phòng" className="inline-flex">
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {p.isBot ? 'BOT' : `${p.ping || 18}ms`}
                          </span>
                        </div>
                      );
                    }

                    // Empty Slot
                    return (
                      <div
                        key={`empty-blue-${idx}`}
                        className="p-2.5 rounded-xl border border-dashed border-blue-900/40 bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-500"
                      >
                        <span>Vị trí trống</span>
                        {isHost && (
                          <button
                            type="button"
                            onClick={() => onAddBot('blue')}
                            className="px-2 py-0.5 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm Bot AI</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Switch to Blue button */}
              {localPlayer?.team !== 'blue' && bluePlayers.length < maxPerTeam && (
                <button
                  type="button"
                  onClick={() => onSwitchTeam('blue')}
                  className="mt-3 w-full py-1.5 px-3 bg-blue-950/60 hover:bg-blue-900 text-blue-200 border border-blue-700/60 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Đổi sang Phe Xanh
                </button>
              )}
            </div>
          </div>
        )}

        {/* Minimal Chat & Start Bar */}
        <div className="bg-[#101318]/90 border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
          {/* Chat feed if online */}
          {isOnline && (
            <div>
              <div className="max-h-20 overflow-y-auto space-y-1 mb-2 pr-1 text-xs">
                {chatMessages.length === 0 ? (
                  <p className="text-[10.5px] text-neutral-500 italic">
                    Chưa có tin nhắn nào. Chat cùng đồng đội trước khi xung trận...
                  </p>
                ) : (
                  chatMessages.map((m, idx) => (
                    <div key={idx} className="text-[11px] leading-tight">
                      <span className="font-bold text-amber-400">{m.senderName}: </span>
                      <span className="text-neutral-300">{m.text}</span>
                    </div>
                  ))
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  maxLength={60}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Gửi tin nhắn trong phòng..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-amber-400 rounded-lg border border-neutral-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </form>
            </div>
          )}

          {/* Start Match Action */}
          <div>
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-neutral-950 font-black py-3 px-4 rounded-xl text-sm sm:text-base uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current stroke-none" />
                <span>
                  {canStart ? 'BẮT ĐẦU TRẬN ĐẤU' : 'CẦN ÍT NHẤT 1 CHIẾN BINH MỖI PHE'}
                </span>
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl bg-neutral-900 border border-neutral-800 text-center text-xs font-bold text-amber-400 animate-pulse">
                ĐANG CHỜ CHỦ PHÒNG BẮT ĐẦU TRẬN ĐẤU...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Tactical Handbook Modal */}
      <TacticalHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
        initialTab="maps"
        initialMapId={activeMapId}
      />
    </div>
  );
};
