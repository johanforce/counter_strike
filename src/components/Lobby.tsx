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
  Dice5,
  User,
  Settings,
  Shield,
  Layers
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

const SHOWCASE_WEAPONS: WeaponType[] = [
  'usp',
  'pistol',
  'mp9',
  'xm1014',
  'm4a1s',
  'ak47',
  'awp',
  'knife',
  'hegrenade',
  'smokegrenade'
];

const RANDOM_NICKNAMES = [
  'ChienBinh_Vn',
  'SatThu_BongToi',
  'XaThu_AWP',
  'ThoSan_Deagle',
  'BongMa_Mid',
  'Ninja_Defuse',
  'VuaPhaLuoi',
  'Rambo_Ak47',
  'SieuCap_Pro',
  'TaySung_HuyenThoai'
];

export const Lobby: React.FC<LobbyProps> = ({ onStartGame, onOpenSettings }) => {
  // Navigation / Main Menu Mode: 'bot' (Chơi vs máy) | 'online' (Chơi online) | 'profile' (Chọn tên nhân vật)
  const [mainMenuSection, setMainMenuSection] = useState<'bot' | 'online' | 'profile'>('bot');

  // Player Name State
  const [playerName, setPlayerName] = useState(() => {
    const saved = localStorage.getItem('cs_player_name');
    if (saved) return saved;
    return 'ChienBinh_' + Math.floor(Math.random() * 900 + 100);
  });

  const [team, setTeam] = useState<Team>('red');
  const [mode, setMode] = useState<GameMode>('2v2');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('normal');
  const [selectedMap, setSelectedMap] = useState<MapId>('dust2');

  // Map Blueprint Details Modal
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [modalMapId, setModalMapId] = useState<MapId>('dust2');

  // Online Multiplayer States
  const [onlineTab, setOnlineTab] = useState<'join' | 'create'>('create');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState(() => Math.random().toString(36).substring(2, 7).toUpperCase());

  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'found' | 'not_found' | 'error'>('idle');
  const [verifiedRoom, setVerifiedRoom] = useState<ActiveRoomInfo | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [activeRooms, setActiveRooms] = useState<ActiveRoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [pastedFeedback, setPastedFeedback] = useState(false);
  const [urlParamToast, setUrlParamToast] = useState<string | null>(null);

  // Weapon Showcase Preview
  const [selectedWeaponPreview, setSelectedWeaponPreview] = useState<WeaponType>('ak47');

  // Save player name to localStorage
  const handleNameChange = (val: string) => {
    setPlayerName(val);
    try {
      localStorage.setItem('cs_player_name', val);
    } catch {
      // ignore
    }
  };

  const handleRandomizeName = () => {
    sounds.playCoinSound();
    const rand = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)] + '_' + Math.floor(Math.random() * 90 + 10);
    handleNameChange(rand);
  };

  // Check URL parameters for direct room joins
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room') || params.get('join');
      if (roomParam) {
        const clean = roomParam.trim().toUpperCase();
        setMainMenuSection('online');
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
    if (mainMenuSection === 'online') {
      fetchActiveRooms();
      const interval = setInterval(fetchActiveRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [mainMenuSection, fetchActiveRooms]);

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
        if (data.mapId) {
          setSelectedMap(data.mapId);
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
    if (mainMenuSection !== 'online' || onlineTab !== 'join') return;
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
  }, [joinCodeInput, mainMenuSection, onlineTab]);

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
    if (room.mapId) {
      setSelectedMap(room.mapId);
    }
    setOnlineTab('join');
    checkRoomExists(room.code);
  };

  // Submit and enter Waiting Room!
  const handleProceedToWaitingRoom = (isOnlineMode: boolean) => {
    sounds.init();
    sounds.playWeaponShot(selectedWeaponPreview);

    const safeName = playerName.trim() || 'ChienBinh_X';

    if (!isOnlineMode) {
      onStartGame({
        playerName: safeName,
        team,
        mode,
        mapId: selectedMap,
        isOnline: false,
        roomCode: 'BOT-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
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
        playerName: safeName,
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
        playerName: safeName,
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

  const currentMapMeta = MAPS_METADATA[selectedMap] || MAPS_METADATA.dust2;
  const currentWeaponData = WEAPONS[selectedWeaponPreview];

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

      {/* Top Header */}
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
              FPS 3D Góc Nhìn Thứ Nhất • 3 Bản Đồ Đồng Bộ Radar • Lựu Đạn HE & Smoke Nảy Vật Lý • Chạm 7 Win
            </p>
          </div>
        </div>

        {/* Header Right Actions: Quick Character Tag & Settings */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainMenuSection('profile')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mainMenuSection === 'profile'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            }`}
            title="Đổi tên nhân vật"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="max-w-[120px] truncate">{playerName || 'Chiến Binh'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-lg border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-400" />
            <span>CÀI ĐẶT</span>
          </button>
        </div>
      </header>

      {/* Main 3 Navigation Tabs (Theo yêu cầu: Chọn tên nhân vật, Chơi vs máy, Chơi online, Cài đặt) */}
      <div className="relative z-10 w-full max-w-6xl shrink-0 mt-2 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            setMainMenuSection('bot');
            sounds.playCoinSound();
          }}
          className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-black text-xs sm:text-sm tracking-wider transition-all cursor-pointer ${
            mainMenuSection === 'bot'
              ? 'bg-gradient-to-r from-emerald-950/80 to-neutral-900 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400'
              : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>1. CHƠI VỚI MÁY (BOT)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainMenuSection('online');
            sounds.playCoinSound();
          }}
          className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-black text-xs sm:text-sm tracking-wider transition-all cursor-pointer ${
            mainMenuSection === 'online'
              ? 'bg-gradient-to-r from-cyan-950/80 to-neutral-900 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
              : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
          }`}
        >
          <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>2. CHƠI ONLINE (PVP)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainMenuSection('profile');
            sounds.playCoinSound();
          }}
          className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-black text-xs sm:text-sm tracking-wider transition-all cursor-pointer ${
            mainMenuSection === 'profile'
              ? 'bg-gradient-to-r from-amber-950/80 to-neutral-900 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
              : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
          }`}
        >
          <User className="w-4 h-4 text-amber-400 shrink-0" />
          <span>3. TÊN NHÂN VẬT & PHE</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-6xl flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 my-2 overflow-hidden">
        {/* Left Interactive Column (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-900/95 border border-neutral-800 rounded-xl p-3.5 sm:p-4 shadow-2xl flex flex-col justify-between min-h-0 overflow-y-auto">
          <div className="space-y-3">
            {/* Quick Nickname Bar on top of Left Panel */}
            <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Tên nhân vật:</span>
                <span className="text-xs font-black text-amber-400">{playerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRandomizeName}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Tạo tên ngẫu nhiên"
                >
                  <Dice5 className="w-3 h-3 text-amber-400" />
                  <span>Đổi tên</span>
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ backgroundColor: team === 'red' ? '#ef444420' : '#3b82f620', color: team === 'red' ? '#ef4444' : '#60a5fa' }}>
                  {team === 'red' ? 'Phe Đỏ (T)' : 'Phe Xanh (CT)'}
                </span>
              </div>
            </div>

            {/* SECTION 1: CHƠI VỚI MÁY (BOT AI) */}
            {mainMenuSection === 'bot' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                    <Bot className="w-4 h-4" />
                    <span>Cấu hình Chơi Với Máy (Bot AI)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Huấn luyện & Tập bắn offline</span>
                </div>

                {/* Option 1: Thể thức (1vs1, 2vs2) */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    1. Thể thức trận đấu
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('1v1')}
                      className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                        mode === '1v1'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                      <span>1vs1 Đơn Đấu Solo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('2v2')}
                      className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                        mode === '2v2'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>2vs2 Đấu Đội (Có Đồng Đội Bot)</span>
                    </button>
                  </div>
                </div>

                {/* Option 2: Độ khó Bot AI */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    2. Độ khó Bot AI
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'normal', 'hard'] as BotDifficulty[]).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setBotDifficulty(diff)}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          botDifficulty === diff
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                        }`}
                      >
                        <span>{diff === 'easy' ? '🟢 DỄ (EASY)' : diff === 'normal' ? '🟡 VỪA (NORMAL)' : '🔴 KHÓ (HARD)'}</span>
                        <span className="text-[9px] opacity-80 font-normal">
                          {diff === 'easy' ? 'Phản xạ chậm' : diff === 'normal' ? 'Chuẩn CS:GO' : 'Tỉa AWP & One-tap'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Option 3: Chọn Map */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      3. Chọn Bản Đồ (3 Map Đồng Bộ Radar)
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
                      <span>Xem Sơ Đồ Toàn Cảnh</span>
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
                              ? 'bg-neutral-900 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-black uppercase ${isSel ? 'text-amber-400' : 'text-neutral-300'}`}>
                              {m.code.toUpperCase()}
                            </span>
                            <span className="text-[8.5px] px-1 py-0.2 rounded font-bold" style={{ backgroundColor: `${m.accentColor}25`, color: m.accentColor }}>
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

                {/* Option 4: Chọn Phe (T hoặc CT) */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    4. Chọn Phe Tham Chiến
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTeam('red')}
                      className={`p-2 rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
                        team === 'red'
                          ? 'bg-red-950/50 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                      <div className="text-left min-w-0">
                        <div className="font-bold text-xs text-red-400 truncate">ĐỘI ĐỎ (TERRORIST)</div>
                        <div className="text-[9.5px] text-neutral-500 truncate">Phe Tấn Công • Đặt bom</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTeam('blue')}
                      className={`p-2 rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
                        team === 'blue'
                          ? 'bg-blue-950/50 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <div className="text-left min-w-0">
                        <div className="font-bold text-xs text-blue-400 truncate">ĐỘI XANH (CT)</div>
                        <div className="text-[9.5px] text-neutral-500 truncate">Phe Phòng Thủ • Gỡ bom</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: CHƠI ONLINE (PVP ĐẤU MẠNG) */}
            {mainMenuSection === 'online' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                    <Globe className="w-4 h-4" />
                    <span>Cấu hình Chơi Online (Phòng Đấu Mạng)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Đấu người thật + Bot AI</span>
                </div>

                {/* Sub-tabs: Tạo phòng mới VS Vào phòng bằng mã */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlineTab('create')}
                    className={`py-2 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                      onlineTab === 'create'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tạo phòng mới</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnlineTab('join')}
                    className={`py-2 px-2.5 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                      onlineTab === 'join'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vào phòng bằng mã</span>
                  </button>
                </div>

                {onlineTab === 'create' && (
                  <div className="space-y-2.5 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-cyan-400 uppercase">Mã phòng mới</label>
                          <button
                            type="button"
                            onClick={() => setCreatedRoomCode(Math.random().toString(36).substring(2, 7).toUpperCase())}
                            className="text-[9.5px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Đổi mã
                          </button>
                        </div>
                        <input
                          type="text"
                          maxLength={10}
                          value={createdRoomCode}
                          onChange={(e) => setCreatedRoomCode(e.target.value.toUpperCase())}
                          className="w-full bg-neutral-900 border border-cyan-700/60 rounded-lg px-3 py-1.5 text-cyan-300 font-mono font-black tracking-widest text-sm focus:outline-none focus:border-cyan-400"
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
                            className={`py-1.5 px-2 rounded-lg border font-bold text-xs cursor-pointer ${
                              mode === '1v1' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            1vs1
                          </button>
                          <button
                            type="button"
                            onClick={() => setMode('2v2')}
                            className={`py-1.5 px-2 rounded-lg border font-bold text-xs cursor-pointer ${
                              mode === '2v2' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            2vs2
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Choose Map for Online Room */}
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                        Bản đồ thi đấu
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['dust2', 'mirage', 'inferno'] as MapId[]).map((mId) => {
                          const isSel = selectedMap === mId;
                          return (
                            <button
                              key={mId}
                              type="button"
                              onClick={() => setSelectedMap(mId)}
                              className={`p-1.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer ${
                                isSel ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                              }`}
                            >
                              <div className="truncate">{mId === 'dust2' ? 'Dust II' : mId === 'mirage' ? 'Mirage' : 'Inferno'}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {onlineTab === 'join' && (
                  <div className="space-y-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={10}
                          value={joinCodeInput}
                          onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                          placeholder="NHẬP MÃ PHÒNG (VD: K9X2B)..."
                          className="w-full bg-neutral-900 border border-amber-700/60 rounded-lg px-3 py-1.5 text-amber-300 font-mono font-bold tracking-widest text-sm focus:outline-none focus:border-amber-400 placeholder:text-neutral-600 placeholder:text-xs"
                        />
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
                        className="px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 disabled:opacity-50 text-xs font-bold rounded-lg border border-amber-700/50 flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
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

                    {/* Active Rooms list */}
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
                          Chưa có phòng mở nào. Hãy chọn "Tạo phòng mới" ở trên để làm Chủ phòng!
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
              </div>
            )}

            {/* SECTION 3: CHỌN TÊN NHÂN VẬT & HỒ SƠ CHIẾN BINH */}
            {mainMenuSection === 'profile' && (
              <div className="space-y-3.5 bg-neutral-950 p-4 rounded-xl border border-neutral-800 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase">
                    <User className="w-4 h-4" />
                    <span>Hồ Sơ Chiến Binh & Chọn Tên Nhân Vật</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">HỆ THỐNG CS:GO RANK</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase mb-1.5">
                    Biệt danh nhân vật trong trận đấu
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={18}
                      value={playerName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Nhập tên nhân vật..."
                      className="flex-1 bg-neutral-900 border border-amber-500/60 rounded-xl px-3.5 py-2.5 text-amber-400 font-black text-sm focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleRandomizeName}
                      className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg"
                    >
                      <Dice5 className="w-4 h-4" />
                      <span>Ngẫu nhiên</span>
                    </button>
                  </div>
                  <p className="text-[10.5px] text-neutral-500 mt-1">
                    Tên này sẽ hiển thị trên bảng điểm, radar, killfeed hạ gục và trong phòng chờ.
                  </p>
                </div>

                {/* Team selection */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase mb-1.5">
                    Phe thi đấu mặc định
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTeam('red')}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        team === 'red'
                          ? 'bg-red-950/60 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.25)] ring-1 ring-red-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-md shrink-0" />
                      <div className="text-left">
                        <div className="font-black text-xs text-red-400">ĐỘI ĐỎ (TERRORIST)</div>
                        <div className="text-[10px] text-neutral-400">Khăn quấn đỏ • Tấn công</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTeam('blue')}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        team === 'blue'
                          ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)] ring-1 ring-blue-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shrink-0" />
                      <div className="text-left">
                        <div className="font-black text-xs text-blue-400">ĐỘI XANH (COUNTER-TERRORIST)</div>
                        <div className="text-[10px] text-neutral-400">Mũ sắt chiến thuật • Phòng thủ</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Huy hiệu Rank: <strong>Global Elite (Huyền Thoại)</strong></span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    SẴN SÀNG CHIẾN ĐẤU
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Button: VÀO PHÒNG ĐỢI (Theo yêu cầu: Khi chọn xong rồi thì sẽ vào phòng đợi) */}
          <div className="mt-3 pt-2 border-t border-neutral-800 shrink-0">
            <button
              onClick={() => handleProceedToWaitingRoom(mainMenuSection === 'online')}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-3 px-5 rounded-xl text-sm sm:text-base uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 stroke-[2.5]" />
              <span>
                {mainMenuSection === 'online'
                  ? onlineTab === 'join'
                    ? 'VÀO PHÒNG ĐỢI THEO MÃ NÀY'
                    : 'TẠO PHÒNG & VÀO PHÒNG ĐỢI'
                  : 'VÀO PHÒNG ĐỢI (CHƠI VS MÁY)'}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Right Column: THÔNG TIN BẢN ĐỒ MAP ĐẤU & KHO VŨ KHÍ (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 min-h-0 overflow-y-auto">
          {/* Card: THÔNG TIN BẢN ĐỒ MAP ĐẤU (Theo yêu cầu: Khi chọn map sẽ có thông tin bản đồ map đấu) */}
          <div className="bg-neutral-900/95 border border-neutral-800 rounded-xl p-3.5 shadow-2xl flex flex-col justify-between min-h-0">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Thông Tin Bản Đồ: {currentMapMeta.name}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded font-mono" style={{ backgroundColor: `${currentMapMeta.accentColor}25`, color: currentMapMeta.accentColor }}>
                  {currentMapMeta.code.toUpperCase()}
                </span>
              </div>

              {/* Map Info details */}
              <div className="space-y-2 text-xs">
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-2">
                    {currentMapMeta.name} ({currentMapMeta.vietnameseName})
                    <span className="text-[10px] text-neutral-400 font-normal">
                      • {currentMapMeta.difficulty}
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                    {currentMapMeta.description}
                  </p>
                </div>

                {/* Key Callouts */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block mb-1">
                    Vị trí chiến lược & Callouts chính:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentMapMeta.keyCallouts.map((c, idx) => (
                      <span
                        key={idx}
                        className="text-[9.5px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tactical Briefing Tips */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                    Chỉ dẫn chiến thuật:
                  </span>
                  <ul className="text-[10px] text-neutral-400 space-y-1 list-disc list-inside">
                    {currentMapMeta.tacticalBriefing.slice(0, 3).map((tip, idx) => (
                      <li key={idx} className="leading-tight">{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Button to view Blueprint Modal */}
            <button
              type="button"
              onClick={() => {
                setModalMapId(selectedMap);
                setIsMapModalOpen(true);
              }}
              className="w-full mt-2.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>XEM SƠ ĐỒ BLUEPRINT 2D & ĐIỂM NÉM SMOKE</span>
            </button>
          </div>

          {/* Card: KHO VŨ KHÍ, LỰU ĐẠN HE & SMOKE (Nhớ bổ sung phần nảy vật lý) */}
          <div className="bg-neutral-900/95 border border-neutral-800 rounded-xl p-3.5 shadow-2xl flex-1 flex flex-col justify-between min-h-0">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Kho Vũ Khí & Lựu Đạn (HE, Smoke)
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">MUA PHÍM [B]</span>
              </div>

              {/* Weapon Selector Grid */}
              <div className="grid grid-cols-5 gap-1 mb-2">
                {SHOWCASE_WEAPONS.map((wId) => {
                  const item = WEAPONS[wId];
                  const isSel = selectedWeaponPreview === wId;
                  const isNade = wId === 'hegrenade' || wId === 'smokegrenade';

                  return (
                    <button
                      key={wId}
                      type="button"
                      onClick={() => {
                        setSelectedWeaponPreview(wId);
                        sounds.playWeaponShot(wId);
                      }}
                      className={`p-1 rounded border text-center transition-all cursor-pointer ${
                        isSel
                          ? isNade
                            ? 'bg-red-950/70 border-red-500 text-red-300'
                            : 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title={item.name}
                    >
                      <div className="text-[9.5px] font-bold truncate">
                        {wId === 'hegrenade' ? '💣 HE' : wId === 'smokegrenade' ? '💨 Smoke' : item.vietnameseName.split(' ')[0]}
                      </div>
                      <div className="text-[8.5px] text-emerald-400 font-mono">${item.price}</div>
                    </button>
                  );
                })}
              </div>

              {/* Current Selected Weapon Feature Card */}
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-amber-400">{currentWeaponData.name}</span>
                  <span className="text-emerald-400 font-mono font-bold">${currentWeaponData.price}</span>
                </div>
                <p className="text-[10.5px] text-neutral-400 leading-snug">
                  {currentWeaponData.description}
                </p>
                {(selectedWeaponPreview === 'hegrenade' || selectedWeaponPreview === 'smokegrenade') && (
                  <div className="mt-1.5 p-1.5 bg-red-950/40 border border-red-800/40 rounded text-[9.5px] text-red-300 flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Tích hợp cơ chế <strong>Nảy Vật Lý</strong> (va chạm tường, sàn) trước khi phát nổ / xả khói mù!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-neutral-950/90 border border-neutral-800 rounded-lg p-2 mt-2 flex items-center justify-between text-[10.5px] text-neutral-400">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Khởi đầu $800</span>
              </span>
              <span className="text-amber-400 font-bold">Chạm 7 Hiệp Thắng = WIN</span>
            </div>
          </div>
        </div>
      </main>

      {/* Map Blueprint Modal */}
      <MapBlueprintModal
        isOpen={isMapModalOpen}
        mapId={modalMapId}
        onClose={() => setIsMapModalOpen(false)}
        onSelectMap={(id) => {
          setSelectedMap(id);
          setIsMapModalOpen(false);
        }}
        selectable={true}
      />

      {/* Compact Footer */}
      <footer className="relative z-10 w-full max-w-6xl shrink-0 border-t border-neutral-800/80 pt-1.5 flex items-center justify-between text-[10px] text-neutral-500">
        <div>
          Bản đồ hiện tại: <strong className="text-neutral-300">{currentMapMeta.name}</strong> • Chế độ: <strong className="text-neutral-300">{mode.toUpperCase()}</strong> • Chạm 7 thắng là Win
        </div>
        <div className="text-amber-500/80 font-bold">
          Phím nóng: [B] Mở Cửa Hàng • [1, 2, 3] Đổi Súng • [R] Nạp Đạn • [Tab] Bảng Điểm
        </div>
      </footer>
    </div>
  );
};
