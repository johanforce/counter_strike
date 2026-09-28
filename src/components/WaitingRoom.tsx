import React, { useState, useEffect, useRef } from 'react';
import { RoomState, Team, GameMode, MapId, MAPS_METADATA, ChatMessage, BotDifficulty } from '../types/game';
import { MapBlueprintModal } from './MapBlueprintModal';
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
  AlertTriangle,
  MapPin,
  Info,
  MessageSquare,
  Send,
  Sparkles
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

const QUICK_CHAT_PRESETS = [
  'Sẵn sàng chiến!',
  'Pick Dust II đi!',
  'Pick Mirage đi!',
  'Pick Inferno đi!',
  'Rush B no stop!',
  'Công A đi anh em!',
  'Cẩn thận Sniper AWP!'
];

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeMapId: MapId = roomState?.mapId || mapId || 'dust2';
  const mapMeta = MAPS_METADATA[activeMapId] || MAPS_METADATA.dust2;

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || !onSendChatMessage) return;
    onSendChatMessage(text);
    setChatInput('');
  };

  const handleQuickPreset = (preset: string) => {
    if (!onSendChatMessage) return;
    onSendChatMessage(preset);
  };

  const activeMode = roomState?.mode || mode;
  const maxPerTeam = activeMode === '1v1' ? 1 : 2;
  const maxPlayers = maxPerTeam * 2;

  const players = roomState?.players || [];
  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');

  const isHost = roomState ? roomState.hostId === localPlayerId : true;
  const localPlayer = players.find((p) => p.id === localPlayerId);

  const canStart = isHost && redPlayers.length >= 1 && bluePlayers.length >= 1;

  return (
    <div className="relative h-screen max-h-screen w-screen bg-[#0d0e11] text-white font-mono flex flex-col items-center justify-between px-3 py-2 sm:px-6 sm:py-3.5 select-none overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(#d49938_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl shrink-0 flex items-center justify-between border-b border-neutral-800 pb-2">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-700 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>QUAY LẠI MENU CHÍNH</span>
        </button>

        <div className="text-center">
          <h1 className="text-base sm:text-xl font-black tracking-wider text-amber-400 uppercase flex items-center justify-center gap-2">
            <span>SẢNH CHỜ CHIẾN THUẬT</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {activeMode.toUpperCase()}
            </span>
          </h1>
          <p className="text-[10px] sm:text-xs text-neutral-400">
            {isOnline ? 'Phòng Trực Tuyến Đấu Mạng' : 'Phòng Đấu Offline Với Bot AI'} • {players.length}/{maxPlayers} Vị trí tham chiến
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{
          backgroundColor: isOnline ? '#064e3b60' : '#78350f40',
          borderColor: isOnline ? '#059669' : '#d97706'
        }}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isOnline ? '#34d399' : '#fbbf24' }}>
            {isOnline ? 'ONLINE' : 'BOT AI'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-6xl flex-1 min-h-0 flex flex-col justify-between gap-2.5 my-1.5 overflow-hidden">
        {/* Top Info Banner: Room Code & Map Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 shrink-0">
          {/* Room Code / Invite Banner (7 cols) */}
          <div className="md:col-span-7 bg-neutral-900/90 border border-amber-500/50 rounded-xl p-2.5 shadow-lg flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10.5px] font-bold uppercase">
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isOnline ? 'Mã phòng thi đấu' : 'Phòng đấu Bot AI offline'}</span>
              </div>
              <p className="text-[10.5px] text-neutral-300 truncate">
                {isOnline ? 'Chia sẻ mã hoặc link cho bạn bè để cùng chiến' : `Độ khó Bot: ${botDifficulty === 'easy' ? 'Dễ' : botDifficulty === 'normal' ? 'Vừa' : 'Khó'}`}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center bg-black border border-amber-500 rounded-lg px-2.5 py-1 gap-2">
                <span className="text-sm sm:text-base font-black tracking-widest text-amber-400 font-mono">
                  {roomCode}
                </span>
                {isOnline && (
                  <button
                    onClick={handleCopyCode}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3 stroke-[3]" />}
                    <span>{copiedCode ? 'Đã chép' : 'Chép'}</span>
                  </button>
                )}
              </div>

              {isOnline && (
                <button
                  onClick={handleCopyInviteLink}
                  className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Sao chép link mời bạn bè"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <LinkIcon className="w-3 h-3" />}
                  <span>{copiedLink ? 'Đã chép' : 'Link'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Map Info Banner (5 cols) */}
          <div className="md:col-span-5 bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 shadow-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white truncate">{mapMeta.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold" style={{ backgroundColor: `${mapMeta.accentColor}25`, color: mapMeta.accentColor }}>
                    {mapMeta.code.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold block truncate">
                  CHẠM 7 THẮNG LÀ WIN
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isHost && onChangeMap && (
                <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded-lg border border-neutral-800">
                  {(['dust2', 'mirage', 'inferno'] as MapId[]).map((mId) => (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => onChangeMap(mId)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        activeMapId === mId ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {mId === 'dust2' ? 'Dust2' : mId === 'mirage' ? 'Mirage' : 'Inferno'}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Info className="w-3 h-3 text-amber-400" />
                <span>Sơ đồ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner if any */}
        {errorMsg && (
          <div className="shrink-0 bg-red-950/80 border border-red-500 text-red-200 px-3.5 py-2 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-bold">{errorMsg}</span>
            </div>
            <button
              onClick={onLeaveRoom}
              className="px-2.5 py-0.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded cursor-pointer shrink-0"
            >
              Quay lại
            </button>
          </div>
        )}

        {/* Main Grid: Red Team (4 cols), Blue Team (4 cols), WAITING ROOM CHAT (4 cols) */}
        {isConnecting && !roomState ? (
          <div className="flex-1 bg-neutral-900/80 border border-neutral-800 rounded-xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-neutral-300">Đang đồng bộ phòng đấu với máy chủ...</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 overflow-hidden">
            {/* RED TEAM COLUMN (4 cols) */}
            <div className="lg:col-span-4 bg-red-950/20 border border-red-900/50 rounded-xl p-3 flex flex-col justify-between min-h-0">
              <div className="flex flex-col min-h-0 flex-1">
                <div className="flex items-center justify-between border-b border-red-900/50 pb-1.5 mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    <div>
                      <h2 className="font-black text-xs sm:text-sm text-red-400">
                        ĐỘI ĐỎ (TERRORIST)
                      </h2>
                      <span className="text-[9.5px] text-neutral-400">Phe Tấn Công</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/50">
                    {redPlayers.length} / {maxPerTeam}
                  </span>
                </div>

                {/* Slots */}
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                  {Array.from({ length: maxPerTeam }).map((_, idx) => {
                    const p = redPlayers[idx];
                    const isMe = p?.id === localPlayerId;
                    const isRoomHost = p?.id === roomState?.hostId;

                    return p ? (
                      <div
                        key={p.id}
                        className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
                          isMe
                            ? 'bg-red-900/40 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                            : 'bg-neutral-900/90 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-black text-xs shrink-0">
                            {p.isBot ? <Bot className="w-3.5 h-3.5" /> : p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-white text-xs truncate">{p.name}</span>
                              {isMe && (
                                <span className="text-[8.5px] bg-amber-500 text-black font-black px-1 rounded">
                                  BẠN
                                </span>
                              )}
                              {isRoomHost && (
                                <span className="text-[8.5px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-1 rounded flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> HOST
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-2.5 h-2.5" /> Sẵn sàng
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={`red-empty-${idx}`}
                        className="p-2 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 flex items-center justify-between text-neutral-600"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg border border-dashed border-neutral-800 flex items-center justify-center">
                            <Users className="w-3 h-3" />
                          </div>
                          <span className="text-[11px] italic">Chờ người chơi...</span>
                        </div>
                        {isHost && (
                          <button
                            onClick={() => onAddBot('red')}
                            className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-[9.5px] font-bold rounded border border-neutral-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" /> Bot AI
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
                  className="mt-2 w-full py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  CHUYỂN SANG ĐỘI ĐỎ
                </button>
              )}
            </div>

            {/* BLUE TEAM COLUMN (4 cols) */}
            <div className="lg:col-span-4 bg-blue-950/20 border border-blue-900/50 rounded-xl p-3 flex flex-col justify-between min-h-0">
              <div className="flex flex-col min-h-0 flex-1">
                <div className="flex items-center justify-between border-b border-blue-900/50 pb-1.5 mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                    <div>
                      <h2 className="font-black text-xs sm:text-sm text-blue-400">
                        ĐỘI XANH (COUNTER-TERRORIST)
                      </h2>
                      <span className="text-[9.5px] text-neutral-400">Phe Phòng Thủ</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50">
                    {bluePlayers.length} / {maxPerTeam}
                  </span>
                </div>

                {/* Slots */}
                <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                  {Array.from({ length: maxPerTeam }).map((_, idx) => {
                    const p = bluePlayers[idx];
                    const isMe = p?.id === localPlayerId;
                    const isRoomHost = p?.id === roomState?.hostId;

                    return p ? (
                      <div
                        key={p.id}
                        className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
                          isMe
                            ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                            : 'bg-neutral-900/90 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-black text-xs shrink-0">
                            {p.isBot ? <Bot className="w-3.5 h-3.5" /> : p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-white text-xs truncate">{p.name}</span>
                              {isMe && (
                                <span className="text-[8.5px] bg-amber-500 text-black font-black px-1 rounded">
                                  BẠN
                                </span>
                              )}
                              {isRoomHost && (
                                <span className="text-[8.5px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-1 rounded flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> HOST
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-2.5 h-2.5" /> Sẵn sàng
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={`blue-empty-${idx}`}
                        className="p-2 rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 flex items-center justify-between text-neutral-600"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg border border-dashed border-neutral-800 flex items-center justify-center">
                            <Users className="w-3 h-3" />
                          </div>
                          <span className="text-[11px] italic">Chờ người chơi...</span>
                        </div>
                        {isHost && (
                          <button
                            onClick={() => onAddBot('blue')}
                            className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-[9.5px] font-bold rounded border border-neutral-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" /> Bot AI
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
                  className="mt-2 w-full py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/50 text-blue-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  CHUYỂN SANG ĐỘI XANH
                </button>
              )}
            </div>

            {/* WAITING ROOM CHAT PANEL (4 cols) - YÊU CẦU: Thêm mới ô chat người chơi trong phòng chờ nữa */}
            <div className="lg:col-span-4 bg-neutral-950/90 border border-neutral-800 rounded-xl p-2.5 flex flex-col justify-between min-h-0 shadow-xl">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-1.5 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chat Phòng Chờ ({chatMessages.length})</span>
                </div>
                <span className="text-[9.5px] text-neutral-400 font-mono">Nhấn Enter để gửi</span>
              </div>

              {/* Chat Messages List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 text-xs">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-3 text-neutral-500">
                    <MessageSquare className="w-6 h-6 mb-1 text-neutral-600" />
                    <p className="text-[11px]">Chưa có tin nhắn nào trong phòng chờ.</p>
                    <p className="text-[10px] text-neutral-600">Gửi lời chào hoặc chọn mẫu chat nhanh bên dưới!</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isRed = (msg.senderTeam || msg.team) === 'red';
                    const isBlue = (msg.senderTeam || msg.team) === 'blue';
                    const isMe = msg.senderId === localPlayerId || msg.senderName === playerName;
                    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                    return (
                      <div
                        key={msg.id}
                        className={`p-1.5 rounded-lg border leading-tight ${
                          isMe
                            ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                            : 'bg-neutral-900/80 border-neutral-800/80 text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9.5px] mb-0.5">
                          <div className="flex items-center gap-1">
                            <span
                              className="font-black px-1 rounded text-[8.5px] uppercase"
                              style={{
                                backgroundColor: isRed ? '#ef444430' : isBlue ? '#3b82f630' : '#10b98130',
                                color: isRed ? '#f87171' : isBlue ? '#60a5fa' : '#34d399'
                              }}
                            >
                              {isRed ? 'ĐỎ' : isBlue ? 'XANH' : 'HỆ THỐNG'}
                            </span>
                            <span className="font-bold text-white truncate max-w-[110px]">
                              {msg.senderName}
                            </span>
                            {isMe && <span className="text-[8px] text-amber-400 font-bold">(Bạn)</span>}
                          </div>
                          <span className="text-neutral-500 text-[8.5px] font-mono">{timeStr}</span>
                        </div>
                        <p className="text-[11px] text-neutral-200 break-words pl-1">
                          {msg.text}
                        </p>
                      </div>
                    );
                  })
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Quick Chat Presets */}
              <div className="pt-1.5 shrink-0">
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_CHAT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickPreset(preset)}
                      className="px-2 py-0.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[9.5px] text-neutral-300 hover:text-amber-300 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Input and Send Button Form */}
                <form onSubmit={handleSendChat} className="flex gap-1.5 mt-1">
                  <input
                    type="text"
                    maxLength={120}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Nhập tin nhắn phòng chờ..."
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-xs rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3 stroke-[2.5]" />
                    <span>Gửi</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="shrink-0 bg-neutral-900/95 border border-neutral-800 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-xl">
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            {isHost ? (
              <span>
                Bạn là <strong>Chủ phòng (Host)</strong>. Khi các phe sẵn sàng, nhấn <strong>BẮT ĐẦU TRẬN ĐẤU</strong> để vào game!
              </span>
            ) : (
              <span>
                Đang chờ <strong>Chủ phòng</strong> bấm bắt đầu trận đấu...
              </span>
            )}
          </div>

          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full sm:w-auto px-7 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shrink-0 ${
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
              <span>ĐANG CHỜ CHỦ PHÒNG BẮT ĐẦU...</span>
            </div>
          )}
        </div>
      </main>

      {/* Map Blueprint Modal */}
      <MapBlueprintModal
        isOpen={isMapModalOpen}
        mapId={activeMapId}
        onClose={() => setIsMapModalOpen(false)}
        onSelectMap={onChangeMap}
        selectable={isHost}
      />

      <footer className="relative z-10 text-[9.5px] text-neutral-500 shrink-0">
        Bản đồ: {mapMeta.name} ({mapMeta.code.toUpperCase()}) • Thể thức {activeMode.toUpperCase()} • Đội nào chạm 7 hiệp thắng trước là WIN
      </footer>
    </div>
  );
};
