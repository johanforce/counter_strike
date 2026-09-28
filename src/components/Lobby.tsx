import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, Team, BotDifficulty, WEAPONS, WeaponType, ActiveRoomInfo, MapId, MAPS_METADATA } from '../types/game';
import { sounds } from '../game/audio';
import { MapBlueprintModal } from './MapBlueprintModal';
import {
  Crosshair,
  Users,
  Bot,
  Globe,
  Zap,
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
  Share2,
  DollarSign,
  Info,
  Flame,
  CloudFog
} from 'lucide-react';

interface LobbyProps {
  onStartGame: (config: {
    playerName: string;
    team: Team;
    mode: GameMode;
    mapId?: MapId;
    isOnline: boolean;
    roomCode?: string;
    botDifficulty: BotDifficulty;
    isJoinOnly?: boolean;
  }) => void;
  onOpenSettings: () => void;
}

const SHOWCASE_WEAPONS: WeaponType[] = ['usp', 'pistol', 'mp9', 'xm1014', 'm4a1s', 'ak47', 'awp', 'knife', 'hegrenade', 'smokegrenade'];

export const Lobby: React.FC<LobbyProps> = ({ onStartGame, onOpenSettings }) => {
  const [playerName, setPlayerName] = useState(() => 'ChienBinh_' + Math.floor(Math.random() * 900 + 100));
  const [mode, setMode] = useState<GameMode>('2v2');
  const [team, setTeam] = useState<Team>('red');
  const [selectedMap, setSelectedMap] = useState<MapId>('dust2');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [modalMapId, setModalMapId] = useState<MapId>('dust2');
  const [isOnline, setIsOnline] = useState(false);

  const [onlineTab, setOnlineTab] = useState<'join' | 'create'>('join');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState(() => Math.random().toString(36).substring(2, 7).toUpperCase());

  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'found' | 'not_found' | 'error'>('idle');
  const [verifiedRoom, setVerifiedRoom] = useState<ActiveRoomInfo | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [activeRooms, setActiveRooms] = useState<ActiveRoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [pastedFeedback, setPastedFeedback] = useState(false);
  const [urlParamToast, setUrlParamToast] = useState<string | null>(null);

  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('normal');
  const [selectedWeaponPreview, setSelectedWeaponPreview] = useState<WeaponType>('ak47');

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

  const fetchActiveRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setActiveRooms(data.rooms || []);
      }
    } catch {
      // ignore
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
        if (data.mode) {
          setMode(data.mode);
        }
      } else if (res.status === 404) {
        setVerifyStatus('not_found');
        setVerifiedRoom(null);
        setVerifyError(`Không tìm thấy phòng với mã "${code}".`);
      } else {
        setVerifyStatus('error');
        setVerifiedRoom(null);
        setVerifyError('Lỗi kiểm tra máy chủ.');
      }
    } catch {
      setVerifyStatus('error');
      setVerifiedRoom(null);
      setVerifyError('Không thể kết nối đến máy chủ.');
    }
  };

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

  const handleSelectActiveRoom = (room: ActiveRoomInfo) => {
    setJoinCodeInput(room.code);
    setMode(room.mode);
    setOnlineTab('join');
    checkRoomExists(room.code);
  };

  const handleStart = () => {
    sounds.init();
    sounds.playWeaponShot(selectedWeaponPreview);

    if (!isOnline) {
      onStartGame({
        playerName: playerName.trim() || 'TaySung_X',
        team,
        mode,
        mapId: selectedMap,
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
        mapId: selectedMap,
        isOnline: true,
        roomCode: code,
        botDifficulty,
        isJoinOnly: true
      });
    } else {
      const code = createdRoomCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 7).toUpperCase();
      onStartGame({
        playerName: playerName.trim() || 'TaySung_X',
        team,
        mode,
        mapId: selectedMap,
        isOnline: true,
        roomCode: code,
        botDifficulty,
        isJoinOnly: false
      });
    }
  };

  const w = WEAPONS[selectedWeaponPreview];

  return (
    <div className="relative h-screen max-h-screen w-screen bg-[#0d0e11] text-white font-mono flex flex-col items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3.5 select-none overflow-hidden">
      {/* Background Ambience Grid & Dust Tint */}
      <div className="absolute inset-0 bg-[radial-gradient(#d49938_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

      {/* URL Room Code Toast Notification */}
      {urlParamToast && (
        <div className="fixed top-3 z-50 bg-cyan-950 border border-cyan-500 text-cyan-200 px-3.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
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

      {/* Compact Top Header */}
      <header className="relative z-10 w-full max-w-6xl shrink-0 flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-500 rounded flex items-center justify-center text-black font-black shadow-[0_0_15px_#f59e0b]">
            <Crosshair className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-wider text-amber-400 leading-none">
              STRIKE CLASSIC 3D <span className="text-xs text-emerald-400 font-bold ml-1">CS:GO EDITION</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
              FPS Chiến Thuật • Khởi đầu $800 + USP-S • Đối kháng 1vs1 & 2vs2
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 transition-colors cursor-pointer"
        >
          CÀI ĐẶT
        </button>
      </header>

      {/* Main Content Area (Strictly fits remaining viewport height) */}
      <main className="relative z-10 w-full max-w-6xl flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 my-2 overflow-hidden">
        {/* Left Column: Match Setup (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-2xl flex flex-col justify-between min-h-0 overflow-y-auto">
          <div className="space-y-3">
            {/* Row 1: Player Name & Mode Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Tên chiến binh
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Nhập biệt danh..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-500 transition-colors text-xs"
                />
              </div>

              <div className="sm:col-span-7">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Chế độ kết nối
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOnline(false)}
                    className={`px-2.5 py-2 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                      !isOnline
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Đấu với Bot AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOnline(true)}
                    className={`px-2.5 py-2 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                      isOnline
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Phòng Online PvP</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Online PvP Specific Sections */}
            {isOnline ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlineTab('join')}
                    className={`py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                      onlineTab === 'join'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Vào phòng bằng Mã</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnlineTab('create')}
                    className={`py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                      onlineTab === 'create'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tạo phòng mới</span>
                  </button>
                </div>

                {onlineTab === 'join' && (
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={10}
                          value={joinCodeInput}
                          onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                          placeholder="NHẬP MÃ PHÒNG (VD: K9X2B)..."
                          className="w-full bg-neutral-900 border border-cyan-700/60 rounded-lg px-3 py-1.5 text-cyan-300 font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-cyan-400 placeholder:text-neutral-600 placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handlePasteCode}
                        className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                      >
                        {pastedFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                        <span>{pastedFeedback ? 'Đã dán' : 'Dán'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => checkRoomExists(joinCodeInput)}
                        disabled={!joinCodeInput.trim() || verifyStatus === 'checking'}
                        className="px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 disabled:opacity-50 text-xs font-bold rounded-lg border border-cyan-700/50 flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${verifyStatus === 'checking' ? 'animate-spin' : ''}`} />
                        <span>Tìm</span>
                      </button>
                    </div>

                    {verifyStatus === 'found' && verifiedRoom && (
                      <div className="px-2.5 py-1.5 bg-emerald-950/40 border border-emerald-600/60 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Phòng của {verifiedRoom.hostName}</span>
                        </div>
                        <span className="text-[11px] text-amber-300 font-bold">
                          {verifiedRoom.mode.toUpperCase()} • {verifiedRoom.playerCount}/{verifiedRoom.maxPlayers} người
                        </span>
                      </div>
                    )}

                    {verifyError && (
                      <div className="px-2.5 py-1.5 bg-red-950/50 border border-red-800/80 rounded-lg flex items-center gap-1.5 text-xs text-red-300">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="truncate">{verifyError}</span>
                      </div>
                    )}

                    {/* Active Rooms Compact List */}
                    <div className="pt-1.5 border-t border-neutral-900">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <span>Phòng đang mở ({activeRooms.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={fetchActiveRooms}
                          className="text-[10px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                          <span>Làm mới</span>
                        </button>
                      </div>

                      {activeRooms.length === 0 ? (
                        <div className="py-2 px-3 bg-neutral-900/60 border border-dashed border-neutral-800 rounded-lg text-center text-[11px] text-neutral-500">
                          Chưa có phòng mở. Hãy chuyển sang "Tạo phòng mới" để lập phòng!
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {activeRooms.map((r) => (
                            <div
                              key={r.code}
                              className="px-2.5 py-1.5 bg-neutral-900/90 border border-neutral-800 rounded flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono font-black text-amber-400 text-xs px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/40">
                                  {r.code}
                                </span>
                                <span className="text-xs font-bold text-neutral-200 truncate">{r.hostName}</span>
                                <span className="text-[10px] text-neutral-400">
                                  ({r.mode} • {r.playerCount}/{r.maxPlayers})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectActiveRoom(r)}
                                disabled={r.isFull || r.state !== 'waiting'}
                                className="px-2 py-0.5 bg-cyan-900 hover:bg-cyan-800 disabled:opacity-40 text-white text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer shrink-0"
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

                {onlineTab === 'create' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-amber-400 uppercase">Mã phòng tạo mới</label>
                          <button
                            type="button"
                            onClick={() => setCreatedRoomCode(Math.random().toString(36).substring(2, 7).toUpperCase())}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Đổi mã</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          maxLength={10}
                          value={createdRoomCode}
                          onChange={(e) => setCreatedRoomCode(e.target.value.toUpperCase())}
                          className="w-full bg-neutral-900 border border-amber-600/60 rounded-lg px-3 py-1.5 text-amber-300 font-mono font-black tracking-widest text-sm focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                          Thể thức đấu
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setMode('1v1')}
                            className={`py-2 px-2 rounded-lg border flex items-center justify-center gap-1 font-bold text-xs cursor-pointer ${
                              mode === '1v1'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                            <span>1vs1</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMode('2v2')}
                            className={`py-2 px-2 rounded-lg border flex items-center justify-center gap-1 font-bold text-xs cursor-pointer ${
                              mode === '2v2'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>2vs2</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Hỗ trợ đấu đủ người thật hoặc thêm Bot AI vào đội 2vs2. Tiêu diệt toàn bộ phe địch (người + Bot) để thắng hiệp!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Offline Bot AI Options */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Chế độ thi đấu
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('1v1')}
                      className={`py-2 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                        mode === '1v1'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>1vs1 Solo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('2v2')}
                      className={`py-2 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                        mode === '2v2'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>2vs2 Đấu Đội</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Độ khó Bot AI
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['easy', 'normal', 'hard'] as BotDifficulty[]).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setBotDifficulty(diff)}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          botDifficulty === diff
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                        }`}
                      >
                        {diff === 'easy' ? 'Dễ' : diff === 'normal' ? 'Vừa' : 'Khó'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Choose Map (3 maps: Dust II, Mirage, Inferno) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Chọn Bản Đồ Chiến Đấu (3 Map Đồng Bộ Radar)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setModalMapId(selectedMap);
                    setIsMapModalOpen(true);
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                  <span>Xem Chi Tiết Bản Đồ</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['dust2', 'mirage', 'inferno'] as MapId[]).map((mId) => {
                  const m = MAPS_METADATA[mId];
                  const isSel = selectedMap === mId;
                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => {
                        setSelectedMap(mId);
                        sounds.playCoinSound();
                      }}
                      className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSel
                          ? 'bg-neutral-900 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black uppercase ${isSel ? 'text-amber-400' : 'text-neutral-300'}`}>
                          {m.code.toUpperCase()}
                        </span>
                        <span className="text-[8.5px] px-1.5 py-0.2 rounded font-bold" style={{ backgroundColor: `${m.accentColor}25`, color: m.accentColor }}>
                          {m.theme === 'desert' ? '🏜️ Sa Mạc' : m.theme === 'middle_eastern' ? '🕌 Cung Điện' : '⛪ Phố Cổ'}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-white truncate">{m.name}</div>
                      <div className="text-[9.5px] text-neutral-500 truncate mt-0.5">{m.vietnameseName}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Choose Team */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Chọn phe tham chiến
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTeam('red')}
                  className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all cursor-pointer ${
                    team === 'red'
                      ? 'bg-red-950/40 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-400 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-bold text-xs text-red-400 truncate">ĐỘI ĐỎ (TERRORIST)</div>
                    <div className="text-[10px] text-neutral-500 truncate">Khăn đỏ • Phe Tấn công</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTeam('blue')}
                  className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all cursor-pointer ${
                    team === 'blue'
                      ? 'bg-blue-950/40 border-blue-500 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-400 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-bold text-xs text-blue-400 truncate">ĐỘI XANH (COUNTER-TERRORIST)</div>
                    <div className="text-[10px] text-neutral-500 truncate">Mũ sắt • Phe Phòng thủ</div>
                  </div>
                </button>
              </div>
            </div>

            {/* CS:GO Rules Summary Box */}
            <div className="bg-neutral-950/90 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-neutral-300">
                  Thể thức: Đội nào chạm <strong className="text-amber-400">7 HIỆP THẮNG</strong> trước là WIN • Phím <strong className="text-amber-400">B</strong> mua súng, lựu đạn HE & Smoke.
                </span>
              </div>
            </div>
          </div>

          {/* Action Start Button (Always visible at bottom of left panel) */}
          <button
            onClick={handleStart}
            className="w-full mt-3 shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-3 px-5 rounded-xl text-sm sm:text-base uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isOnline ? (
              onlineTab === 'join' ? (
                <>
                  <KeyRound className="w-4 h-4 stroke-[2.5]" />
                  <span>VÀO PHÒNG VỚI MÃ NÀY</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>TẠO PHÒNG CHỜ & MỜI BẠN</span>
                </>
              )
            ) : (
              <>
                <Crosshair className="w-4 h-4 stroke-[2.5]" />
                <span>VÀO TRẬN ĐẤU NGAY ({mode.toUpperCase()})</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: CS:GO Arsenal & Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 min-h-0 overflow-y-auto">
          {/* CS:GO Weapon Showcase */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-2xl flex-1 flex flex-col justify-between min-h-0">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Kho Vũ Khí CS:GO Cải Tiến (8 Vũ Khí)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">MUA PHÍM [B]</span>
              </div>

              {/* 8 Weapon Selector Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {SHOWCASE_WEAPONS.map((wId) => (
                  <button
                    key={wId}
                    onClick={() => {
                      setSelectedWeaponPreview(wId);
                      sounds.init();
                      sounds.playWeaponShot(wId);
                    }}
                    className={`py-1.5 px-1.5 rounded text-[10px] font-bold border transition-colors truncate cursor-pointer ${
                      selectedWeaponPreview === wId
                        ? 'bg-amber-500/25 border-amber-500 text-amber-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    {WEAPONS[wId].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Weapon Details Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-sm">{w.vietnameseName}</h3>
                  <span className="text-[10px] text-neutral-400">
                    Ô phím số [{w.slot}] • {w.hasScope ? 'Có ống ngắm (Chuột phải)' : w.isAutomatic ? 'Bắn liên thanh' : 'Bán tự động'}
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-black bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  {w.price === 0 ? 'MẶC ĐỊNH' : `$${w.price.toLocaleString()}`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-neutral-900">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Sát thương:</span>
                  <span className="font-bold text-amber-400">
                    {w.damage}{w.pellets ? `x${w.pellets}` : ''} HP
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Headshot:</span>
                  <span className="font-bold text-red-400">
                    {Math.round(w.damage * w.headshotMultiplier)} HP
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Thưởng hạ gục:</span>
                  <span className="font-bold text-emerald-400">+${w.killReward}</span>
                </div>
              </div>

              <p className="text-[10.5px] text-neutral-400 border-t border-neutral-900 pt-1.5 leading-snug">
                {w.description}
              </p>
            </div>
          </div>

          {/* Interactive Map & Controls Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 shadow-2xl shrink-0 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Bản đồ: {MAPS_METADATA[selectedMap].code.toUpperCase()} ({MAPS_METADATA[selectedMap].name})
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                FIRST TO 7 WINS
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/60 p-2 rounded-lg border border-neutral-800">
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-white truncate">
                  {MAPS_METADATA[selectedMap].vietnameseName}
                </div>
                <div className="text-[10.5px] text-neutral-400 truncate">
                  {MAPS_METADATA[selectedMap].tagline}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalMapId(selectedMap);
                  setIsMapModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-lg text-[10.5px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Xem Sơ Đồ & Smoke</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-neutral-400 border-t border-neutral-800/80 pt-1.5">
              <div><strong className="text-neutral-200">W A S D:</strong> Di chuyển</div>
              <div><strong className="text-neutral-200">Phím B:</strong> Mua súng & Nade</div>
              <div><strong className="text-neutral-200">Phím 4 / G:</strong> Đổi / Ném lựu đạn</div>
              <div><strong className="text-neutral-200">Chuột Phải:</strong> Ngắm AWP / Đâm dao</div>
              <div><strong className="text-neutral-200">1 / 2 / 3 / 4:</strong> Súng chính/lục/dao/nade</div>
              <div><strong className="text-neutral-200">C / Space / R:</strong> Ngồi / Nhảy / Nạp</div>
            </div>
          </div>
        </div>
      </main>

      {/* Map Blueprint & Information Modal */}
      <MapBlueprintModal
        isOpen={isMapModalOpen}
        mapId={modalMapId}
        onClose={() => setIsMapModalOpen(false)}
        onSelectMap={(m) => setSelectedMap(m)}
        selectable={true}
      />

      {/* Compact Footer */}
      <footer className="relative z-10 w-full max-w-6xl shrink-0 text-center text-[10px] text-neutral-500 border-t border-neutral-900 pt-1.5">
        Strike Classic 3D • Sa Mạc Bụi Cát II • Cung Điện Mirage • Phố Cổ Inferno • Lựu Đạn Nổ HE & Bom Khói Smoke • First to 7 Wins
      </footer>
    </div>
  );
};
