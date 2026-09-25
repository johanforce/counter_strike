/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  WeaponType,
  Team,
  GameMode,
  KillFeedEvent,
  GameSettings,
  BotDifficulty,
  RoomState,
  ChatMessage
} from './types/game';
import { FPSGameEngine } from './game/engine';
import { HUD } from './components/HUD';
import { Lobby } from './components/Lobby';
import { Scoreboard } from './components/Scoreboard';
import { SettingsModal } from './components/SettingsModal';
import { WaitingRoom } from './components/WaitingRoom';
import { sounds } from './game/audio';

interface GameConfig {
  playerName: string;
  team: Team;
  mode: GameMode;
  isOnline: boolean;
  roomCode?: string;
  botDifficulty: BotDifficulty;
  isJoinOnly?: boolean;
}

export default function App() {
  const [screen, setScreen] = useState<'lobby' | 'waiting' | 'playing'>('lobby');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  // Multiplayer Waiting Room States
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [localPlayerId] = useState<string>(() => {
    let id = sessionStorage.getItem('cs_player_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('cs_player_id', id);
    }
    return id;
  });
  const [isConnectingWs, setIsConnectingWs] = useState<boolean>(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 1.0,
    invertY: false,
    crosshairColor: '#34d399',
    crosshairSize: 8,
    showFPS: false,
    fov: 75
  });
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // In-Game Live HUD States
  const [health, setHealth] = useState<number>(100);
  const [armor, setArmor] = useState<number>(100);
  const [ammo, setAmmo] = useState<number>(30);
  const [reserveAmmo, setReserveAmmo] = useState<number>(90);
  const [weapon, setWeapon] = useState<WeaponType>('ak47');
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [redScore, setRedScore] = useState<number>(0);
  const [blueScore, setBlueScore] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [hitMarker, setHitMarker] = useState<boolean>(false);
  const [isDead, setIsDead] = useState<boolean>(false);
  const [respawnTimer, setRespawnTimer] = useState<number>(0);
  const [killFeed, setKillFeed] = useState<KillFeedEvent[]>([]);
  const [radarData, setRadarData] = useState<{
    playerPos: { x: number; y: number; z: number; rotY: number };
    allies: { x: number; y: number; z: number; name?: string; rotY?: number }[];
    enemies: { x: number; y: number; z: number; rotY?: number }[];
  } | null>(null);
  const [roundStatus, setRoundStatus] = useState<{
    show: boolean;
    winner?: 'red' | 'blue' | 'draw';
    message: string;
  }>({ show: false, message: '' });

  // Scoreboard Tab Key
  const [isScoreboardOpen, setIsScoreboardOpen] = useState<boolean>(false);

  // Economy Money State (CS Currency)
  const [money, setMoney] = useState<number>(800);
  const [isGodMode, setIsGodMode] = useState<boolean>(false);

  // In-Game Tactical Chat Messages (Fresh per room/session)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Canvas container ref
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FPSGameEngine | null>(null);

  // Start game session from Lobby
  const handleStartGame = (config: GameConfig) => {
    setChatMessages([]);
    setMoney(800);
    setIsGodMode(false);
    setGameConfig(config);
    if (config.isOnline) {
      setScreen('waiting');
    } else {
      setScreen('playing');
    }
  };

  // Connect to Waiting Room WebSocket
  useEffect(() => {
    if (screen !== 'waiting' || !gameConfig || !gameConfig.isOnline) return;

    // Prevent duplicate sockets if already active
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setIsConnectingWs(true);
    setWsError(null);

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setIsConnectingWs(false);
      socket.send(JSON.stringify({
        type: 'join_room',
        roomCode: gameConfig.roomCode,
        playerName: gameConfig.playerName,
        preferredTeam: gameConfig.team,
        mode: gameConfig.mode,
        isJoinOnly: gameConfig.isJoinOnly,
        playerId: localPlayerId
      }));
    };

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'joined_room') {
          if (msg.room) {
            setRoomState(msg.room);
          }
        } else if (msg.type === 'player_joined' || msg.type === 'player_left' || msg.type === 'player_updated') {
          if (msg.room) setRoomState(msg.room);
        } else if (msg.type === 'match_started') {
          if (msg.room) setRoomState(msg.room);
          setScreen('playing');
        } else if (msg.type === 'error') {
          setWsError(msg.message || 'Lỗi kết nối phòng');
        }
      } catch (e) {
        console.error('[WS] Parse error in waiting room:', e);
      }
    };

    socket.onerror = () => {
      setIsConnectingWs(false);
      setWsError('Không thể kết nối tới máy chủ phòng.');
    };

    socket.onclose = () => {
      setIsConnectingWs(false);
    };

    return () => {
      // Do not force-close socket if transitioning to playing
    };
  }, [screen]);

  const handleHostStartMatch = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_match' }));
    }
  };

  const handleSwitchTeam = (newTeam: Team) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'switch_team', team: newTeam }));
    }
  };

  const handleAddBot = (team: Team) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'add_bot', team }));
    }
  };

  const handleLeaveWaitingRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setRoomState(null);
    setChatMessages([]);
    setMoney(800);
    setIsGodMode(false);
    setScreen('lobby');
  };

  // Tab key listener for Scoreboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setIsScoreboardOpen(true);
      }
      if (e.code === 'Escape' && screen === 'playing') {
        setIsSettingsOpen((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setIsScoreboardOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen]);

  // Mount FPS Game Engine when in 'playing' screen
  useEffect(() => {
    if (screen !== 'playing' || !canvasContainerRef.current || !gameConfig) return;

    // Reset scores & HUD & clean fresh room session
    setHealth(100);
    setArmor(100);
    setAmmo(30);
    setReserveAmmo(90);
    setWeapon('ak47');
    setIsReloading(false);
    setRedScore(0);
    setBlueScore(0);
    setRound(1);
    setTimeLeft(90);
    setIsDead(false);
    setKillFeed([]);
    setChatMessages([]);
    setMoney(800);
    setIsGodMode(false);

    const engine = new FPSGameEngine(
      canvasContainerRef.current,
      {
        onHUDUpdate: (hud) => {
          setHealth(hud.health);
          setArmor(hud.armor);
          setAmmo(hud.ammo);
          setReserveAmmo(hud.reserveAmmo);
          setWeapon(hud.weapon);
          setIsReloading(hud.isReloading);
          setRedScore(hud.redScore);
          setBlueScore(hud.blueScore);
          setRound(hud.round);
          setTimeLeft(hud.timeLeft);
          setIsLocked(hud.isLocked);
          if (hud.hitMarker) {
            setHitMarker(true);
            setTimeout(() => setHitMarker(false), 90);
          }
          setIsDead(hud.isDead);
          setRespawnTimer(hud.respawnTimer);
        },
        onKillFeed: (kf) => {
          setKillFeed((prev) => [...prev.slice(-10), kf]);
        },
        onRadarUpdate: (rData) => {
          setRadarData(rData);
        },
        onRoundStatus: (status) => {
          setRoundStatus(status);
        },
        onConnectionChange: (connected) => {
          console.log('[Multiplayer] Connected:', connected);
        },
        onRoomUpdate: (updatedRoom) => {
          setRoomState(updatedRoom);
        },
        onChatMessage: (msg) => {
          setChatMessages((prev) => [...prev.slice(-25), msg]);
        }
      },
      {
        playerName: (gameConfig.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.name) || gameConfig.playerName,
        team: (gameConfig.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.team) || gameConfig.team,
        mode: (gameConfig.isOnline && roomState?.mode) || gameConfig.mode,
        isOnline: gameConfig.isOnline,
        roomCode: gameConfig.roomCode,
        botDifficulty: gameConfig.botDifficulty,
        settings,
        existingWs: gameConfig.isOnline && wsRef.current ? wsRef.current : undefined,
        localPlayerId: gameConfig.isOnline && localPlayerId ? localPlayerId : undefined,
        initialRoomState: roomState,
        isHost: roomState?.hostId === localPlayerId
      }
    );

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [screen, gameConfig]);

  const handleRequestLock = () => {
    if (engineRef.current) {
      engineRef.current.requestLock();
    }
  };

  const handleSendChatMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Secret Cheat Command: /coin1000 to increase money by $1000 (hidden from chat)
    if (
      trimmed.toLowerCase() === '/coin1000' ||
      trimmed.toLowerCase() === '/coin 1000' ||
      trimmed.toLowerCase().startsWith('/coin1000')
    ) {
      setMoney((prev) => prev + 1000);
      sounds.playCoinSound();
      return;
    }

    // Secret Cheat Command: /godmode - Infinite Ammo without reload (hidden from chat)
    if (trimmed.toLowerCase() === '/godmode') {
      const nextGodMode = !isGodMode;
      setIsGodMode(nextGodMode);
      if (engineRef.current) {
        engineRef.current.setGodMode(nextGodMode);
      }
      sounds.playCoinSound();
      return;
    }

    // Normal or /all chat (Real players only)
    if (engineRef.current) {
      engineRef.current.sendChatMessage(trimmed);
    }
  };

  const handleChatFocus = () => {
    if (engineRef.current) {
      engineRef.current.clearMovementState();
    }
  };

  const handleQuitToLobby = () => {
    if (engineRef.current) {
      engineRef.current.unlock();
      engineRef.current.dispose();
      engineRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setRoomState(null);
    setChatMessages([]);
    setMoney(800);
    setIsGodMode(false);
    setIsSettingsOpen(false);
    setScreen('lobby');
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      {screen === 'lobby' && (
        <Lobby
          onStartGame={handleStartGame}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {screen === 'waiting' && gameConfig && (
        <WaitingRoom
          roomState={roomState}
          localPlayerId={localPlayerId}
          playerName={gameConfig.playerName}
          roomCode={gameConfig.roomCode || ''}
          mode={roomState?.mode || gameConfig.mode}
          isConnecting={isConnectingWs}
          errorMsg={wsError}
          onStartGame={handleHostStartMatch}
          onLeaveRoom={handleLeaveWaitingRoom}
          onSwitchTeam={handleSwitchTeam}
          onAddBot={handleAddBot}
        />
      )}

      {screen === 'playing' && (
        <div className="relative w-full h-full">
          {/* 3D WebGL Canvas Container */}
          <div ref={canvasContainerRef} className="w-full h-full cursor-crosshair" />

          {/* Retro Classic FPS HUD */}
          <HUD
            health={health}
            armor={armor}
            ammo={ammo}
            reserveAmmo={reserveAmmo}
            weapon={weapon}
            isReloading={isReloading}
            redScore={redScore}
            blueScore={blueScore}
            round={round}
            timeLeft={timeLeft}
            isLocked={isLocked}
            hitMarker={hitMarker}
            isDead={isDead}
            respawnTimer={respawnTimer}
            killFeed={killFeed}
            radarData={radarData}
            roundStatus={roundStatus}
            onRequestLock={handleRequestLock}
            onOpenSettings={() => setIsSettingsOpen(true)}
            money={money}
            chatMessages={chatMessages}
            onSendChatMessage={handleSendChatMessage}
            localPlayerTeam={(gameConfig?.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.team) || gameConfig?.team || 'red'}
            onChatFocus={handleChatFocus}
            isGodMode={isGodMode}
          />

          {/* Scoreboard (Tab overlay) */}
          <Scoreboard
            isOpen={isScoreboardOpen}
            redScore={redScore}
            blueScore={blueScore}
            currentRound={round}
            localPlayer={{
              name: (gameConfig?.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.name) || gameConfig?.playerName || 'Bạn',
              team: (gameConfig?.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.team) || gameConfig?.team || 'red',
              kills: (gameConfig?.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.kills) || 0,
              deaths: (gameConfig?.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.deaths) || (isDead ? 1 : 0),
              health
            }}
            otherPlayers={
              gameConfig?.isOnline && roomState?.players
                ? roomState.players
                    .filter((p) => p.id !== localPlayerId)
                    .map((p) => ({
                      id: p.id,
                      name: p.name,
                      team: p.team,
                      kills: p.kills,
                      deaths: p.deaths,
                      health: p.health,
                      isBot: !!p.isBot
                    }))
                : []
            }
          />

          {/* Quick Pause / Exit Button top left */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-4 left-44 z-40 bg-black/60 hover:bg-black/90 text-neutral-400 hover:text-white px-2.5 py-1 text-xs rounded border border-neutral-700 pointer-events-auto transition-colors font-mono"
          >
            MENU (ESC)
          </button>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        volume={volume}
        isMuted={isMuted}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={(newS) => setSettings((prev) => ({ ...prev, ...newS }))}
        onUpdateVolume={(v) => setVolume(v)}
        onToggleMute={() => setIsMuted((prev) => !prev)}
      />

      {/* Leave match button inside settings if in game */}
      {isSettingsOpen && screen === 'playing' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={handleQuitToLobby}
            className="bg-red-900/90 hover:bg-red-800 text-white font-mono font-bold px-6 py-2.5 rounded-lg border border-red-500 shadow-2xl transition-all cursor-pointer"
          >
            RỜI TRẬN ĐẤU VỀ MENU CHÍNH
          </button>
        </div>
      )}
    </div>
  );
}
