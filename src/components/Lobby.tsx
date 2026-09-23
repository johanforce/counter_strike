import React, { useState } from 'react';
import { GameMode, Team, BotDifficulty, WEAPONS } from '../types/game';
import { sounds } from '../game/audio';
import { Crosshair, Users, Bot, Globe, Shield, Zap, Sparkles, MapPin } from 'lucide-react';

interface LobbyProps {
  onStartGame: (config: {
    playerName: string;
    team: Team;
    mode: GameMode;
    isOnline: boolean;
    roomCode?: string;
    botDifficulty: BotDifficulty;
  }) => void;
  onOpenSettings: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onStartGame, onOpenSettings }) => {
  const [playerName, setPlayerName] = useState(() => 'ChienBinh_' + Math.floor(Math.random() * 900 + 100));
  const [mode, setMode] = useState<GameMode>('1vs1' as any === '1vs1' ? '1v1' : '1v1');
  const [team, setTeam] = useState<Team>('red');
  const [isOnline, setIsOnline] = useState(false);
  const [roomCode, setRoomCode] = useState(() => Math.random().toString(36).substring(2, 7).toUpperCase());
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('normal');
  const [selectedWeaponPreview, setSelectedWeaponPreview] = useState<'ak47' | 'pistol' | 'knife'>('ak47');

  const handleStart = () => {
    sounds.init();
    sounds.playAK47Shot();
    onStartGame({
      playerName: playerName.trim() || 'TaySung_X',
      team,
      mode,
      isOnline,
      roomCode: isOnline ? roomCode.trim().toUpperCase() : undefined,
      botDifficulty
    });
  };

  return (
    <div className="relative min-h-screen bg-[#0d0e11] text-white font-mono flex flex-col items-center justify-between p-4 md:p-8 select-none overflow-y-auto">
      {/* Background Ambience Grid & Dust Tint */}
      <div className="absolute inset-0 bg-[radial-gradient(#d49938_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

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
          className="px-4 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors"
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

            {/* Game Mode (1v1 vs 2v2) */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Chế độ thi đấu
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('1v1')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                    mode === '1v1'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <Crosshair className="w-4 h-4" />
                  <span>1vs1 Tử Chiến (Solo Duel)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('2v2')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                    mode === '2v2'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>2vs2 Đấu Đội (Team Tactical)</span>
                </button>
              </div>
            </div>

            {/* Match Type: Bot AI vs Online PvP */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Đối thủ
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsOnline(false)}
                  className={`p-3 rounded-lg border flex flex-col items-start transition-all ${
                    !isOnline
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
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
                  className={`p-3 rounded-lg border flex flex-col items-start transition-all ${
                    isOnline
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Phòng PvP Online</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1">Bắn thời gian thực qua mã phòng</span>
                </button>
              </div>
            </div>

            {/* Sub-options based on match type */}
            {!isOnline ? (
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
                      className={`py-2 px-3 rounded text-xs font-bold border transition-colors ${
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
            ) : (
              <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                  Mã phòng PvP (Cùng nhập chung mã để vào cùng trận)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-neutral-950 border border-cyan-700/60 rounded px-3 py-2 text-cyan-300 font-bold uppercase tracking-widest text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setRoomCode(Math.random().toString(36).substring(2, 7).toUpperCase())}
                    className="px-3 py-2 bg-neutral-800 text-xs font-bold rounded hover:bg-neutral-700 text-neutral-300"
                  >
                    TẠO MÃ MỚI
                  </button>
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
                  className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
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
                  className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
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
            className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black py-4 px-6 rounded-xl text-lg uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            VÀO TRẬN ĐẤU NGAY
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
                  className={`py-1.5 px-2 rounded text-xs font-bold border transition-colors ${
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
