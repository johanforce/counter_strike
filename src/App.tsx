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
  RoomState
} from './types/game';
import { FPSGameEngine } from './game/engine';
import { HUD } from './components/HUD';
import { Lobby } from './components/Lobby';
import { Scoreboard } from './components/Scoreboard';
import { SettingsModal } from './components/SettingsModal';
import { WaitingRoom } from './components/WaitingRoom';

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
  const [localPlayerId, setLocalPlayerId] = useState<string>('');
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
    playerPos: { x: number; z: number; rotY: number };
    allies: { x: number; z: number }[];
    enemies: { x: number; z: number }[];
  } | null>(null);
  const [roundStatus, setRoundStatus] = useState<{
    show: boolean;
    winner?: 'red' | 'blue' | 'draw';
    message: string;
  }>({ show: false, message: '' });

  // Scoreboard Tab Key
  const [isScoreboardOpen, setIsScoreboardOpen] = useState<boolean>(false);

  // Canvas container ref
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FPSGameEngine | null>(null);

  // Start game session from Lobby
  const handleStartGame = (config: GameConfig) => {
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
        isJoinOnly: gameConfig.isJoinOnly
      }));
    };

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'joined_room') {
          if (msg.playerId) setLocalPlayerId(msg.playerId);
          if (msg.room) {
            setRoomState(msg.room);
            setGameConfig((prev) => prev ? {
              ...prev,
              mode: msg.room.mode || prev.mode,
              roomCode: msg.room.code
            } : null);
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
  }, [screen, gameConfig]);

  const handleHostStartMatch = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_match' }));
    }
  };

  const handleSwitchTeam = (newTeam: Team) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'switch_team', team: newTeam }));
      setGameConfig((prev) => (prev ? { ...prev, team: newTeam } : null));
    }
  };

  const handleLeaveWaitingRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setRoomState(null);
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

    // Reset scores & HUD
    setHealth(100);
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

    const engine = new FPSGameEngine(
      canvasContainerRef.current,
      {
        onHUDUpdate: (hud) => {
          setHealth(hud.health);
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
        }
      },
      {
        playerName: gameConfig.playerName,
        team: gameConfig.team,
        mode: gameConfig.mode,
        isOnline: gameConfig.isOnline,
        roomCode: gameConfig.roomCode,
        botDifficulty: gameConfig.botDifficulty,
        settings,
        existingWs: gameConfig.isOnline && wsRef.current ? wsRef.current : undefined,
        localPlayerId: gameConfig.isOnline && localPlayerId ? localPlayerId : undefined
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
          mode={gameConfig.mode}
          isConnecting={isConnectingWs}
          errorMsg={wsError}
          onStartGame={handleHostStartMatch}
          onLeaveRoom={handleLeaveWaitingRoom}
          onSwitchTeam={handleSwitchTeam}
        />
      )}

      {screen === 'playing' && (
        <div className="relative w-full h-full">
          {/* 3D WebGL Canvas Container */}
          <div ref={canvasContainerRef} className="w-full h-full cursor-crosshair" />

          {/* Retro Classic FPS HUD */}
          <HUD
            health={health}
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
          />

          {/* Scoreboard (Tab overlay) */}
          <Scoreboard
            isOpen={isScoreboardOpen}
            redScore={redScore}
            blueScore={blueScore}
            currentRound={round}
            localPlayer={{
              name: gameConfig?.playerName || 'Bạn',
              team: gameConfig?.team || 'red',
              kills: 0,
              deaths: isDead ? 1 : 0,
              health
            }}
            otherPlayers={[]}
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
