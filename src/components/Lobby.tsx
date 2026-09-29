import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameMode, Team, BotDifficulty, ActiveRoomInfo, MapId, MAPS_METADATA } from '../types/game';
import { sounds } from '../game/audio';
import { TacticalHandbookModal } from './TacticalHandbookModal';
import {
  Crosshair,
  Users,
  Bot,
  Globe,
  Settings,
  BookOpen,
  Dice5,
  ArrowRight,
  Shield,
  KeyRound,
  PlusCircle,
  RefreshCw,
  Clipboard,
  Check,
  CheckCircle2,
  AlertCircle,
  Radio,
  ChevronDown,
  MapPin,
  Swords
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

const RANDOM_NICKNAMES = [
  'ChienBinh_VN',
  'SatThu_Mid',
  'XaThu_AWP',
  'BongMa_Dust2',
  'Ninja_Defuse',
  'Rambo_Ak47',
  'VuaPhaLuoi',
  'TaySung_Pro',
  'HuyenThoai_CS'
];

interface DropdownOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface CustomDropdownProps<T> {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (val: T) => void;
  rightAction?: React.ReactNode;
}

function CustomDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  rightAction
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5 px-0.5 min-h-[18px]">
        <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
          {label}
        </label>
        {rightAction}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-11 px-3.5 bg-[#0d1016] border rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
          isOpen
            ? 'border-amber-400 bg-neutral-900 shadow-md ring-1 ring-amber-400/50'
            : 'border-neutral-800 hover:border-neutral-700'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="text-xs sm:text-sm font-bold text-white">
            {selectedOption.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {selectedOption.badge && (
            <span
              className="text-[10px] px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap"
              style={{
                backgroundColor: `${selectedOption.badgeColor || '#f59e0b'}20`,
                color: selectedOption.badgeColor || '#f59e0b'
              }}
            >
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#121620] border border-neutral-700 rounded-xl shadow-2xl p-1.5 space-y-1 max-h-64 overflow-y-auto">
          {options.map((opt) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  sounds.playCoinSound();
                  setIsOpen(false);
                }}
                className={`w-full h-10 px-3 rounded-lg text-left flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
                  isSel
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-neutral-200 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="font-bold">{opt.label}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {opt.badge && (
                    <span
                      className="text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold whitespace-nowrap"
                      style={{
                        backgroundColor: `${opt.badgeColor || '#f59e0b'}20`,
                        color: opt.badgeColor || '#f59e0b'
                      }}
                    >
                      {opt.badge}
                    </span>
                  )}
                  {isSel && <Check className="w-4 h-4 text-amber-400 stroke-[2.5]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const Lobby: React.FC<LobbyProps> = ({ onStartGame, onOpenSettings }) => {
  // Mode: 'bot' (Offline vs Bots) | 'online' (Multiplayer Online)
  const [gameCategory, setGameCategory] = useState<'bot' | 'online'>('bot');

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

  // Tactical Handbook Modal
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [handbookInitialTab, setHandbookInitialTab] = useState<'weapons' | 'maps' | 'tips'>('weapons');
  const [handbookMapId, setHandbookMapId] = useState<MapId>('dust2');

  // Online Multiplayer States
  const [onlineTab, setOnlineTab] = useState<'create' | 'join'>('create');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState(() =>
    Math.random().toString(36).substring(2, 7).toUpperCase()
  );

  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'found' | 'not_found' | 'error'>('idle');
  const [verifiedRoom, setVerifiedRoom] = useState<ActiveRoomInfo | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [activeRooms, setActiveRooms] = useState<ActiveRoomInfo[]>([]);
  const [pastedFeedback, setPastedFeedback] = useState(false);
  const [urlToast, setUrlToast] = useState<string | null>(null);

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
    const rand =
      RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)] +
      '_' +
      Math.floor(Math.random() * 90 + 10);
    handleNameChange(rand);
  };

  // URL room param auto join
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room') || params.get('join');
      if (roomParam) {
        const clean = roomParam.trim().toUpperCase();
        setGameCategory('online');
        setOnlineTab('join');
        setJoinCodeInput(clean);
        setUrlToast(`Đã nhận mã phòng: ${clean}`);
        checkRoomExists(clean);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchActiveRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setActiveRooms(data.rooms || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (gameCategory === 'online') {
      fetchActiveRooms();
      const interval = setInterval(fetchActiveRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [gameCategory, fetchActiveRooms]);

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
        if (data.mode) setMode(data.mode);
        if (data.mapId) setSelectedMap(data.mapId);
      } else if (res.status === 404) {
        setVerifyStatus('not_found');
        setVerifiedRoom(null);
        setVerifyError(`Không tìm thấy phòng "${code}".`);
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
    if (gameCategory !== 'online' || onlineTab !== 'join') return;
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
  }, [joinCodeInput, gameCategory, onlineTab]);

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

  const handleOpenHandbookForMap = (mapId: MapId) => {
    setHandbookMapId(mapId);
    setHandbookInitialTab('maps');
    setIsHandbookOpen(true);
  };

  const handleProceedToWaitingRoom = () => {
    sounds.init();
    sounds.playWeaponShot('ak47');

    const safeName = playerName.trim() || 'ChienBinh_X';

    if (gameCategory === 'bot') {
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
        setVerifyError('Vui lòng nhập mã phòng!');
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
      const code =
        createdRoomCode.trim().toUpperCase() ||
        Math.random().toString(36).substring(2, 7).toUpperCase();
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

  // Dropdown options with clean, bold titles only - zero small explanatory text
  const gameCategoryOptions: DropdownOption<'bot' | 'online'>[] = [
    {
      value: 'bot',
      label: 'Chơi Với Bot AI (Offline)',
      icon: <Bot className="w-4 h-4 text-amber-400" />,
      badge: 'OFFLINE',
      badgeColor: '#f59e0b'
    },
    {
      value: 'online',
      label: 'Đấu Mạng Trực Tuyến (Online)',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      badge: 'ONLINE',
      badgeColor: '#06b6d4'
    }
  ];

  const modeOptions: DropdownOption<GameMode>[] = [
    {
      value: '1v1',
      label: '1vs1 Solo',
      icon: <Crosshair className="w-4 h-4 text-emerald-400" />,
      badge: '1V1',
      badgeColor: '#10b981'
    },
    {
      value: '2v2',
      label: '2vs2 Đấu Đội',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      badge: '2V2',
      badgeColor: '#10b981'
    }
  ];

  const difficultyOptions: DropdownOption<BotDifficulty>[] = [
    {
      value: 'easy',
      label: 'Độ Khó: Dễ (Easy)',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />,
      badge: 'DỄ',
      badgeColor: '#10b981'
    },
    {
      value: 'normal',
      label: 'Độ Khó: Vừa (Normal)',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />,
      badge: 'VỪA',
      badgeColor: '#f59e0b'
    },
    {
      value: 'hard',
      label: 'Độ Khó: Khó (Hard)',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-red-400" />,
      badge: 'KHÓ',
      badgeColor: '#ef4444'
    }
  ];

  const onlineActionOptions: DropdownOption<'create' | 'join'>[] = [
    {
      value: 'create',
      label: 'Tạo Phòng Mới',
      icon: <PlusCircle className="w-4 h-4 text-cyan-400" />,
      badge: 'TẠO',
      badgeColor: '#06b6d4'
    },
    {
      value: 'join',
      label: 'Vào Bằng Mã Phòng',
      icon: <KeyRound className="w-4 h-4 text-amber-400" />,
      badge: 'VÀO',
      badgeColor: '#f59e0b'
    }
  ];

  const mapOptions: DropdownOption<MapId>[] = [
    {
      value: 'dust2',
      label: 'Dust II (Sa Mạc Bụi Cát II)',
      icon: <MapPin className="w-4 h-4 text-amber-400" />,
      badge: 'DUST2',
      badgeColor: '#f59e0b'
    },
    {
      value: 'mirage',
      label: 'Mirage (Thị Trấn Cổ)',
      icon: <MapPin className="w-4 h-4 text-cyan-400" />,
      badge: 'MIRAGE',
      badgeColor: '#38bdf8'
    },
    {
      value: 'inferno',
      label: 'Inferno (Phố Cổ)',
      icon: <MapPin className="w-4 h-4 text-red-400" />,
      badge: 'INFERNO',
      badgeColor: '#ef4444'
    }
  ];

  const teamOptions: DropdownOption<Team>[] = [
    {
      value: 'red',
      label: 'Terrorist (Phe Đỏ)',
      icon: <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />,
      badge: 'T',
      badgeColor: '#ef4444'
    },
    {
      value: 'blue',
      label: 'Counter-Terrorist (Phe Xanh)',
      icon: <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />,
      badge: 'CT',
      badgeColor: '#3b82f6'
    }
  ];

  return (
    <div className="relative min-h-screen w-screen bg-[#0b0d11] text-white font-mono flex flex-col justify-between px-3 py-3 sm:px-6 select-none overflow-x-hidden">
      {/* Background CS Tactical grid */}
      <div className="fixed inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-transparent to-black pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-3xl mx-auto flex items-center justify-between border-b border-neutral-800/80 pb-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Crosshair className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h1 className="text-base sm:text-lg font-black tracking-wider text-amber-400 uppercase leading-none">
            COUNTER-STRIKE
          </h1>
        </div>

        {/* Center/Right Actions: Handbook, Settings & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setHandbookInitialTab('weapons');
              setIsHandbookOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 rounded-lg border border-amber-500/30 hover:border-amber-400/60 text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CẨM NANG THÔNG TIN</span>
            <span className="sm:hidden">CẨM NANG</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Cài đặt hệ thống"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CÀI ĐẶT</span>
          </button>

          {/* Quick Player Tag */}
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <input
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-neutral-200 w-28 sm:w-32 focus:outline-none focus:text-amber-400"
              title="Nhấp để đổi tên nhân vật"
            />
            <button
              onClick={handleRandomizeName}
              className="text-neutral-500 hover:text-amber-400 transition-colors cursor-pointer"
              title="Ngẫu nhiên tên"
            >
              <Dice5 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-3xl mx-auto my-auto py-4 flex flex-col gap-3">
        {/* Toast if URL join code */}
        {urlToast && (
          <div className="bg-amber-950/60 border border-amber-500/80 rounded-xl px-3.5 py-2 text-xs text-amber-200 flex items-center justify-between">
            <span>{urlToast}</span>
            <button onClick={() => setUrlToast(null)} className="text-amber-400 font-bold hover:underline">
              Đóng
            </button>
          </div>
        )}

        {/* Central Tactical Config Card */}
        <div className="bg-[#101318]/95 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
          {/* Card Header (No 'chạm 7 hiệp thắng' text) */}
          <div className="border-b border-neutral-800/80 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm uppercase tracking-wider">
              <Swords className="w-4 h-4" />
              <span>Thiết Lập Trận Đấu</span>
            </div>
          </div>

          {/* Grid of Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Slot 1: Chế độ chơi */}
            <CustomDropdown
              label="1. Chế Độ Thi Đấu"
              value={gameCategory}
              options={gameCategoryOptions}
              onChange={(val) => setGameCategory(val)}
            />

            {/* Slot 2: Thể thức trận */}
            <CustomDropdown
              label="2. Thể Thức Trận"
              value={mode}
              options={modeOptions}
              onChange={(val) => setMode(val)}
            />

            {/* Slot 3: Chọn Bản Đồ */}
            <CustomDropdown
              label="3. Bản Đồ Tác Chiến"
              value={selectedMap}
              options={mapOptions}
              onChange={(val) => setSelectedMap(val)}
              rightAction={
                <button
                  type="button"
                  onClick={() => handleOpenHandbookForMap(selectedMap)}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Sơ đồ 2D</span>
                </button>
              }
            />

            {/* Slot 4: Phe Tham Chiến */}
            <CustomDropdown
              label="4. Phe Tham Chiến"
              value={team}
              options={teamOptions}
              onChange={(val) => setTeam(val)}
            />

            {/* Slot 5: Tùy chọn thứ 5 */}
            <div className="sm:col-span-2">
              {gameCategory === 'bot' ? (
                <CustomDropdown
                  label="5. Độ Khó Bot AI"
                  value={botDifficulty}
                  options={difficultyOptions}
                  onChange={(val) => setBotDifficulty(val)}
                />
              ) : (
                <CustomDropdown
                  label="5. Tùy Chọn Phòng Online"
                  value={onlineTab}
                  options={onlineActionOptions}
                  onChange={(val) => setOnlineTab(val)}
                />
              )}
            </div>
          </div>

          {/* Online Room Specific Row if needed */}
          {gameCategory === 'online' && (
            <div className="h-11 flex items-center bg-[#0c0f14] rounded-xl border border-neutral-800 px-3.5">
              {onlineTab === 'create' ? (
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-400 uppercase">
                      Mã phòng:
                    </span>
                    <span className="text-sm font-black font-mono text-cyan-400 tracking-wider">
                      {createdRoomCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCreatedRoomCode(Math.random().toString(36).substring(2, 7).toUpperCase())
                    }
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-lg border border-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>Đổi mã</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    maxLength={10}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="Nhập mã phòng thi đấu..."
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1 text-amber-400 font-mono font-bold tracking-widest text-xs focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={handlePasteCode}
                    className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-bold rounded-lg border border-neutral-700 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {pastedFeedback ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                    <span>{pastedFeedback ? 'Đã dán' : 'Dán mã'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feedback banner for online join error/found if needed */}
          {gameCategory === 'online' && onlineTab === 'join' && (verifyStatus === 'found' || verifyError) && (
            <div className="text-xs">
              {verifyStatus === 'found' && verifiedRoom && (
                <div className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-600/60 rounded-xl flex items-center justify-between">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Phòng của {verifiedRoom.hostName} ({verifiedRoom.mode.toUpperCase()})
                  </span>
                  <span className="text-amber-300 font-bold">
                    {verifiedRoom.playerCount}/{verifiedRoom.maxPlayers} người
                  </span>
                </div>
              )}

              {verifyError && (
                <div className="px-3 py-1.5 bg-red-950/50 border border-red-800 rounded-xl text-red-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Button: VÀO PHÒNG ĐỢI */}
          <div className="pt-1">
            <button
              onClick={handleProceedToWaitingRoom}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-2.5 px-4 rounded-xl text-sm sm:text-base uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>
                {gameCategory === 'online'
                  ? onlineTab === 'join'
                    ? 'VÀO PHÒNG THEO MÃ NÀY'
                    : 'TẠO PHÒNG & VÀO SẢNH ĐỢI'
                  : 'VÀO PHÒNG ĐỢI CHIẾN ĐẤU'}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </main>

      {/* Tactical Handbook Modal */}
      <TacticalHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
        initialTab={handbookInitialTab}
        initialMapId={handbookMapId}
      />
    </div>
  );
};
