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
  PlayerNetState,
  ChatMessage,
  CS_BUY_ITEMS,
  MapId
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
  mapId?: MapId;
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
  const [armor, setArmor] = useState<number>(0);
  const [hasHelmet, setHasHelmet] = useState<boolean>(false);
  const [ammo, setAmmo] = useState<number>(12);
  const [reserveAmmo, setReserveAmmo] = useState<number>(36);
  const [weapon, setWeapon] = useState<WeaponType>('usp');
  const [primaryWeapon, setPrimaryWeapon] = useState<WeaponType | null>(null);
  const [secondaryWeapon, setSecondaryWeapon] = useState<WeaponType>('usp');
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [isScoped, setIsScoped] = useState<boolean>(false);
  const [scopeLevel, setScopeLevel] = useState<number>(0);
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
    playerPos: { x: number; y?: number; z: number; rotY: number };
    allies: { x: number; y?: number; z: number; name?: string; rotY?: number }[];
    enemies: { x: number; y?: number; z: number; rotY?: number }[];
    mapId?: MapId;
    obstacles?: any[];
    bombsites?: any[];
    activeSmokes?: any[];
  } | null>(null);
  const [roundStatus, setRoundStatus] = useState<{
    show: boolean;
    winner?: 'red' | 'blue' | 'draw';
    message: string;
    isMatchOver?: boolean;
  }>({ show: false, message: '', isMatchOver: false });

  // Grenades & Effects States
  const [heGrenades, setHeGrenades] = useState<number>(1);
  const [smokeGrenades, setSmokeGrenades] = useState<number>(1);
  const [inSmoke, setInSmoke] = useState<boolean>(false);
  const [targetWins, setTargetWins] = useState<number>(7);
  const [radioSubtitle, setRadioSubtitle] = useState<{ text: string; sender: string } | null>(null);
  const radioSubtitleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scoreboard Tab Key
  const [isScoreboardOpen, setIsScoreboardOpen] = useState<boolean>(false);

  // Economy Money State (CS:GO Currency: starts at $800, max $16000)
  const [money, setMoney] = useState<number>(800);
  const [moneyRewardNotice, setMoneyRewardNotice] = useState<{ amount: number; reason: string } | null>(null);
  const moneyNoticeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isGodMode, setIsGodMode] = useState<boolean>(false);

  // Tactical Buy Menu & Headshot visual feedback
  const [isBuyMenuOpen, setIsBuyMenuOpen] = useState<boolean>(false);
  const [headshotEffect, setHeadshotEffect] = useState<boolean>(false);
  const headshotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // In-Game Tactical Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Canvas container ref
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<FPSGameEngine | null>(null);

  // Helper to build local offline room state for "Chơi với máy"
  const createOfflineRoomState = (config: GameConfig, myId: string): RoomState => {
    const is1v1 = config.mode === '1v1';
    const myTeam = config.team;
    const oppTeam: Team = myTeam === 'red' ? 'blue' : 'red';
    const players: PlayerNetState[] = [
      {
        id: myId,
        name: config.playerName || 'Chiến Binh',
        roomCode: config.roomCode || 'BOT-MATCH',
        team: myTeam,
        slot: 0,
        isBot: false,
        x: 0,
        y: 1.6,
        z: 0,
        rotY: 0,
        pitch: 0,
        health: 100,
        kills: 0,
        deaths: 0,
        weapon: 'usp',
        isAlive: true,
        ping: 5,
        lastActive: Date.now()
      }
    ];

    if (!is1v1) {
      players.push({
        id: 'bot_ally_1',
        name: myTeam === 'red' ? 'Bot Bravo' : 'Bot Viper',
        roomCode: config.roomCode || 'BOT-MATCH',
        team: myTeam,
        slot: 1,
        isBot: true,
        x: 0,
        y: 1.6,
        z: 0,
        rotY: 0,
        pitch: 0,
        health: 100,
        kills: 0,
        deaths: 0,
        weapon: 'ak47',
        isAlive: true,
        ping: 0,
        lastActive: Date.now()
      });
    }

    // Enemy Bot 1
    players.push({
      id: 'bot_enemy_1',
      name: oppTeam === 'red' ? 'Bot Alpha' : 'Bot Ghost',
      roomCode: config.roomCode || 'BOT-MATCH',
      team: oppTeam,
      slot: 0,
      isBot: true,
      x: 0,
      y: 1.6,
      z: 0,
      rotY: 0,
      pitch: 0,
      health: 100,
      kills: 0,
      deaths: 0,
      weapon: 'usp',
      isAlive: true,
      ping: 0,
      lastActive: Date.now()
    });

    if (!is1v1) {
      players.push({
        id: 'bot_enemy_2',
        name: oppTeam === 'red' ? 'Bot Delta' : 'Bot Phantom',
        roomCode: config.roomCode || 'BOT-MATCH',
        team: oppTeam,
        slot: 1,
        isBot: true,
        x: 0,
        y: 1.6,
        z: 0,
        rotY: 0,
        pitch: 0,
        health: 100,
        kills: 0,
        deaths: 0,
        weapon: 'm4a1s',
        isAlive: true,
        ping: 0,
        lastActive: Date.now()
      });
    }

    return {
      code: config.roomCode || 'BOT-MATCH',
      hostId: myId,
      mode: config.mode,
      mapId: config.mapId || 'dust2',
      state: 'waiting',
      redScore: 0,
      blueScore: 0,
      round: 1,
      maxRounds: 10,
      targetWins: 7,
      roundTimeLeft: 90,
      players
    };
  };

  // Start game session from Lobby (enters Waiting Room according to user brief)
  const handleStartGame = (config: GameConfig) => {
    setChatMessages([]);
    setMoney(800);
    setIsGodMode(false);
    setGameConfig(config);

    if (config.isOnline) {
      setScreen('waiting');
    } else {
      // Build offline bot room and enter waiting room
      const offlineRoom = createOfflineRoomState(config, localPlayerId);
      setRoomState(offlineRoom);
      setScreen('waiting');
    }
  };

  // Connect to Waiting Room WebSocket (Online Multiplayer)
  useEffect(() => {
    if (screen !== 'waiting' || !gameConfig || !gameConfig.isOnline) return;

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
        mapId: gameConfig.mapId || 'dust2',
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
        } else if (msg.type === 'room_reset_to_waiting') {
          if (msg.room) setRoomState(msg.room);
          setRoundStatus({ show: false, message: '', isMatchOver: false });
          setIsScoreboardOpen(false);
          setScreen('waiting');
        } else if (msg.type === 'chat_message') {
          setChatMessages((prev) => [...prev.slice(-25), msg]);
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
    if (!gameConfig) return;
    if (!gameConfig.isOnline) {
      setScreen('playing');
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_match' }));
    }
  };

  const handleSwitchTeam = (newTeam: Team) => {
    if (!gameConfig) return;
    if (!gameConfig.isOnline) {
      const updatedConfig = { ...gameConfig, team: newTeam };
      setGameConfig(updatedConfig);
      setRoomState(createOfflineRoomState(updatedConfig, localPlayerId));
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'switch_team', team: newTeam }));
    }
  };

  const handleAddBot = (targetTeam: Team) => {
    if (!gameConfig) return;
    if (!gameConfig.isOnline) {
      setRoomState(prev => {
        if (!prev) return null;
        const maxPerTeam = prev.mode === '1v1' ? 1 : 2;
        const currentCount = prev.players.filter(p => p.team === targetTeam).length;
        if (currentCount >= maxPerTeam) return prev;
        const botNames = ['Bot Alpha', 'Bot Bravo', 'Bot Charlie', 'Bot Delta', 'Bot Echo', 'Bot Viper', 'Bot Ghost', 'Bot Phantom'];
        const existingNames = new Set(prev.players.map(p => p.name));
        const freeName = botNames.find(n => !existingNames.has(n)) || `Bot_${Math.floor(Math.random() * 90 + 10)}`;
        const newBot: PlayerNetState = {
          id: 'bot_' + Math.random().toString(36).substring(2, 7),
          name: freeName,
          roomCode: prev.code,
          team: targetTeam,
          slot: currentCount,
          isBot: true,
          x: 0,
          y: 1.6,
          z: 0,
          rotY: 0,
          pitch: 0,
          health: 100,
          kills: 0,
          deaths: 0,
          weapon: 'ak47',
          isAlive: true,
          ping: 0,
          lastActive: Date.now()
        };
        return {
          ...prev,
          players: [...prev.players, newBot]
        };
      });
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'add_bot', team: targetTeam }));
    }
  };

  const handleChangeMap = (newMapId: MapId) => {
    if (!gameConfig) return;
    setGameConfig(prev => prev ? ({ ...prev, mapId: newMapId }) : null);
    if (!gameConfig.isOnline) {
      setRoomState(prev => prev ? ({ ...prev, mapId: newMapId }) : null);
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'change_map', mapId: newMapId }));
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

  // Match Over Action Handlers (Chơi lại nếu bắn máy, Quay lại room đợi nếu online/bot, Quay lại menu chính)
  const handlePlayAgain = () => {
    if (engineRef.current) {
      engineRef.current.restartOfflineMatch();
    }
    setRedScore(0);
    setBlueScore(0);
    setRound(1);
    setTimeLeft(90);
    setMoney(800);
    setHealth(100);
    setArmor(0);
    setHasHelmet(false);
    setIsDead(false);
    setRoundStatus({ show: false, message: '', isMatchOver: false });
    setIsScoreboardOpen(false);
  };

  const handleReturnToWaitingRoom = () => {
    if (gameConfig?.isOnline) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'return_to_room' }));
      }
    } else {
      if (gameConfig) {
        setRoomState(createOfflineRoomState(gameConfig, localPlayerId));
      }
    }
    setRoundStatus({ show: false, message: '', isMatchOver: false });
    setIsScoreboardOpen(false);
    setScreen('waiting');
  };

  const handleReturnToMenu = () => {
    setRoundStatus({ show: false, message: '', isMatchOver: false });
    setIsScoreboardOpen(false);
    handleLeaveWaitingRoom();
  };

  // Tactical Buy Menu toggle handler
  const handleToggleBuyMenu = (forceOpen?: boolean) => {
    setIsBuyMenuOpen((prev) => {
      const next = typeof forceOpen === 'boolean' ? forceOpen : !prev;
      if (next) {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      } else {
        if (engineRef.current && screen === 'playing' && !isDead) {
          engineRef.current.requestLock();
        }
      }
      return next;
    });
  };

  // Buy weapon / armor / ammo handler (CS:GO Economy)
  const handleBuyItem = (itemId: string) => {
    const item = CS_BUY_ITEMS.find((it) => it.id === itemId);
    if (!item) return;

    if (money < item.price) {
      return;
    }

    let success = false;
    if (item.weaponId) {
      if (engineRef.current?.buyWeapon(item.weaponId)) {
        setWeapon(item.weaponId);
        sounds.playEquipSound();
        success = true;
      }
    } else if (itemId === 'kevlar') {
      if (engineRef.current?.buyArmor(false)) {
        setArmor(100);
        sounds.playCoinSound();
        success = true;
      }
    } else if (itemId === 'helmet') {
      if (engineRef.current?.buyArmor(true)) {
        setArmor(100);
        setHasHelmet(true);
        sounds.playCoinSound();
        success = true;
      }
    } else if (itemId === 'ammo_primary') {
      if (engineRef.current?.buyAmmo('primary')) {
        sounds.playCoinSound();
        success = true;
      }
    } else if (itemId === 'ammo_secondary') {
      if (engineRef.current?.buyAmmo('secondary')) {
        sounds.playCoinSound();
        success = true;
      }
    } else if (itemId === 'ammo_all' || itemId === 'ammo') {
      if (engineRef.current?.buyAmmo('all')) {
        sounds.playCoinSound();
        success = true;
      }
    }

    if (success) {
      setMoney((prev) => Math.max(0, prev - item.price));
    }
  };

  // Keyboard listeners: Tab for Scoreboard, B for Buy Menu, Esc for Settings / Close Buy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea';

      if (e.code === 'Tab') {
        e.preventDefault();
        setIsScoreboardOpen(true);
      }

      if (e.code === 'Escape' && screen === 'playing') {
        if (isBuyMenuOpen) {
          handleToggleBuyMenu(false);
        } else {
          setIsSettingsOpen((prev) => !prev);
        }
      }

      // Hotkey B to toggle Buy Menu when not typing in chat input
      if ((e.code === 'KeyB' || e.key === 'b' || e.key === 'B') && screen === 'playing' && !isInputFocused) {
        e.preventDefault();
        handleToggleBuyMenu();
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
  }, [screen, isBuyMenuOpen, isDead]);

  // Mount FPS Game Engine when in 'playing' screen
  useEffect(() => {
    if (screen !== 'playing' || !canvasContainerRef.current || !gameConfig) return;

    // Reset scores & HUD & clean fresh room session (CS:GO Round 1 Pistol Round)
    setHealth(100);
    setArmor(0);
    setHasHelmet(false);
    setAmmo(12);
    setReserveAmmo(36);
    setWeapon('usp');
    setPrimaryWeapon(null);
    setSecondaryWeapon('usp');
    setIsReloading(false);
    setIsScoped(false);
    setScopeLevel(0);
    setRedScore(0);
    setBlueScore(0);
    setRound(1);
    setTimeLeft(90);
    setIsDead(false);
    setKillFeed([]);
    setChatMessages([]);
    setMoney(800);
    setMoneyRewardNotice(null);
    setIsGodMode(false);
    setIsBuyMenuOpen(false);
    setHeadshotEffect(false);

    const engine = new FPSGameEngine(
      canvasContainerRef.current,
      {
        onHUDUpdate: (hud) => {
          setHealth(hud.health);
          setArmor(hud.armor);
          if (hud.hasHelmet !== undefined) setHasHelmet(hud.hasHelmet);
          setAmmo(hud.ammo);
          setReserveAmmo(hud.reserveAmmo);
          setWeapon(hud.weapon);
          if (hud.primaryWeapon !== undefined) setPrimaryWeapon(hud.primaryWeapon);
          if (hud.secondaryWeapon !== undefined) setSecondaryWeapon(hud.secondaryWeapon);
          setIsReloading(hud.isReloading);
          if (hud.isScoped !== undefined) setIsScoped(hud.isScoped);
          if (hud.scopeLevel !== undefined) setScopeLevel(hud.scopeLevel);
          setRedScore(hud.redScore);
          setBlueScore(hud.blueScore);
          setRound(hud.round);
          setTimeLeft(hud.timeLeft);
          setIsLocked(hud.isLocked);
          if (hud.hitMarker) {
            setHitMarker(true);
            setTimeout(() => setHitMarker(false), 90);
          }
          if (hud.headshotKill) {
            setHeadshotEffect(true);
            sounds.playHeadshot();
            if (headshotTimerRef.current) {
              clearTimeout(headshotTimerRef.current);
            }
            headshotTimerRef.current = setTimeout(() => {
              setHeadshotEffect(false);
            }, 1400);
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
        },
        onBuyMenuToggle: () => {
          handleToggleBuyMenu();
        },
        onMoneyReward: (amount, reason) => {
          setMoney((prev) => Math.min(16000, prev + amount));
          sounds.playCoinSound();
          setMoneyRewardNotice({ amount, reason });
          if (moneyNoticeTimerRef.current) {
            clearTimeout(moneyNoticeTimerRef.current);
          }
          moneyNoticeTimerRef.current = setTimeout(() => {
            setMoneyRewardNotice(null);
          }, 2200);
        }
      },
      {
        playerName: (gameConfig.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.name) || gameConfig.playerName,
        team: (gameConfig.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.team) || gameConfig.team,
        mode: (gameConfig.isOnline && roomState?.mode) || gameConfig.mode,
        mapId: roomState?.mapId || gameConfig.mapId || 'dust2',
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

    // Secret Cheat Command: /coin10000 to increase money by $10000
    if (
      trimmed.toLowerCase() === '/coin10000' ||
      trimmed.toLowerCase() === '/coin 10000' ||
      trimmed.toLowerCase().startsWith('/coin10000')
    ) {
      setMoney((prev) => Math.min(16000, prev + 10000));
      sounds.playCoinSound();
      return;
    }

    // Secret Cheat Command: /godmode - Infinite Ammo without reload
    if (trimmed.toLowerCase() === '/godmode') {
      const nextGodMode = !isGodMode;
      setIsGodMode(nextGodMode);
      if (engineRef.current) {
        engineRef.current.setGodMode(nextGodMode);
      }
      sounds.playCoinSound();
      return;
    }

    const myTeam = (gameConfig?.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.team) || gameConfig?.team || 'red';
    const myName = (gameConfig?.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.name) || gameConfig?.playerName || 'Bạn';

    // Chat in Waiting Room
    if (screen === 'waiting') {
      if (gameConfig?.isOnline) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'chat_message', text: trimmed }));
        }
      } else {
        // Local offline waiting room chat
        const userMsg: ChatMessage = {
          id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          senderId: localPlayerId,
          senderName: myName,
          team: myTeam,
          senderTeam: myTeam,
          channel: 'all',
          text: trimmed,
          timestamp: Date.now()
        };
        setChatMessages((prev) => [...prev, userMsg]);

        // Simulated Bot tactical responses in waiting room
        setTimeout(() => {
          const BOT_REPLIES = [
            'Rõ! Tôi sẽ hỗ trợ bạn kê góc súng ngắm AWP.',
            'Roger that, sẵn sàng tham chiến!',
            'Chiến thôi anh em, không lùi bước!',
            'Cứ để tôi bảo vệ bombsite!',
            'Đã sẵn sàng vũ khí, ném Smoke che đường nhé!'
          ];
          const botAlly = roomState?.players.find(p => p.isBot && p.team === myTeam);
          const botEnemy = roomState?.players.find(p => p.isBot && p.team !== myTeam);
          const responder = botAlly || botEnemy;
          if (responder) {
            const botMsg: ChatMessage = {
              id: 'chat_bot_' + Date.now(),
              senderId: responder.id,
              senderName: responder.name,
              team: responder.team,
              senderTeam: responder.team,
              channel: 'all',
              text: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
              timestamp: Date.now()
            };
            setChatMessages((prev) => [...prev, botMsg]);
          }
        }, 450);
      }
      return;
    }

    // In-Game Chat
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
    setIsBuyMenuOpen(false);
    setHeadshotEffect(false);
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
          roomCode={gameConfig.roomCode || (gameConfig.isOnline ? '' : 'BOT-MATCH')}
          mode={roomState?.mode || gameConfig.mode}
          mapId={roomState?.mapId || gameConfig.mapId || 'dust2'}
          isOnline={gameConfig.isOnline}
          botDifficulty={gameConfig.botDifficulty}
          isConnecting={isConnectingWs}
          errorMsg={wsError}
          chatMessages={chatMessages}
          onSendChatMessage={handleSendChatMessage}
          onStartGame={handleHostStartMatch}
          onLeaveRoom={handleLeaveWaitingRoom}
          onSwitchTeam={handleSwitchTeam}
          onAddBot={handleAddBot}
          onChangeMap={handleChangeMap}
        />
      )}

      {screen === 'playing' && (
        <div className={`relative w-full h-full transition-transform duration-75 ${headshotEffect ? 'animate-headshot-shake' : ''}`}>
          {/* 3D WebGL Canvas Container */}
          <div ref={canvasContainerRef} className="w-full h-full cursor-crosshair" />

          {/* Retro Classic FPS HUD */}
          <HUD
            health={health}
            armor={armor}
            hasHelmet={hasHelmet}
            ammo={ammo}
            reserveAmmo={reserveAmmo}
            weapon={weapon}
            primaryWeapon={primaryWeapon}
            secondaryWeapon={secondaryWeapon}
            isReloading={isReloading}
            isScoped={isScoped}
            scopeLevel={scopeLevel}
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
            moneyRewardNotice={moneyRewardNotice}
            chatMessages={chatMessages}
            onSendChatMessage={handleSendChatMessage}
            localPlayerTeam={(gameConfig?.isOnline && roomState?.players.find(p => p.id === localPlayerId)?.team) || gameConfig?.team || 'red'}
            onChatFocus={handleChatFocus}
            isGodMode={isGodMode}
            isBuyMenuOpen={isBuyMenuOpen}
            onToggleBuyMenu={() => handleToggleBuyMenu()}
            onBuyItem={handleBuyItem}
            headshotEffect={headshotEffect}
          />

          {/* Scoreboard (Tab overlay & Match Over victory screen) */}
          <Scoreboard
            isOpen={isScoreboardOpen}
            isMatchOver={roundStatus.isMatchOver}
            winner={roundStatus.winner}
            matchEndMessage={roundStatus.message}
            isOnline={gameConfig?.isOnline}
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
                : engineRef.current?.botManager.getAllBots().map((b) => ({
                    id: b.id,
                    name: b.name,
                    team: b.team,
                    kills: b.kills,
                    deaths: b.deaths,
                    health: b.health,
                    isBot: true
                  })) || []
            }
            onPlayAgain={handlePlayAgain}
            onReturnToWaitingRoom={handleReturnToWaitingRoom}
            onReturnToMenu={handleReturnToMenu}
          />

          {/* Quick Pause / Exit Button top left */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-3 left-36 z-40 bg-black/60 hover:bg-black/90 text-neutral-400 hover:text-white px-2.5 py-1 text-[11px] rounded border border-neutral-700 pointer-events-auto transition-colors font-mono cursor-pointer"
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
        onQuitMatch={screen === 'playing' ? handleQuitToLobby : undefined}
      />
    </div>
  );
}
