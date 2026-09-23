import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, Team, BotDifficulty, WEAPONS, ActiveRoomInfo } from '../types/game';
import { sounds } from '../game/audio';
import {
  Crosshair,
  Users,
  Bot,
  Globe,
  Shield,
  Zap,
  Sparkles,
  MapPin,
  KeyRound,
  PlusCircle,
  RefreshCw,
  Clipboard,
  Check,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Radio,
  Share2
} from 'lucide-react';

interface LobbyProps {
  onStartGame: (config: {
    playerName: string;
    team: Team;
    mode: GameMode;
    isOnline: boolean;
    roomCode?: string;
    botDifficulty: BotDifficulty;
    isJoinOnly?: boolean;
  }) => void;
  onOpenSettings: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onStartGame, onOpenSettings }) => {
  const [playerName, setPlayerName] = useState(() => 'ChienBinh_' + Math.floor(Math.random() * 900 + 100));
  const [mode, setMode] = useState<GameMode>('1v1');
  const [team, setTeam] = useState<Team>('red');
  const [isOnline, setIsOnline] = useState(false);
  
  // Online sub-mode: 'join' (join with existing code) or 'create' (create new room)
  const [onlineTab, setOnlineTab] = useState<'join' | 'create'>('join');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState(() => Math.random().toString(36).substring(2, 7).toUpperCase());

  // Room verification state
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'found' | 'not_found' | 'error'>('idle');
  const [verifiedRoom, setVerifiedRoom] = useState<ActiveRoomInfo | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Active rooms list
  const [activeRooms, setActiveRooms] = useState<ActiveRoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [pastedFeedback, setPastedFeedback] = useState(false);
  const [urlParamToast, setUrlParamToast] = useState<string | null>(null);

  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('normal');
  const [selectedWeaponPreview, setSelectedWeaponPreview] = useState<'ak47' | 'pistol' | 'knife'>('ak47');

  // Check URL query parameters on load for ?room=CODE or ?join=CODE
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room') || params.get('join');
      if (roomParam) {
        const clean = roomParam.trim().toUpperCase();
        setIsOnline(true);
        setOnlineTab('join');
        setJoinCodeInput(clean);
        setUrlParamToast(`Đã nhận mã phòng từ liên kết: ${clean}`);
        checkRoomExists(clean);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch active rooms from server
  const fetchActiveRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setActiveRooms(data.rooms || []);
      }
    } catch {
      // server may not be reachable
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      fetchActiveRooms();
      const interval = setInterval(fetchActiveRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline, fetchActiveRooms]);

  // Check room status by code
  const checkRoomExists = async (codeToCheck: string) => {
    const code = codeToCheck.trim().toUpperCase();
    if (!code) {
      setVerifyStatus('idle');
      setVerifiedRoom(null);
      setVerifyError(null);
      return;
    }

    setVerifyStatus('checking');
    setVerifyError(null);

    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setVerifyStatus('found');
        setVerifiedRoom(data);
        // Automatically sync mode with existing room
        if (data.mode) {
          setMode(data.mode);
        }
      } else if (res.status === 404) {
        setVerifyStatus('not_found');
        setVerifiedRoom(null);
        setVerifyError(`Không tìm thấy phòng với mã "${code}". Vui lòng kiểm tra lại hoặc tạo phòng mới!`);
      } else {
        setVerifyStatus('error');
        setVerifiedRoom(null);
        setVerifyError('Lỗi kiểm tra máy chủ. Vui lòng thử lại!');
      }
    } catch {
      setVerifyStatus('error');
      setVerifiedRoom(null);
      setVerifyError('Không thể kết nối đến máy chủ để kiểm tra phòng.');
    }
  };

  // Debounced auto-check when typing join code
  useEffect(() => {
    if (!isOnline || onlineTab !== 'join') return;
    const clean = joinCodeInput.trim().toUpperCase();
    if (clean.length >= 4) {
      const timer = setTimeout(() => {
        checkRoomExists(clean);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setVerifyStatus('idle');
      setVerifiedRoom(null);
      setVerifyError(null);
    }
  }, [joinCodeInput, isOnline, onlineTab]);

  // Paste from clipboard
  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        setJoinCodeInput(clean);
        setPastedFeedback(true);
        setTimeout(() => setPastedFeedback(false), 2000);
        checkRoomExists(clean);
      }
    } catch {
      // clipboard permission denied
    }
  };

  // Select room from active rooms list
  const handleSelectActiveRoom = (room: ActiveRoomInfo) => {
    setJoinCodeInput(room.code);
    setMode(room.mode);
    setOnlineTab('join');
    checkRoomExists(room.code);
  };

  const handleStart = () => {
    sounds.init();
    sounds.playAK47Shot();

    if (!isOnline) {
      onStartGame({
        playerName: playerName.trim() || 'TaySung_X',
        team,
        mode,
        isOnline: false,
        botDifficulty
      });
      return;
    }

    if (onlineTab === 'join') {
      const code = joinCodeInput.trim().toUpperCase();
      if (!code) {
        setVerifyError('Vui lòng nhập mã phòng cần tham gia!');
        return;
      }
      onStartGame({
        playerName: playerName.trim() || 'TaySung_X',
        team,
        mode,
        isOnline: true,
        roomCode: code,
        botDifficulty,
        isJoinOnly: true
      });
    } else {
      // Create room
      const code = createdRoomCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 7).toUpperCase();
      onStartGame({
        playerName: playerName.trim() || 'TaySung_X',
        team,
        mode,
        isOnline: true,
        roomCode: code,
        botDifficulty,
        isJoinOnly: false
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0d0e11] text-white font-mono flex flex-col items-center justify-between p-4 md:p-8 select-none overflow-y-auto">
      {/* Background Ambience Grid & Dust Tint */}
      <div className="absolute inset-0 bg-[radial-gradient(#d49938_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

      {/* URL Room Code Toast Notification */}
      {urlParamToast && (
        <div className="fixed top-4 z-50 bg-cyan-950 border border-cyan-500 text-cyan-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Share2 className="w-4 h-4 text-cyan-400" />
          <span>{urlParamToast}</span>
          <button
            type="button"
            onClick={() => setUrlParamToast(null)}
            className="ml-2 text-cyan-400 hover:text-white px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded flex items-center justify-center text-black font-black text-2xl shadow-[0_0_15px_#f59e0b]">
            <Crosshair className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-wider text-amber-400">
              STRIKE CLASSIC 3D
            </h1>
            <p className="text-xs text-neutral-400">
              Bắn súng góc nhìn thứ nhất (FPS) cổ điển • Đối kháng 1vs1 & 2vs2
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors cursor-pointer"
        >
          CÀI ĐẶT
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 my-6">
        {/* Left Column: Match Setup (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-900/90 border-2 border-neutral-800 rounded-xl p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Player Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Tên nhân vật của bạn
              </label>
              <input
                type="text"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nhập biệt danh..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-amber-400 font-bold focus:outline-none focus:border-amber-500 transition-colors text-sm"
              />
            </div>

            {/* Match Type: Bot AI vs Online PvP */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Chế độ chơi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsOnline(false)}
                  className={`p-3 rounded-lg border flex flex-col items-start transition-all cursor-pointer ${
                    !isOnline
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>Chơi với Bot AI (Solo)</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1">Vào bắn ngay tức thì với máy thông minh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOnline(true)}
                  className={`p-3 rounded-lg border flex flex-col items-start transition-all cursor-pointer ${
                    isOnline
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Phòng PvP Trực tuyến</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1">Tham gia bằng mã hoặc tự tạo phòng</span>
                </button>
              </div>
            </div>

            {/* Online PvP Specific Sections: Join Room by Code vs Create Room */}
            {isOnline ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4">
                {/* Tabs: Join existing code vs Create new room */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Lựa chọn phòng thi đấu
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlineTab('join')}
                      className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                        onlineTab === 'join'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      <span>Nhập mã vào phòng có sẵn</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnlineTab('create')}
                      className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                        onlineTab === 'create'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 text-amber-400" />
                      <span>Tạo phòng mới</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: Join with existing code */}
                {onlineTab === 'join' && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Mã phòng của bạn bè</span>
                        </label>
                        <span className="text-[11px] text-neutral-500">Mã gồm 5-8 ký tự</span>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            maxLength={10}
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                            placeholder="VÍ DỤ: K9X2B..."
                            className="w-full bg-neutral-900 border border-cyan-700/60 rounded-lg px-3.5 py-2.5 text-cyan-300 font-mono font-bold tracking-widest text-base focus:outline-none focus:border-cyan-400 placeholder:text-neutral-600 placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                          />
                          {joinCodeInput && (
                            <button
                              type="button"
                              onClick={() => {
                                setJoinCodeInput('');
                                setVerifyStatus('idle');
                                setVerifiedRoom(null);
                                setVerifyError(null);
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handlePasteCode}
                          className="px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                          title="Dán mã từ bộ nhớ tạm (Clipboard)"
                        >
                          {pastedFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                          <span>{pastedFeedback ? 'Đã dán' : 'Dán mã'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => checkRoomExists(joinCodeInput)}
                          disabled={!joinCodeInput.trim() || verifyStatus === 'checking'}
                          className="px-3.5 py-2.5 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 disabled:opacity-50 text-xs font-bold rounded-lg border border-cyan-700/50 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${verifyStatus === 'checking' ? 'animate-spin' : ''}`} />
                          <span>Kiểm tra</span>
                        </button>
                      </div>
                    </div>

                    {/* Verification Status Card */}
                    {verifyStatus === 'checking' && (
                      <div className="p-2.5 bg-neutral-900/90 border border-cyan-800/40 rounded-lg flex items-center gap-2 text-xs text-cyan-300 animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                        <span>Đang tìm kiếm phòng trên máy chủ...</span>
                      </div>
                    )}

                    {verifyStatus === 'found' && verifiedRoom && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-600/60 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>ĐÃ TÌM THẤY PHÒNG HỢP LỆ!</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/40">
                            {verifiedRoom.mode === '1v1' ? '1 VS 1' : '2 VS 2'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 pt-1">
                          <div>
                            <span className="text-neutral-500">Chủ phòng: </span>
                            <span className="font-bold text-white">{verifiedRoom.hostName}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Số người: </span>
                            <span className="font-bold text-amber-400">
                              {verifiedRoom.playerCount}/{verifiedRoom.maxPlayers} người
                            </span>
                          </div>
                        </div>
                        {verifiedRoom.isFull && (
                          <div className="text-[11px] text-red-400 font-bold mt-1">
                            ⚠️ Phòng này hiện đã đủ người chơi!
                          </div>
                        )}
                        {verifiedRoom.state === 'playing' && (
                          <div className="text-[11px] text-amber-400 font-bold mt-1">
                            ⚠️ Phòng này đang trong trận đấu!
                          </div>
                        )}
                      </div>
                    )}

                    {verifyError && (
                      <div className="p-2.5 bg-red-950/50 border border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-300">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{verifyError}</span>
                      </div>
                    )}

                    {/* Active Rooms Browser */}
                    <div className="pt-2 border-t border-neutral-900">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span>Phòng đang mở ({activeRooms.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={fetchActiveRooms}
                          className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                          <span>Làm mới</span>
                        </button>
                      </div>

                      {activeRooms.length === 0 ? (
                        <div className="p-3 bg-neutral-900/60 border border-dashed border-neutral-800 rounded-lg text-center text-xs text-neutral-500">
                          Chưa có phòng nào đang mở. Hãy nhờ bạn bè tạo phòng và gửi mã, hoặc chuyển sang thẻ "Tạo phòng mới"!
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {activeRooms.map((r) => (
                            <div
                              key={r.code}
                              className="p-2 bg-neutral-900/90 border border-neutral-800 rounded-lg flex items-center justify-between gap-2 hover:border-neutral-700 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono font-black text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                                  {r.code}
                                </span>
                                <div>
                                  <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                                    <span>{r.hostName}</span>
                                    <span className="text-[10px] text-neutral-400">
                                      ({r.mode})
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-neutral-500">
                                    {r.playerCount}/{r.maxPlayers} người • {r.state === 'waiting' ? 'Đang chờ' : 'Đang đấu'}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSelectActiveRoom(r)}
                                disabled={r.isFull || r.state !== 'waiting'}
                                className="px-2.5 py-1 bg-cyan-900 hover:bg-cyan-800 disabled:opacity-40 disabled:hover:bg-cyan-900 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>{r.isFull ? 'Đầy' : 'Chọn'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Create new room */}
                {onlineTab === 'create' && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Mã phòng của bạn (Sẽ tạo mới)
                        </label>
                        <button
                          type="button"
                          onClick={() => setCreatedRoomCode(Math.random().toString(36).substring(2, 7).toUpperCase())}
                          className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Đổi mã khác</span>
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={10}
                          value={createdRoomCode}
                          onChange={(e) => setCreatedRoomCode(e.target.value.toUpperCase())}
                          className="flex-1 bg-neutral-900 border border-amber-600/60 rounded-lg px-3.5 py-2.5 text-amber-300 font-mono font-black tracking-widest text-base focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1.5">
                        Gửi mã này cho bạn bè để họ nhập vào thẻ "Nhập mã vào phòng có sẵn" và tham chiến cùng bạn!
                      </p>
                    </div>

                    {/* Game Mode selection when creating */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Số lượng người chơi
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMode('1v1')}
                          className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                            mode === '1v1'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          <Crosshair className="w-4 h-4" />
                          <span>1vs1 Tử Chiến</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMode('2v2')}
                          className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                            mode === '2v2'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>2vs2 Đấu Đội</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Bot AI Options */
              <div className="space-y-4">
                {/* Game Mode (1v1 vs 2v2) for Solo */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Chế độ thi đấu
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('1v1')}
                      className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                        mode === '1v1'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <Crosshair className="w-4 h-4" />
                      <span>1vs1 Tử Chiến (Solo)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('2v2')}
                      className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                        mode === '2v2'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>2vs2 Đấu Đội (Team)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Độ khó Bot AI
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'normal', 'hard'] as BotDifficulty[]).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setBotDifficulty(diff)}
                        className={`py-2 px-3 rounded text-xs font-bold border transition-colors cursor-pointer ${
                          botDifficulty === diff
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                        }`}
                      >
                        {diff === 'easy' ? 'Dễ (Tân binh)' : diff === 'normal' ? 'Vừa (Chiến binh)' : 'Cao thủ (Pro)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Choose Team */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Chọn phe tham chiến
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTeam('red')}
                  className={`p-3 rounded-lg border flex items-center gap-3 transition-all cursor-pointer ${
                    team === 'red'
                      ? 'bg-red-950/40 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-red-400" />
                  <div className="text-left">
                    <div className="font-bold text-sm text-red-400">ĐỘI ĐỎ (PHOENIX)</div>
                    <div className="text-[10px] text-neutral-500">Khăn đỏ • Phe Tấn công</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTeam('blue')}
                  className={`p-3 rounded-lg border flex items-center gap-3 transition-all cursor-pointer ${
                    team === 'blue'
                      ? 'bg-blue-950/40 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-blue-400" />
                  <div className="text-left">
                    <div className="font-bold text-sm text-blue-400">ĐỘI XANH (SEAL / CT)</div>
                    <div className="text-[10px] text-neutral-500">Mũ sắt • Phe Phòng thủ</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Big Start Game Button */}
          <button
            onClick={handleStart}
            className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-4 px-6 rounded-xl text-lg uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
          >
            {isOnline ? (
              onlineTab === 'join' ? (
                <>
                  <KeyRound className="w-5 h-5 stroke-[2.5]" />
                  <span>VÀO PHÒNG VỚI MÃ NÀY</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                  <span>TẠO PHÒNG VÀ MỜI BẠN</span>
                </>
              )
            ) : (
              <>
                <Crosshair className="w-5 h-5 stroke-[2.5]" />
                <span>VÀO TRẬN ĐẤU NGAY</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Arsenal & Map Info (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Weapon Showcase */}
          <div className="bg-neutral-900/90 border-2 border-neutral-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Kho vũ khí chiến thuật (100 Máu)
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">PHÍM 1, 2, 3</span>
            </div>

            {/* Weapon Selector tabs */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['ak47', 'pistol', 'knife'] as const).map((wId) => (
                <button
                  key={wId}
                  onClick={() => setSelectedWeaponPreview(wId)}
                  className={`py-1.5 px-2 rounded text-xs font-bold border transition-colors cursor-pointer ${
                    selectedWeaponPreview === wId
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {WEAPONS[wId].vietnameseName}
                </button>
              ))}
            </div>

            {/* Weapon Details Card */}
            {(() => {
              const w = WEAPONS[selectedWeaponPreview];
              return (
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-black text-white text-base">{w.name}</h3>
                    <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Ô số {w.slot}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-neutral-500 block">Sát thương thân:</span>
                      <span className="font-bold text-emerald-400">{w.damage} HP</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Sát thương đầu:</span>
                      <span className="font-bold text-red-400">
                        {Math.round(w.damage * w.headshotMultiplier)} HP (1 Shot)
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Băng đạn:</span>
                      <span className="font-bold text-amber-400">
                        {w.id === 'knife' ? 'Vô hạn' : `${w.magSize} / ${w.maxReserveAmmo}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Kiểu bắn:</span>
                      <span className="font-bold text-neutral-300">
                        {w.isAutomatic ? 'Tự động (Liên thanh)' : w.id === 'knife' ? 'Chém cận chiến' : 'Bán tự động'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 border-t border-neutral-850 pt-2 italic">
                    {w.id === 'ak47' && 'Hỏa lực uy lực cực đại, độ giật cao cần bắn theo nhịp 3-4 viên để chính xác.'}
                    {w.id === 'pistol' && 'Súng lục Desert Eagle .50 uy lực cao, độ chính xác phát đầu hoàn hảo.'}
                    {w.id === 'knife' && 'Dao găm cận chiến tốc độ cao, có thể kết liễu nhanh khi áp sát bất ngờ.'}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Map Preview */}
          <div className="bg-neutral-900/90 border-2 border-neutral-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                Bản đồ chiến đấu: de_dust_classic
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                SẴN SÀNG
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-3">
              Bản đồ phong cách sa mạc cổ điển (CS 1.6 retro), thiết kế chuẩn chiến thuật đối kháng với khu vực sân giữa (Mid),
              cầu đi bộ trên cao (Catwalk), ngõ dài (Long Alley), cùng các thùng gỗ quân sự và hầm vượt che chắn.
            </p>

            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <span className="text-[11px] font-bold text-neutral-400 block mb-1">HƯỚNG DẪN ĐIỀU KHIỂN:</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-neutral-400">
                <div><span className="text-neutral-200 font-semibold">W A S D:</span> Di chuyển</div>
                <div><span className="text-neutral-200 font-semibold">Chuột:</span> Xoay & ngắm</div>
                <div><span className="text-neutral-200 font-semibold">Chuột trái:</span> Bắn / Chém</div>
                <div><span className="text-neutral-200 font-semibold">Phím R:</span> Nạp đạn</div>
                <div><span className="text-neutral-200 font-semibold">Phím 1/2/3:</span> Đổi súng</div>
                <div><span className="text-neutral-200 font-semibold">Space / C:</span> Nhảy / Ngồi</div>
                <div><span className="text-neutral-200 font-semibold">Giữ Tab:</span> Bảng điểm K/D</div>
                <div><span className="text-neutral-200 font-semibold">Phím Esc:</span> Menu & Thoát</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl text-center text-xs text-neutral-600 border-t border-neutral-900 pt-3">
        Strike Classic 3D • 100 HP • AK-47 • Desert Eagle • Tactical Knife • Retro Engine
      </footer>
    </div>
  );
};
