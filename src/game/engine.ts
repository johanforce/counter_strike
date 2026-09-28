import * as THREE from 'three';
import {
  WeaponType,
  Team,
  GameMode,
  KillFeedEvent,
  GameSettings,
  WEAPONS,
  ChatMessage
} from '../types/game';
import { textures } from './textures';
import {
  createFirstPersonUSP,
  createFirstPersonPistol,
  createFirstPersonMP9,
  createFirstPersonXM1014,
  createFirstPersonAK47,
  createFirstPersonM4A1S,
  createFirstPersonAWP,
  createFirstPersonKnife,
  createPlayerMesh
} from './models';
import { buildClassicMap, MapData } from './map';
import { sounds } from './audio';
import { BotManager, BotInstance } from './ai';

export interface GameEngineCallbacks {
  onHUDUpdate: (data: {
    health: number;
    armor: number;
    hasHelmet?: boolean;
    ammo: number;
    reserveAmmo: number;
    weapon: WeaponType;
    primaryWeapon?: WeaponType | null;
    secondaryWeapon?: WeaponType;
    scopeZoom?: number;
    isScoped?: boolean;
    scopeLevel?: number;
    isReloading: boolean;
    redScore: number;
    blueScore: number;
    round: number;
    timeLeft: number;
    isLocked: boolean;
    hitMarker: boolean;
    isDead: boolean;
    respawnTimer: number;
    headshotKill?: boolean;
  }) => void;
  onKillFeed: (event: KillFeedEvent) => void;
  onRadarUpdate: (data: {
    playerPos: { x: number; y: number; z: number; rotY: number };
    allies: { x: number; y: number; z: number; name?: string; rotY?: number }[];
    enemies: { x: number; y: number; z: number; rotY?: number }[];
  }) => void;
  onRoundStatus: (status: {
    show: boolean;
    winner?: 'red' | 'blue' | 'draw';
    message: string;
  }) => void;
  onConnectionChange: (connected: boolean) => void;
  onRoomUpdate?: (room: any) => void;
  onChatMessage?: (msg: ChatMessage) => void;
  onBuyMenuToggle?: () => void;
  onMoneyReward?: (amount: number, reason: string) => void;
}

export class FPSGameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private settings: GameSettings;

  // Three.js Core
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mapData: MapData;

  // Player State & CS:GO Loadout Slots
  public localPlayerId: string;
  public playerName: string;
  public team: Team;
  public mode: GameMode;
  public health: number = 100;
  public armor: number = 0;
  public hasHelmet: boolean = false;
  public isAlive: boolean = true;
  public respawnTimer: number = 0;
  public primaryWeapon: WeaponType | null = null; // Slot 1: Empty in Round 1 (Pistol Round)
  public secondaryWeapon: WeaponType = 'usp'; // Slot 2: Default USP-S / Glock
  public currentWeapon: WeaponType = 'usp';
  public scopeZoom: number = 0;
  public scopeLevel: number = 0; // 0: normal, 1: zoom 1x, 2: sniper zoom 2x
  private baseFov: number = 75;
  public ammoState: Record<WeaponType, { mag: number; reserve: number }> = {
    usp: { mag: 12, reserve: 36 },
    pistol: { mag: 7, reserve: 35 },
    mp9: { mag: 30, reserve: 120 },
    xm1014: { mag: 7, reserve: 32 },
    ak47: { mag: 30, reserve: 90 },
    m4a1s: { mag: 25, reserve: 75 },
    awp: { mag: 10, reserve: 30 },
    knife: { mag: 1, reserve: 0 }
  };
  public isReloading: boolean = false;
  public reloadEndTime: number = 0;
  public isGodMode: boolean = false;

  // First-person viewmodels
  private fpCameraRig: THREE.Group;
  private uspRig: ReturnType<typeof createFirstPersonUSP>;
  private pistolRig: ReturnType<typeof createFirstPersonPistol>;
  private mp9Rig: ReturnType<typeof createFirstPersonMP9>;
  private xm1014Rig: ReturnType<typeof createFirstPersonXM1014>;
  private ak47Rig: ReturnType<typeof createFirstPersonAK47>;
  private m4a1sRig: ReturnType<typeof createFirstPersonM4A1S>;
  private awpRig: ReturnType<typeof createFirstPersonAWP>;
  private knifeRig: ReturnType<typeof createFirstPersonKnife>;
  private muzzleFlashGroup: THREE.Group;
  private muzzleFlashSprite: THREE.Sprite;
  private muzzleFlashLight: THREE.PointLight;
  private gunKickZ: number = 0;
  private gunKickRotX: number = 0;

  // Knife Combat Visuals
  private knifeSwingTime: number = 0;
  private knifeSwingType: 'slash' | 'stab' = 'slash';

  // Movement & Camera Controls
  private playerPos = new THREE.Vector3(-28, 1.6, -28);
  private playerVelocity = new THREE.Vector3();
  private yaw: number = 0;
  private pitch: number = 0;
  private cameraRoll: number = 0;
  private currentEyeHeight: number = 1.6;
  private isGrounded: boolean = false;
  private isCrouching: boolean = false;
  private isWalking: boolean = false;
  private jumpBufferTimer: number = 0;
  private isPointerLocked: boolean = false;

  // Input states (Robust multi-keyboard & IME support)
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private isMouseDown: boolean = false;
  private isFiring: boolean = false;
  private lastFireTime: number = 0;
  private stepTimer: number = 0;
  private bobTimer: number = 0;
  private recoilPitch: number = 0;
  private recoilYaw: number = 0;

  // Bot Manager
  public botManager: BotManager;

  // Remote Players (Multiplayer)
  private remotePlayers: Map<string, {
    meshData: ReturnType<typeof createPlayerMesh>;
    position: THREE.Vector3;
    targetPos: THREE.Vector3;
    rotY: number;
    team: Team;
    name: string;
    health: number;
    weapon: WeaponType;
  }> = new Map();

  // Decals & Effects
  private bulletTracers: { obj: THREE.Object3D; expire: number }[] = [];
  private bulletDecals: THREE.Mesh[] = [];
  private knifeScratchDecals: THREE.Mesh[] = [];
  private particles: { mesh: THREE.Points; velocities: THREE.Vector3[]; expire: number }[] = [];
  private screenShakeAmount: number = 0;
  private screenShakeTrauma: number = 0;

  // Match State
  private redScore: number = 0;
  private blueScore: number = 0;
  private currentRound: number = 1;
  private roundTimeLeft: number = 90;
  private roundEnded: boolean = false;

  // Network WebSocket
  private ws: WebSocket | null = null;
  private lastNetSend: number = 0;
  private lastBotNetSend: number = 0;
  private isOnlineMode: boolean = false;
  private roomCode: string = '';
  public isHost: boolean = false;
  public slot: number = 0;
  private cachedPlayers: Map<string, { name: string; team: Team; isBot: boolean }> = new Map();

  // Animation Loop
  private animFrameId: number = 0;
  private clock = new THREE.Clock();
  private disposed: boolean = false;

  constructor(
    container: HTMLElement,
    callbacks: GameEngineCallbacks,
    options: {
      playerName: string;
      team: Team;
      mode: GameMode;
      isOnline: boolean;
      roomCode?: string;
      settings: GameSettings;
      botDifficulty?: 'easy' | 'normal' | 'hard';
      existingWs?: WebSocket;
      localPlayerId?: string;
      initialRoomState?: any;
      isHost?: boolean;
    }
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.settings = options.settings;
    this.playerName = options.playerName;
    this.team = options.team;
    this.mode = options.mode;
    this.isOnlineMode = options.isOnline;
    this.isHost = !!options.isHost;
    this.roomCode = options.roomCode || 'SOLO_' + Math.random().toString(36).substring(2, 6).toUpperCase();
    this.localPlayerId = options.localPlayerId || ('player_' + Math.random().toString(36).substring(2, 9));

    // Cache initial room players if available
    if (options.initialRoomState?.players) {
      options.initialRoomState.players.forEach((p: any) => {
        this.cachedPlayers.set(p.id, { name: p.name, team: p.team, isBot: !!p.isBot });
      });

      // Synchronize authoritative local player team & slot from room state
      const me = options.initialRoomState.players.find((p: any) => p.id === this.localPlayerId);
      if (me) {
        this.team = me.team;
        this.slot = me.slot || 0;
      }
    }

    // 1. Scene & Renderer
    this.baseFov = this.settings.fov || 75;
    const initWidth = container.clientWidth || window.innerWidth || 1280;
    const initHeight = container.clientHeight || window.innerHeight || 720;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x9a8365, 0.008);

    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      initWidth / initHeight,
      0.05,
      400
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(initWidth, initHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 2. Skybox & Environment Lighting
    const skyDome = textures.createSkyDome();
    this.scene.add(skyDome);

    const hemiLight = new THREE.HemisphereLight(0xbfe3ff, 0x8a7050, 0.6);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    sunLight.shadow.camera.left = -45;
    sunLight.shadow.camera.right = 45;
    sunLight.shadow.camera.top = 45;
    sunLight.shadow.camera.bottom = -45;
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x555045, 0.4);
    this.scene.add(ambientLight);

    // 3. Build Classic Map (de_dust_classic)
    this.mapData = buildClassicMap();
    this.scene.add(this.mapData.sceneGroup);

    // Set initial spawn
    const spawnList = this.mapData.spawns[this.team];
    const mySpawn = spawnList[this.slot % spawnList.length] || spawnList[0];
    this.playerPos.set(mySpawn.x, mySpawn.y, mySpawn.z);
    this.yaw = mySpawn.rotY;

    // 4. First-Person Viewmodels Rig attached to Camera
    this.fpCameraRig = new THREE.Group();
    this.camera.add(this.fpCameraRig);
    this.scene.add(this.camera);

    this.uspRig = createFirstPersonUSP();
    this.uspRig.group.position.set(0.20, -0.19, -0.38);
    this.uspRig.group.rotation.set(0.012, -0.012, 0);
    this.uspRig.group.visible = false;
    this.fpCameraRig.add(this.uspRig.group);

    this.pistolRig = createFirstPersonPistol();
    this.pistolRig.group.position.set(0.20, -0.19, -0.38);
    this.pistolRig.group.rotation.set(0.012, -0.012, 0);
    this.pistolRig.group.visible = false;
    this.fpCameraRig.add(this.pistolRig.group);

    this.mp9Rig = createFirstPersonMP9();
    this.mp9Rig.group.position.set(0.21, -0.20, -0.40);
    this.mp9Rig.group.rotation.set(0.01, -0.012, 0);
    this.mp9Rig.group.visible = false;
    this.fpCameraRig.add(this.mp9Rig.group);

    this.xm1014Rig = createFirstPersonXM1014();
    this.xm1014Rig.group.position.set(0.22, -0.21, -0.42);
    this.xm1014Rig.group.rotation.set(0.01, -0.012, 0);
    this.xm1014Rig.group.visible = false;
    this.fpCameraRig.add(this.xm1014Rig.group);

    this.ak47Rig = createFirstPersonAK47();
    this.ak47Rig.group.position.set(0.22, -0.21, -0.42);
    this.ak47Rig.group.rotation.set(0.01, -0.012, 0);
    this.ak47Rig.group.visible = false;
    this.fpCameraRig.add(this.ak47Rig.group);

    this.m4a1sRig = createFirstPersonM4A1S();
    this.m4a1sRig.group.position.set(0.22, -0.21, -0.42);
    this.m4a1sRig.group.rotation.set(0.01, -0.012, 0);
    this.m4a1sRig.group.visible = false;
    this.fpCameraRig.add(this.m4a1sRig.group);

    this.awpRig = createFirstPersonAWP();
    this.awpRig.group.position.set(0.22, -0.20, -0.42);
    this.awpRig.group.rotation.set(0.01, -0.012, 0);
    this.awpRig.group.visible = false;
    this.fpCameraRig.add(this.awpRig.group);

    this.knifeRig = createFirstPersonKnife();
    this.knifeRig.group.position.set(0.24, -0.23, -0.40);
    this.knifeRig.group.visible = false;
    this.fpCameraRig.add(this.knifeRig.group);

    // Muzzle Flash Group - attached directly to the active gun's muzzlePoint!
    this.muzzleFlashGroup = new THREE.Group();
    const flashTex = textures.getMuzzleFlashSprite();
    const flashMat = new THREE.SpriteMaterial({
      map: flashTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    this.muzzleFlashSprite = new THREE.Sprite(flashMat);
    this.muzzleFlashSprite.scale.set(0.32, 0.32, 0.32);
    this.muzzleFlashGroup.add(this.muzzleFlashSprite);

    this.muzzleFlashLight = new THREE.PointLight(0xffaa22, 0, 8);
    this.muzzleFlashGroup.add(this.muzzleFlashLight);
    this.muzzleFlashGroup.visible = false;

    // Attach muzzle flash to default starter USP-S pistol
    this.uspRig.muzzlePoint.add(this.muzzleFlashGroup);

    // Start Round 1 with CS:GO Starter Pistol (USP-S)
    this.setWeapon('usp', true);

    // 5. Bot Manager for Solo and Filling Teams
    this.botManager = new BotManager(
      this.scene,
      this.mapData.patrolPoints,
      this.mapData.colliders,
      (bot, origin, dir) => this.handleBotShoot(bot, origin, dir),
      (bot, victimId, isHeadshot) => this.handleBotKill(bot, victimId, isHeadshot)
    );

    // Populate Bots & Remote Players
    if (!this.isOnlineMode) {
      this.setupOfflineMatch(options.botDifficulty || 'normal');
    } else {
      // 1. If we are host, add all bots in room to botManager to simulate them
      if (this.isHost && options.initialRoomState?.players) {
        options.initialRoomState.players.forEach((p: any) => {
          if (p.isBot) {
            const botSpawn = { x: p.x, y: p.y, z: p.z, rotY: p.rotY };
            this.botManager.addBot(p.id, p.name, p.team, botSpawn, options.botDifficulty || 'normal');
          }
        });
      }

      // 2. Add all existing remote players into remotePlayers map
      if (options.initialRoomState?.players) {
        options.initialRoomState.players.forEach((p: any) => {
          if (p.id !== this.localPlayerId) {
            // Only add if not a bot already managed locally by host
            if (!(this.isHost && p.isBot)) {
              this.upsertRemotePlayer(p);
            }
          }
        });
      }

      if (options.existingWs) {
        this.ws = options.existingWs;
        this.attachWebSocketListeners();
      } else {
        this.initWebSocket();
      }
    }

    // 6. Listeners & Events
    this.setupInputs();

    // Sound intro
    sounds.playRoundStart();

    // Start Main Game Loop
    this.loop();
  }

  public setupOfflineMatch(difficulty: 'easy' | 'normal' | 'hard') {
    this.botManager.clearAll();

    const enemyTeam = this.team === 'red' ? 'blue' : 'red';

    if (this.mode === '1v1') {
      // 1 enemy bot
      const spawn = this.mapData.spawns[enemyTeam][0];
      const botNames = ['Shadow', 'Viper', 'Ghost', 'Raptor'];
      const name = botNames[Math.floor(Math.random() * botNames.length)] + ' [BOT]';
      this.botManager.addBot('bot_1', name, enemyTeam, spawn, difficulty);
    } else {
      // 2v2: 1 ally bot + 2 enemy bots
      const allySpawn = this.mapData.spawns[this.team][1];
      this.botManager.addBot('bot_ally', 'Đồng Đội [BOT]', this.team, allySpawn, difficulty);

      const enemySpawns = this.mapData.spawns[enemyTeam];
      this.botManager.addBot('bot_enemy_1', 'Đối Thủ Alpha [BOT]', enemyTeam, enemySpawns[0], difficulty);
      this.botManager.addBot('bot_enemy_2', 'Đối Thủ Bravo [BOT]', enemyTeam, enemySpawns[1], difficulty);
    }
  }

  private attachWebSocketListeners() {
    if (!this.ws) return;
    this.callbacks.onConnectionChange(true);

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleNetworkMessage(msg);
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };

    this.ws.onclose = () => {
      this.callbacks.onConnectionChange(false);
    };

    this.ws.onerror = (err) => {
      console.warn('[WS] Error:', err);
    };

    // Request immediate room snapshot and broadcast initial spawn position
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'request_sync' }));
      this.ws.send(JSON.stringify({
        type: 'player_move',
        x: this.playerPos.x,
        y: this.playerPos.y,
        z: this.playerPos.z,
        rotY: this.yaw,
        pitch: this.pitch,
        weapon: this.currentWeapon
      }));
    }
  }

  private initWebSocket() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.attachWebSocketListeners();
        this.ws?.send(JSON.stringify({
          type: 'join_room',
          roomCode: this.roomCode,
          playerName: this.playerName,
          team: this.team,
          mode: this.mode,
          playerId: this.localPlayerId
        }));
      };

      this.ws.onclose = () => {
        this.callbacks.onConnectionChange(false);
      };

      this.ws.onerror = (err) => {
        console.warn('[WS] Error:', err);
      };
    } catch (e) {
      console.warn('[WS] Connection failed, falling back to local simulation:', e);
    }
  }

  private handleNetworkMessage(msg: {
    type: string;
    player?: any;
    room?: any;
    id?: string;
    playerId?: string;
    team?: Team;
    name?: string;
    x?: number;
    y?: number;
    z?: number;
    rotY?: number;
    pitch?: number;
    weapon?: WeaponType;
    shooterId?: string;
    origin?: { x: number; y: number; z: number };
    direction?: { x: number; y: number; z: number };
    damage?: number;
    targetId?: string;
    attackerId?: string;
    isHeadshot?: boolean;
    killerId?: string;
    killerName?: string;
    killerTeam?: Team;
    victimId?: string;
    victimName?: string;
    victimTeam?: Team;
    winner?: Team | 'draw';
    reason?: string;
  }) {
    if (msg.type === 'room_sync' || msg.type === 'joined_room' || msg.type === 'player_joined' || msg.type === 'player_updated') {
      if (msg.room) {
        this.callbacks.onRoomUpdate?.(msg.room);
        this.redScore = msg.room.redScore;
        this.blueScore = msg.room.blueScore;
        this.currentRound = msg.room.round;
        this.roundTimeLeft = msg.room.roundTimeLeft;

        // Check if we became room host
        if (msg.room.hostId === this.localPlayerId) {
          this.isHost = true;
        }

        msg.room.players.forEach((p: any) => {
          this.cachedPlayers.set(p.id, { name: p.name, team: p.team, isBot: !!p.isBot });

          if (p.id === this.localPlayerId) {
            this.team = p.team;
          } else if (this.isHost && p.isBot) {
            // Host actively simulates this bot
            if (!this.botManager.getBot(p.id)) {
              this.botManager.addBot(p.id, p.name, p.team, { x: p.x, y: p.y, z: p.z, rotY: p.rotY }, 'normal');
            }
          } else {
            this.upsertRemotePlayer(p);
          }
        });
      }
    } else if (msg.type === 'player_moved' && msg.id && msg.id !== this.localPlayerId) {
      if (this.isHost && this.botManager.getBot(msg.id)) {
        return; // Host already controls this bot
      }

      let rp = this.remotePlayers.get(msg.id);
      if (!rp) {
        // Auto-instantiate remote player if not present yet
        const cached = this.cachedPlayers.get(msg.id);
        const pTeam = cached?.team || (msg.team as Team) || (this.team === 'red' ? 'blue' : 'red');
        const pName = cached?.name || (msg.name as string) || 'Chiến Binh';
        this.upsertRemotePlayer({
          id: msg.id,
          team: pTeam,
          name: pName,
          x: msg.x ?? 0,
          y: msg.y ?? 1.6,
          z: msg.z ?? 0,
          rotY: msg.rotY ?? 0,
          health: 100,
          weapon: msg.weapon || 'ak47'
        });
        rp = this.remotePlayers.get(msg.id);
      }

      if (rp) {
        rp.targetPos.set(msg.x ?? rp.targetPos.x, (msg.y ?? 1.6) - 1.6, msg.z ?? rp.targetPos.z);
        if (msg.rotY !== undefined) rp.rotY = msg.rotY;
        if (msg.weapon && msg.weapon !== rp.weapon) {
          rp.weapon = msg.weapon;
          rp.meshData.updateWeapon(rp.weapon);
        }
      }
    } else if (msg.type === 'player_shot' && msg.shooterId && msg.shooterId !== this.localPlayerId) {
      sounds.playWeaponShot(msg.weapon || 'ak47');

      if (msg.weapon !== 'knife' && msg.origin && msg.direction) {
        const from = new THREE.Vector3(msg.origin.x, msg.origin.y, msg.origin.z);
        const dir = new THREE.Vector3(msg.direction.x, msg.direction.y, msg.direction.z);
        const to = from.clone().add(dir.clone().multiplyScalar(40));
        this.createBulletTracer(from, to, 40);
      }
    } else if (msg.type === 'player_damaged') {
      if (msg.targetId === this.localPlayerId) {
        this.takeDamage(msg.damage || 25, !!msg.isHeadshot, 'Đối thủ');
      } else if (this.isHost && msg.targetId && this.botManager.getBot(msg.targetId)) {
        const bot = this.botManager.getBot(msg.targetId)!;
        bot.health = Math.max(0, bot.health - (msg.damage || 25));
        bot.meshData.updateHealthTag(bot.health);
        if (bot.health <= 0) {
          bot.isAlive = false;
          bot.meshData.mesh.visible = false;
        }
      } else {
        const rp = this.remotePlayers.get(msg.targetId || '');
        if (rp) {
          rp.health = msg.damage !== undefined ? Math.max(0, rp.health - msg.damage) : 0;
          rp.meshData.updateHealthTag(rp.health);
          if (rp.health <= 0) {
            rp.meshData.mesh.visible = false;
          }
        }
      }
    } else if (msg.type === 'player_killed') {
      if (msg.killerId === this.localPlayerId) {
        const killWeapon = (msg.weapon as WeaponType) || this.currentWeapon;
        const reward = WEAPONS[killWeapon]?.killReward || 300;
        this.callbacks.onMoneyReward?.(reward, `Hạ gục (${WEAPONS[killWeapon]?.name || 'Vũ khí'})`);

        if (msg.isHeadshot) {
          this.triggerHeadshotFeedback();
          this.callbacks.onHUDUpdate({
            health: this.health,
            armor: this.armor,
            hasHelmet: this.hasHelmet,
            ammo: this.ammoState[this.currentWeapon].mag,
            reserveAmmo: this.ammoState[this.currentWeapon].reserve,
            weapon: this.currentWeapon,
            primaryWeapon: this.primaryWeapon,
            secondaryWeapon: this.secondaryWeapon,
            isReloading: this.isReloading,
            isScoped: this.scopeLevel > 0,
            scopeLevel: this.scopeLevel,
            redScore: this.redScore,
            blueScore: this.blueScore,
            round: this.currentRound,
            timeLeft: this.roundTimeLeft,
            isLocked: this.isPointerLocked,
            hitMarker: true,
            isDead: !this.isAlive,
            respawnTimer: this.respawnTimer,
            headshotKill: true
          });
        }
      }

      this.callbacks.onKillFeed({
        id: 'kf_' + Math.random(),
        killerName: msg.killerName || 'Vô danh',
        killerTeam: msg.killerTeam || 'red',
        victimName: msg.victimName || 'Vô danh',
        victimTeam: msg.victimTeam || 'blue',
        weapon: msg.weapon || 'ak47',
        isHeadshot: !!msg.isHeadshot,
        timestamp: Date.now()
      });

      if (msg.victimId === this.localPlayerId) {
        this.handlePlayerDeath(msg.killerName || 'Đối thủ');
      } else if (this.isHost && msg.victimId && this.botManager.getBot(msg.victimId)) {
        const bot = this.botManager.getBot(msg.victimId)!;
        bot.health = 0;
        bot.isAlive = false;
        bot.meshData.updateHealthTag(0);
        bot.meshData.mesh.visible = false;
      } else {
        const rp = this.remotePlayers.get(msg.victimId || '');
        if (rp) {
          rp.health = 0;
          rp.meshData.updateHealthTag(0);
          rp.meshData.mesh.visible = false;
        }
      }
    } else if (msg.type === 'round_started') {
      this.roundEnded = false;
      if (msg.room) {
        this.callbacks.onRoomUpdate?.(msg.room);
        this.redScore = msg.room.redScore;
        this.blueScore = msg.room.blueScore;
        this.currentRound = msg.room.round;
        this.roundTimeLeft = msg.room.roundTimeLeft;
      }

      this.respawnLocalPlayer();

      if (msg.room) {
        msg.room.players.forEach((p: any) => {
          if (p.id !== this.localPlayerId) {
            if (this.isHost && p.isBot) {
              const b = this.botManager.getBot(p.id);
              if (b) {
                this.botManager.respawnBot(b, { x: p.x, y: p.y, z: p.z, rotY: p.rotY }, this.currentRound);
              }
            } else {
              this.upsertRemotePlayer(p);
              const rp = this.remotePlayers.get(p.id);
              if (rp) {
                rp.health = 100;
                rp.meshData.mesh.visible = true;
                rp.meshData.updateHealthTag(100);
                rp.position.set(p.x, p.y - 1.6, p.z);
                rp.targetPos.set(p.x, p.y - 1.6, p.z);
              }
            }
          }
        });
      }

      this.callbacks.onRoundStatus({ show: false, message: '' });
      sounds.playRoundStart();
    } else if (msg.type === 'round_ended') {
      this.roundEnded = true;
      const won = msg.winner === this.team;
      if (won) {
        sounds.playWinSound();
        this.callbacks.onMoneyReward?.(3250, 'Thắng hiệp đấu');
      } else if (msg.winner === 'draw') {
        sounds.playDefeatSound();
        this.callbacks.onMoneyReward?.(1500, 'Hòa hiệp đấu');
      } else {
        sounds.playDefeatSound();
        this.callbacks.onMoneyReward?.(1900, 'Trợ cấp thua hiệp');
      }

      this.callbacks.onRoundStatus({
        show: true,
        winner: msg.winner,
        message: msg.reason || (won ? 'CHIẾN THẮNG!' : 'THẤT BẠI!')
      });
    } else if (msg.type === 'player_left' && msg.playerId) {
      const rp = this.remotePlayers.get(msg.playerId);
      if (rp) {
        this.scene.remove(rp.meshData.mesh);
        this.remotePlayers.delete(msg.playerId);
      }
      this.cachedPlayers.delete(msg.playerId);
    } else if (msg.type === 'chat_message') {
      const chatMsg: ChatMessage = {
        id: (msg as any).id || ('chat_' + Date.now()),
        senderId: (msg as any).senderId || '',
        senderName: (msg as any).senderName || 'Người chơi',
        team: (msg as any).team || 'red',
        channel: (msg as any).channel || 'team',
        text: (msg as any).text || '',
        timestamp: (msg as any).timestamp || Date.now()
      };
      this.callbacks.onChatMessage?.(chatMsg);
      sounds.playRadioChatSound();
    }
  }

  private upsertRemotePlayer(p: any) {
    let rp = this.remotePlayers.get(p.id);
    if (!rp) {
      const meshData = createPlayerMesh(p.team, p.name);
      // Tag hitboxes with playerId and remote status for bullet raycasts
      meshData.headMesh.userData = { hitbox: 'head', playerId: p.id, isRemote: true };
      meshData.bodyMesh.userData = { hitbox: 'body', playerId: p.id, isRemote: true };
      meshData.legsMesh.children.forEach(l => {
        l.userData = { hitbox: 'legs', playerId: p.id, isRemote: true };
      });

      this.scene.add(meshData.mesh);
      rp = {
        meshData,
        position: new THREE.Vector3(p.x ?? 0, (p.y ?? 1.6) - 1.6, p.z ?? 0),
        targetPos: new THREE.Vector3(p.x ?? 0, (p.y ?? 1.6) - 1.6, p.z ?? 0),
        rotY: p.rotY ?? 0,
        team: p.team,
        name: p.name,
        health: p.health ?? 100,
        weapon: p.weapon || 'usp'
      };
      this.remotePlayers.set(p.id, rp);
    }

    rp.targetPos.set(p.x ?? rp.targetPos.x, (p.y ?? 1.6) - 1.6, p.z ?? rp.targetPos.z);
    if (p.rotY !== undefined) rp.rotY = p.rotY;
    if (p.health !== undefined) {
      rp.health = p.health;
      rp.meshData.updateHealthTag(p.health);
      rp.meshData.mesh.visible = p.health > 0;
    }
    if (p.weapon) {
      rp.weapon = p.weapon;
      rp.meshData.updateWeapon(p.weapon);
    }
  }

  // Helper to check if an interactive input (chat, text input, modal) has focus
  public isInputFocused(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
  }

  // Clear all player movement and action keys immediately
  public clearMovementState() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isWalking = false;
    this.isCrouching = false;
    this.isFiring = false;
    this.isMouseDown = false;
  }

  public getOwnedSlotOrder(): WeaponType[] {
    const slots: WeaponType[] = [];
    if (this.primaryWeapon) slots.push(this.primaryWeapon);
    slots.push(this.secondaryWeapon);
    slots.push('knife');
    return slots;
  }

  public setScopeLevel(level: number) {
    this.scopeLevel = level;
    this.scopeZoom = level;
    const defaultFov = this.baseFov || this.settings?.fov || 75;
    if (level === 0) {
      this.camera.fov = defaultFov;
    } else if (this.currentWeapon === 'awp') {
      this.camera.fov = level === 1 ? 32 : 12;
    } else if (this.currentWeapon === 'm4a1s') {
      this.camera.fov = 50;
    } else {
      this.camera.fov = defaultFov;
    }
    this.camera.updateProjectionMatrix();
  }

  // Setup Key and Mouse Listeners (Supporting Vietnamese keyboard/IME layouts, EVKey/Unikey & sticky prevention)
  private setupInputs() {
    // Robust key matching (Physical codes + key codes + full Vietnamese character sets)
    const isForward = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.keyCode === 87 || e.keyCode === 38) return true;
      const k = e.key ? e.key.toLowerCase() : '';
      return ['w', 'ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'].includes(k);
    };

    const isBackward = (e: KeyboardEvent) => {
      if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.keyCode === 83 || e.keyCode === 40) return true;
      const k = e.key ? e.key.toLowerCase() : '';
      return k === 's';
    };

    const isLeft = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.keyCode === 65 || e.keyCode === 37) return true;
      const k = e.key ? e.key.toLowerCase() : '';
      return ['a', 'â', 'ă', 'á', 'à', 'ả', 'ã', 'ạ', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'].includes(k);
    };

    const isRight = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.keyCode === 68 || e.keyCode === 39) return true;
      const k = e.key ? e.key.toLowerCase() : '';
      return ['d', 'đ'].includes(k);
    };

    const isWalk = (e: KeyboardEvent) => {
      return e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.keyCode === 16 || e.shiftKey;
    };

    const isCrouch = (e: KeyboardEvent) => {
      if (e.code === 'KeyC' || e.code === 'ControlLeft' || e.code === 'ControlRight' || e.keyCode === 67 || e.keyCode === 17) return true;
      const k = e.key ? e.key.toLowerCase() : '';
      return k === 'c';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // If typing in chat or another input, cancel any movement and do not intercept
      if (this.isInputFocused()) {
        this.clearMovementState();
        return;
      }

      if (isForward(e)) { this.moveForward = true; }
      if (isBackward(e)) { this.moveBackward = true; }
      if (isLeft(e)) { this.moveLeft = true; }
      if (isRight(e)) { this.moveRight = true; }

      // Weapon slots (1: Primary Gun, 2: Secondary Pistol, 3: Knife)
      if (e.code === 'Digit1' || e.key === '1') {
        if (this.primaryWeapon) this.setWeapon(this.primaryWeapon);
      }
      if (e.code === 'Digit2' || e.key === '2') {
        this.setWeapon(this.secondaryWeapon);
      }
      if (e.code === 'Digit3' || e.key === '3') {
        this.setWeapon('knife');
      }

      // Reload
      if (e.code === 'KeyR' || (e.key && e.key.toLowerCase() === 'r') || e.keyCode === 82) {
        this.reloadWeapon();
      }

      // Buy Menu (B Key)
      if (e.code === 'KeyB' || (e.key && e.key.toLowerCase() === 'b') || e.keyCode === 66) {
        e.preventDefault();
        this.callbacks.onBuyMenuToggle?.();
      }

      // Jump (with buffer for responsive timing)
      if ((e.code === 'Space' || e.keyCode === 32) && this.isAlive) {
        this.jumpBufferTimer = 0.15;
        if (this.isGrounded) {
          this.playerVelocity.y = 6.4;
          this.isGrounded = false;
          this.jumpBufferTimer = 0;
        }
      }

      // Tactical Walk (Shift)
      if (isWalk(e)) {
        this.isWalking = true;
      }

      // Crouch (C or Ctrl)
      if (isCrouch(e)) {
        this.isCrouching = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (this.isInputFocused()) {
        this.clearMovementState();
        return;
      }

      if (isForward(e)) { this.moveForward = false; }
      if (isBackward(e)) { this.moveBackward = false; }
      if (isLeft(e)) { this.moveLeft = false; }
      if (isRight(e)) { this.moveRight = false; }

      if (isWalk(e)) {
        this.isWalking = false;
      }

      if (isCrouch(e)) {
        this.isCrouching = false;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (this.isInputFocused()) return;
      this.isMouseDown = true;
      if (!this.isPointerLocked) {
        this.requestLock();
      }

      if (e.button === 0) { // Left click
        if (this.currentWeapon === 'knife') {
          this.triggerKnifeAttack(false); // Quick Slash
        } else {
          this.isFiring = true;
          this.triggerShoot();
        }
      } else if (e.button === 2) { // Right click
        if (this.currentWeapon === 'knife') {
          this.triggerKnifeAttack(true); // Heavy Stab
        } else if (this.currentWeapon === 'awp') {
          const nextScope = (this.scopeLevel + 1) % 3;
          this.setScopeLevel(nextScope);
          sounds.playScopeZoom();
        } else if (this.currentWeapon === 'm4a1s') {
          const nextScope = this.scopeLevel === 0 ? 1 : 0;
          this.setScopeLevel(nextScope);
          sounds.playScopeZoom();
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      this.isMouseDown = false;
      if (e.button === 0) {
        this.isFiring = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      // Allow mouse look whenever locked OR when dragging mouse on canvas
      if (!this.isPointerLocked && !this.isMouseDown) return;

      const scopeSensMult = this.scopeLevel === 2 ? 0.3 : this.scopeLevel === 1 ? 0.6 : 1.0;
      const sens = (this.settings.mouseSensitivity || 1.0) * 0.0022 * scopeSensMult;
      const invert = this.settings.invertY ? -1 : 1;

      this.yaw -= (e.movementX || 0) * sens;
      this.pitch -= (e.movementY || 0) * sens * invert;

      // Clamp pitch to avoid gimbal flip (-88 to 88 degrees)
      const maxPitch = Math.PI / 2 - 0.04;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    };

    const onWheel = (e: WheelEvent) => {
      if (this.isInputFocused()) return;
      const order = this.getOwnedSlotOrder();
      const curIdx = order.indexOf(this.currentWeapon);
      const len = order.length;
      const nextIdx = e.deltaY > 0 ? (curIdx + 1) % len : (curIdx - 1 + len) % len;
      this.setWeapon(order[nextIdx]);
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onBlur = () => {
      this.clearMovementState();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        this.clearMovementState();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    this.container.addEventListener('wheel', onWheel);
    this.container.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
      if (!this.isPointerLocked) {
        this.clearMovementState();
      }
      this.callbacks.onHUDUpdate({
        health: this.health,
        armor: this.armor,
        hasHelmet: this.hasHelmet,
        ammo: this.ammoState[this.currentWeapon].mag,
        reserveAmmo: this.ammoState[this.currentWeapon].reserve,
        weapon: this.currentWeapon,
        primaryWeapon: this.primaryWeapon,
        secondaryWeapon: this.secondaryWeapon,
        isReloading: this.isReloading,
        isScoped: this.scopeLevel > 0,
        scopeLevel: this.scopeLevel,
        redScore: this.redScore,
        blueScore: this.blueScore,
        round: this.currentRound,
        timeLeft: this.roundTimeLeft,
        isLocked: this.isPointerLocked,
        hitMarker: false,
        isDead: !this.isAlive,
        respawnTimer: this.respawnTimer
      });
    });

    const onResize = () => {
      if (!this.container) return;
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    };
    window.addEventListener('resize', onResize);
  }

  public requestLock() {
    if (this.isPointerLocked) return;
    try {
      const p = this.container.requestPointerLock?.();
      if (p && typeof (p as any).catch === 'function') {
        (p as any).catch((err: any) => {
          console.debug('[PointerLock] Handled lock cooldown/gesture requirement:', err?.message || err);
        });
      }
    } catch (e) {
      console.debug('[PointerLock] Ignored sync exception:', e);
    }
  }

  public unlock() {
    this.clearMovementState();
    document.exitPointerLock?.();
  }

  // Send in-game chat message (/all for all-chat, normal for team-chat)
  public sendChatMessage(rawText: string) {
    const text = rawText.trim();
    if (!text) return;

    const isAll = text.toLowerCase().startsWith('/all ') || text.toLowerCase() === '/all';
    const cleanText = isAll ? text.replace(/^\/all\s*/i, '').trim() : text;
    if (!cleanText) return;

    if (this.isOnlineMode && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat_message',
        text: rawText
      }));
    } else {
      const msg: ChatMessage = {
        id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        senderId: this.localPlayerId,
        senderName: this.playerName,
        team: this.team,
        channel: isAll ? 'all' : 'team',
        text: cleanText,
        timestamp: Date.now()
      };
      this.callbacks.onChatMessage?.(msg);
      sounds.playRadioChatSound();
    }
  }

  private getActiveFirearmRig(weapon: WeaponType = this.currentWeapon): {
    group: THREE.Group;
    muzzlePoint: THREE.Object3D;
    boltMesh: THREE.Mesh;
  } {
    switch (weapon) {
      case 'usp':
        return { group: this.uspRig.group, muzzlePoint: this.uspRig.muzzlePoint, boltMesh: this.uspRig.slideMesh };
      case 'pistol':
        return { group: this.pistolRig.group, muzzlePoint: this.pistolRig.muzzlePoint, boltMesh: this.pistolRig.slideMesh };
      case 'mp9':
        return { group: this.mp9Rig.group, muzzlePoint: this.mp9Rig.muzzlePoint, boltMesh: this.mp9Rig.boltMesh };
      case 'xm1014':
        return { group: this.xm1014Rig.group, muzzlePoint: this.xm1014Rig.muzzlePoint, boltMesh: this.xm1014Rig.boltMesh };
      case 'm4a1s':
        return { group: this.m4a1sRig.group, muzzlePoint: this.m4a1sRig.muzzlePoint, boltMesh: this.m4a1sRig.boltMesh };
      case 'awp':
        return { group: this.awpRig.group, muzzlePoint: this.awpRig.muzzlePoint, boltMesh: this.awpRig.boltMesh };
      case 'ak47':
      default:
        return { group: this.ak47Rig.group, muzzlePoint: this.ak47Rig.muzzlePoint, boltMesh: this.ak47Rig.boltMesh };
    }
  }

  public setWeapon(weapon: WeaponType, force: boolean = false) {
    if (!force && this.currentWeapon === weapon && !this.isReloading) return;
    this.currentWeapon = weapon;
    this.isReloading = false;
    this.setScopeLevel(0);

    // Viewmodel visibility - strictly ensure only the active weapon is visible
    this.uspRig.group.visible = weapon === 'usp';
    this.pistolRig.group.visible = weapon === 'pistol';
    this.mp9Rig.group.visible = weapon === 'mp9';
    this.xm1014Rig.group.visible = weapon === 'xm1014';
    this.ak47Rig.group.visible = weapon === 'ak47';
    this.m4a1sRig.group.visible = weapon === 'm4a1s';
    this.awpRig.group.visible = weapon === 'awp';
    this.knifeRig.group.visible = weapon === 'knife';

    // Move muzzle flash group to the active weapon's muzzle point
    if (weapon !== 'knife') {
      const rig = this.getActiveFirearmRig(weapon);
      rig.muzzlePoint.add(this.muzzleFlashGroup);
    }

    // Quick draw recoil kick
    this.recoilPitch = 0.04;
  }

  // Subtle screen shake and headshot impact feedback
  public triggerHeadshotFeedback() {
    this.screenShakeTrauma = Math.min(1.0, this.screenShakeTrauma + 0.45);
    // Subtle snappy camera pitch & roll flinch
    this.pitch -= 0.015;
    this.cameraRoll = (Math.random() > 0.5 ? 1 : -1) * 0.018;
  }

  // Buy Menu Actions (CS:GO Economy)
  public buyArmor(withHelmet: boolean = false): boolean {
    if (withHelmet) {
      if (this.armor >= 100 && this.hasHelmet) return false;
      this.armor = 100;
      this.hasHelmet = true;
      return true;
    } else {
      if (this.armor >= 100) return false;
      this.armor = 100;
      return true;
    }
  }

  public buyAmmo(type: 'primary' | 'secondary' | 'all'): boolean {
    let bought = false;
    if ((type === 'primary' || type === 'all') && this.primaryWeapon) {
      const pw = this.primaryWeapon;
      const st = this.ammoState[pw];
      if (st.reserve < WEAPONS[pw].maxReserveAmmo) {
        st.reserve = WEAPONS[pw].maxReserveAmmo;
        bought = true;
      }
    }
    if (type === 'secondary' || type === 'all') {
      const sw = this.secondaryWeapon;
      const st = this.ammoState[sw];
      if (st.reserve < WEAPONS[sw].maxReserveAmmo) {
        st.reserve = WEAPONS[sw].maxReserveAmmo;
        bought = true;
      }
    }
    return bought;
  }

  public buyWeapon(weaponType: WeaponType): boolean {
    const wData = WEAPONS[weaponType];
    if (!wData || weaponType === 'knife') return false;

    if (wData.slot === 1) {
      this.primaryWeapon = weaponType;
    } else if (wData.slot === 2) {
      this.secondaryWeapon = weaponType;
    }

    this.ammoState[weaponType].mag = wData.magSize;
    this.ammoState[weaponType].reserve = wData.maxReserveAmmo;
    this.setWeapon(weaponType, true);
    return true;
  }

  public setGodMode(enabled: boolean) {
    this.isGodMode = enabled;
    if (enabled) {
      this.isReloading = false;
      (Object.keys(this.ammoState) as WeaponType[]).forEach(k => {
        if (k !== 'knife') {
          this.ammoState[k].mag = WEAPONS[k].magSize;
          this.ammoState[k].reserve = 999;
        }
      });
    }
  }

  public reloadWeapon() {
    if (this.currentWeapon === 'knife' || this.isGodMode) return;
    if (this.isReloading || !this.isAlive) return;

    const wData = WEAPONS[this.currentWeapon];
    const cur = this.ammoState[this.currentWeapon];
    if (cur.mag >= wData.magSize || cur.reserve <= 0) return;

    this.setScopeLevel(0);
    this.isReloading = true;
    this.reloadEndTime = performance.now() + wData.reloadTime;
    sounds.playReload();
  }

  // Firearms shooting logic (All CS:GO Weapons)
  private triggerShoot() {
    if (!this.isAlive || this.isReloading) return;
    if (this.currentWeapon === 'knife') return;

    const wData = WEAPONS[this.currentWeapon];
    const now = performance.now();

    if (now - this.lastFireTime < wData.fireRate) return;

    const ammo = this.ammoState[this.currentWeapon];
    if (!this.isGodMode && ammo.mag <= 0) {
      this.reloadWeapon();
      return;
    }

    this.lastFireTime = now;
    if (!this.isGodMode) {
      ammo.mag--;
    } else {
      ammo.mag = wData.magSize;
    }

    // Play weapon-specific CS:GO gunshot sound
    sounds.playWeaponShot(wData.id);

    // Recoil Kick (reduced when scoped)
    const scopeMult = this.scopeLevel > 0 ? 0.65 : 1.0;
    this.recoilPitch += wData.recoilKick * scopeMult;
    this.recoilYaw += (Math.random() - 0.5) * (wData.recoilKick * 0.5 * scopeMult);

    // Muzzle Flash effect
    this.triggerMuzzleFlash();

    // Raycast hit detection for bullets (supports multi-pellet shotguns)
    const pellets = wData.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      this.performGunRaycast(wData);
    }

    // Unscope AWP briefly after bolt-action shot
    if (wData.id === 'awp' && this.scopeLevel > 0) {
      this.setScopeLevel(0);
    }

    // Broadcast shoot to WS
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const activeRig = this.getActiveFirearmRig(this.currentWeapon);
      const muzzleWorld = new THREE.Vector3();
      activeRig.muzzlePoint.getWorldPosition(muzzleWorld);
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);

      this.ws.send(JSON.stringify({
        type: 'player_shoot',
        weapon: this.currentWeapon,
        origin: { x: muzzleWorld.x, y: muzzleWorld.y, z: muzzleWorld.z },
        direction: { x: dir.x, y: dir.y, z: dir.z }
      }));
    }
  }

  // Melee Knife Attack logic (Slash / Stab)
  public triggerKnifeAttack(isHeavy: boolean) {
    if (!this.isAlive) return;
    const now = performance.now();
    const cooldown = isHeavy ? 550 : 320;
    if (now - this.knifeSwingTime < cooldown) return;

    this.knifeSwingTime = now;
    this.knifeSwingType = isHeavy ? 'stab' : 'slash';

    sounds.playKnifeSlash();

    const meleeRange = isHeavy ? 2.8 : 2.4;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    raycaster.far = meleeRange;

    const hitCandidates: THREE.Object3D[] = [];
    this.mapData.sceneGroup.children.forEach(c => hitCandidates.push(c));

    this.botManager.getAllBots().forEach(bot => {
      if (bot.isAlive && bot.team !== this.team) {
        hitCandidates.push(bot.meshData.headMesh);
        hitCandidates.push(bot.meshData.bodyMesh);
        bot.meshData.legsMesh.children.forEach(l => hitCandidates.push(l));
      }
    });

    this.remotePlayers.forEach(rp => {
      if (rp.team !== this.team && rp.health > 0) {
        hitCandidates.push(rp.meshData.headMesh);
        hitCandidates.push(rp.meshData.bodyMesh);
        rp.meshData.legsMesh.children.forEach(l => hitCandidates.push(l));
      }
    });

    const intersects = raycaster.intersectObjects(hitCandidates, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitObj = hit.object;
      const hitbox = hitObj.userData?.hitbox;

      if (hitbox) {
        const isHead = hitbox === 'head';
        const baseDmg = isHeavy ? 85 : 55;
        const damage = isHead ? 100 : baseDmg;

        sounds.playKnifeHit();
        this.createBloodParticles(hit.point);

        this.callbacks.onHUDUpdate({
          health: this.health,
          armor: this.armor,
          hasHelmet: this.hasHelmet,
          ammo: 1,
          reserveAmmo: 0,
          weapon: 'knife',
          primaryWeapon: this.primaryWeapon,
          secondaryWeapon: this.secondaryWeapon,
          isReloading: false,
          isScoped: false,
          scopeLevel: 0,
          redScore: this.redScore,
          blueScore: this.blueScore,
          round: this.currentRound,
          timeLeft: this.roundTimeLeft,
          isLocked: this.isPointerLocked,
          hitMarker: true,
          isDead: !this.isAlive,
          respawnTimer: this.respawnTimer
        });

        const hitPlayerId = hitObj.userData?.playerId;
        if (this.isOnlineMode && this.ws && this.ws.readyState === WebSocket.OPEN && hitPlayerId) {
          this.ws.send(JSON.stringify({
            type: 'hit_damage',
            targetId: hitPlayerId,
            damage,
            isHeadshot: isHead,
            weapon: 'knife'
          }));
        } else if (hitPlayerId && this.botManager.getBot(hitPlayerId)) {
          const killed = this.botManager.applyDamage(hitPlayerId, damage, isHead, this.localPlayerId);
          if (killed) {
            const bot = this.botManager.getBot(hitPlayerId)!;
            this.callbacks.onMoneyReward?.(WEAPONS.knife.killReward, 'Hạ gục bằng Dao');
            if (isHead) {
              this.triggerHeadshotFeedback();
              this.callbacks.onHUDUpdate({
                health: this.health,
                armor: this.armor,
                hasHelmet: this.hasHelmet,
                ammo: 1,
                reserveAmmo: 0,
                weapon: 'knife',
                primaryWeapon: this.primaryWeapon,
                secondaryWeapon: this.secondaryWeapon,
                isReloading: false,
                isScoped: false,
                scopeLevel: 0,
                redScore: this.redScore,
                blueScore: this.blueScore,
                round: this.currentRound,
                timeLeft: this.roundTimeLeft,
                isLocked: this.isPointerLocked,
                hitMarker: true,
                isDead: !this.isAlive,
                respawnTimer: this.respawnTimer,
                headshotKill: true
              });
            }
            this.callbacks.onKillFeed({
              id: 'kf_' + Math.random(),
              killerName: this.playerName,
              killerTeam: this.team,
              victimName: bot.name,
              victimTeam: bot.team,
              weapon: 'knife',
              isHeadshot: isHead,
              timestamp: Date.now()
            });
            this.checkOfflineRoundWin();
          }
        }
      } else {
        sounds.playKnifeHitWall();
        this.createKnifeScratchDecal(hit.point, hit.face?.normal || new THREE.Vector3(0, 0, 1));
        this.createSparkParticles(hit.point);
      }
    }
  }

  private triggerMuzzleFlash() {
    if (this.currentWeapon === 'knife') return;

    const activeRig = this.getActiveFirearmRig(this.currentWeapon);
    activeRig.muzzlePoint.add(this.muzzleFlashGroup);

    const isSuppressed = this.currentWeapon === 'usp' || this.currentWeapon === 'm4a1s';
    const scale = isSuppressed
      ? 0.14 + Math.random() * 0.04
      : this.currentWeapon === 'awp'
      ? 0.45 + Math.random() * 0.1
      : 0.30 + Math.random() * 0.08;

    this.muzzleFlashSprite.scale.set(scale, scale, scale);
    this.muzzleFlashSprite.material.rotation = Math.random() * Math.PI * 2;

    this.muzzleFlashGroup.position.set(0, 0, 0);
    this.muzzleFlashGroup.visible = true;
    this.muzzleFlashLight.intensity = isSuppressed ? 1.2 : 3.5;

    // Viewmodel kickback recoil & mechanism cycling
    this.gunKickZ = this.currentWeapon === 'awp' ? 0.065 : this.currentWeapon === 'xm1014' ? 0.05 : 0.032;
    this.gunKickRotX = this.currentWeapon === 'awp' ? 0.06 : 0.035;

    activeRig.boltMesh.position.z += 0.04;

    setTimeout(() => {
      this.muzzleFlashGroup.visible = false;
      this.muzzleFlashLight.intensity = 0;
    }, 45);
  }

  private performGunRaycast(wData: typeof WEAPONS[WeaponType]) {
    const raycaster = new THREE.Raycaster();

    // Spread calculation (tighter when scoped or crouching)
    let activeSpread = wData.spread;
    if (this.scopeLevel > 0) activeSpread *= 0.15;
    if (this.isCrouching) activeSpread *= 0.65;

    const spread = (Math.random() - 0.5) * activeSpread;
    const spreadY = (Math.random() - 0.5) * activeSpread;

    const screenCenter = new THREE.Vector2(spread, spreadY);
    raycaster.setFromCamera(screenCenter, this.camera);
    raycaster.far = wData.range;

    // Collect all potential targets
    const hitCandidates: THREE.Object3D[] = [];

    // Map geometry
    this.mapData.sceneGroup.children.forEach(c => hitCandidates.push(c));

    // Bots
    this.botManager.getAllBots().forEach(bot => {
      if (bot.isAlive && bot.team !== this.team) {
        hitCandidates.push(bot.meshData.headMesh);
        hitCandidates.push(bot.meshData.bodyMesh);
        bot.meshData.legsMesh.children.forEach(l => hitCandidates.push(l));
      }
    });

    // Remote players
    this.remotePlayers.forEach(rp => {
      if (rp.team !== this.team && rp.health > 0) {
        hitCandidates.push(rp.meshData.headMesh);
        hitCandidates.push(rp.meshData.bodyMesh);
        rp.meshData.legsMesh.children.forEach(l => hitCandidates.push(l));
      }
    });

    const intersects = raycaster.intersectObjects(hitCandidates, true);

    const activeRig = this.getActiveFirearmRig(this.currentWeapon);
    const muzzleWorld = new THREE.Vector3();
    activeRig.muzzlePoint.getWorldPosition(muzzleWorld);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitObj = hit.object;
      const hitboxType = hitObj.userData?.hitbox;

      this.createBulletTracer(muzzleWorld, hit.point, 1);

      if (hitboxType) {
        const isHeadshot = hitboxType === 'head';
        const mult = isHeadshot ? wData.headshotMultiplier : hitboxType === 'legs' ? 0.75 : 1.0;
        const damage = Math.round(wData.damage * mult);

        if (isHeadshot) sounds.playHeadshot();
        else sounds.playHitmarker();

        this.createBloodParticles(hit.point);

        // Flash Hitmarker on HUD
        this.callbacks.onHUDUpdate({
          health: this.health,
          armor: this.armor,
          hasHelmet: this.hasHelmet,
          ammo: this.ammoState[this.currentWeapon].mag,
          reserveAmmo: this.ammoState[this.currentWeapon].reserve,
          weapon: this.currentWeapon,
          primaryWeapon: this.primaryWeapon,
          secondaryWeapon: this.secondaryWeapon,
          isReloading: this.isReloading,
          isScoped: this.scopeLevel > 0,
          scopeLevel: this.scopeLevel,
          redScore: this.redScore,
          blueScore: this.blueScore,
          round: this.currentRound,
          timeLeft: this.roundTimeLeft,
          isLocked: this.isPointerLocked,
          hitMarker: true,
          isDead: !this.isAlive,
          respawnTimer: this.respawnTimer
        });

        const hitPlayerId = hitObj.userData?.playerId;
        if (this.isOnlineMode && this.ws && this.ws.readyState === WebSocket.OPEN && hitPlayerId) {
          // Online mode: send authoritative hit_damage for BOTH remote players AND bots!
          this.ws.send(JSON.stringify({
            type: 'hit_damage',
            targetId: hitPlayerId,
            damage,
            isHeadshot,
            weapon: this.currentWeapon
          }));
        } else if (hitPlayerId && this.botManager.getBot(hitPlayerId)) {
          // Offline mode: apply directly to local botManager
          const killed = this.botManager.applyDamage(hitPlayerId, damage, isHeadshot, this.localPlayerId);
          if (killed) {
            const bot = this.botManager.getBot(hitPlayerId)!;
            this.callbacks.onMoneyReward?.(wData.killReward, `Hạ gục (${wData.name})`);
            if (isHeadshot) {
              this.triggerHeadshotFeedback();
              this.callbacks.onHUDUpdate({
                health: this.health,
                armor: this.armor,
                hasHelmet: this.hasHelmet,
                ammo: this.ammoState[this.currentWeapon].mag,
                reserveAmmo: this.ammoState[this.currentWeapon].reserve,
                weapon: this.currentWeapon,
                primaryWeapon: this.primaryWeapon,
                secondaryWeapon: this.secondaryWeapon,
                isReloading: this.isReloading,
                isScoped: this.scopeLevel > 0,
                scopeLevel: this.scopeLevel,
                redScore: this.redScore,
                blueScore: this.blueScore,
                round: this.currentRound,
                timeLeft: this.roundTimeLeft,
                isLocked: this.isPointerLocked,
                hitMarker: true,
                isDead: !this.isAlive,
                respawnTimer: this.respawnTimer,
                headshotKill: true
              });
            }
            this.callbacks.onKillFeed({
              id: 'kf_' + Math.random(),
              killerName: this.playerName,
              killerTeam: this.team,
              victimName: bot.name,
              victimTeam: bot.team,
              weapon: this.currentWeapon,
              isHeadshot,
              timestamp: Date.now()
            });

            this.checkOfflineRoundWin();
          }
        }
      } else {
        if (hit.face) {
          this.createBulletHole(hit.point, hit.face.normal);
          this.createSparkParticles(hit.point);
        }
      }
    } else {
      const rayDir = raycaster.ray.direction;
      const endPoint = this.camera.position.clone().add(rayDir.clone().multiplyScalar(75));
      this.createBulletTracer(muzzleWorld, endPoint, 75);
    }
  }

  private createBulletTracer(from: THREE.Vector3, to: THREE.Vector3, _dist: number) {
    const group = new THREE.Group();

    // 1. High-intensity neon tracer core line
    const points = [from, to];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xfff4b0,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });
    const line = new THREE.Line(lineGeo, lineMat);
    group.add(line);

    // 2. Volumetric Glowing Tracer Beam Cylinder (visible in 3D from all angles)
    const dir = to.clone().sub(from);
    const length = dir.length();
    if (length > 0.1) {
      const cylinderGeo = new THREE.CylinderGeometry(0.016, 0.016, length, 8);
      cylinderGeo.rotateX(Math.PI / 2);
      cylinderGeo.translate(0, 0, length / 2);

      const cylinderMat = new THREE.MeshBasicMaterial({
        color: 0xffaa22,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
      cylinderMesh.position.copy(from);
      cylinderMesh.lookAt(to);
      group.add(cylinderMesh);
    }

    this.scene.add(group);
    this.bulletTracers.push({ obj: group, expire: performance.now() + 75 });
  }

  private createBulletHole(pos: THREE.Vector3, normal: THREE.Vector3) {
    const tex = textures.getBulletHoleTexture();
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const geo = new THREE.PlaneGeometry(0.18, 0.18);
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.copy(pos).add(normal.clone().multiplyScalar(0.01));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.scene.add(mesh);

    this.bulletDecals.push(mesh);
    if (this.bulletDecals.length > 40) {
      const old = this.bulletDecals.shift();
      if (old) this.scene.remove(old);
    }
  }

  private createKnifeScratchDecal(pos: THREE.Vector3, normal: THREE.Vector3) {
    const tex = textures.getKnifeSlashTexture();
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    const geo = new THREE.PlaneGeometry(0.32, 0.32);
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.copy(pos).add(normal.clone().multiplyScalar(0.012));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    mesh.rotateZ((Math.random() - 0.5) * 0.8);
    this.scene.add(mesh);

    this.knifeScratchDecals.push(mesh);
    if (this.knifeScratchDecals.length > 30) {
      const old = this.knifeScratchDecals.shift();
      if (old) this.scene.remove(old);
    }
  }

  private createSparkParticles(pos: THREE.Vector3) {
    const count = 8;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          Math.random() * 2.5 + 0.5,
          (Math.random() - 0.5) * 2.5
        )
      );
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffaa22,
      size: 0.05,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    this.particles.push({ mesh: pts, velocities, expire: performance.now() + 250 });
  }

  private createBloodParticles(pos: THREE.Vector3) {
    const count = 12;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2.0,
          Math.random() * 1.5,
          (Math.random() - 0.5) * 2.0
        )
      );
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xaa1111,
      size: 0.06,
      transparent: true
    });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);
    this.particles.push({ mesh: pts, velocities, expire: performance.now() + 350 });
  }

  private handleBotShoot(bot: BotInstance, origin: THREE.Vector3, dir: THREE.Vector3) {
    const end = origin.clone().add(dir.clone().multiplyScalar(40));
    this.createBulletTracer(origin, end, 40);

    // If online and host, broadcast bot firing across network
    if (this.isOnlineMode && this.isHost && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'player_shoot',
        shooterId: bot.id,
        weapon: bot.weapon,
        origin: { x: origin.x, y: origin.y, z: origin.z },
        direction: { x: dir.x, y: dir.y, z: dir.z }
      }));
    }

    // Check if hit local player
    const eyePos = this.playerPos.clone();
    const toPlayer = eyePos.clone().sub(origin);
    const proj = toPlayer.dot(dir);

    if (proj > 0 && proj < 45) {
      const closestPoint = origin.clone().add(dir.clone().multiplyScalar(proj));
      const dist = closestPoint.distanceTo(eyePos);

      // Hitbox cylinder check
      if (dist < 0.65 && this.isAlive && bot.team !== this.team) {
        const isHead = closestPoint.y > eyePos.y - 0.2;
        const wData = WEAPONS[bot.weapon];
        const mult = isHead ? 1.4 : 1.0;
        const dmg = Math.round(wData.damage * mult * 0.42);

        if (this.isOnlineMode && this.isHost && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'hit_damage',
            targetId: this.localPlayerId,
            attackerId: bot.id,
            damage: dmg,
            isHeadshot: isHead,
            weapon: bot.weapon
          }));
        } else {
          const prevAlive = this.isAlive;
          this.takeDamage(dmg, isHead, bot.name);

          if (prevAlive && !this.isAlive) {
            this.callbacks.onKillFeed({
              id: 'kf_' + Math.random(),
              killerName: bot.name,
              killerTeam: bot.team,
              victimName: this.playerName,
              victimTeam: this.team,
              weapon: bot.weapon,
              isHeadshot: isHead,
              timestamp: Date.now()
            });
          }
        }
      }
    }

    // If online and host, check if bot shot any remote opponents
    if (this.isOnlineMode && this.isHost && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.remotePlayers.forEach((rp, rpId) => {
        if (rp.team !== bot.team && rp.health > 0) {
          const rpPos = rp.position.clone().add(new THREE.Vector3(0, 1.4, 0));
          const toTarget = rpPos.clone().sub(origin);
          const p = toTarget.dot(dir);
          if (p > 0 && p < 45) {
            const closest = origin.clone().add(dir.clone().multiplyScalar(p));
            if (closest.distanceTo(rpPos) < 0.65) {
              const isHead = closest.y > rpPos.y - 0.2;
              const dmg = Math.round(WEAPONS[bot.weapon].damage * (isHead ? 1.4 : 1.0) * 0.42);
              this.ws?.send(JSON.stringify({
                type: 'hit_damage',
                targetId: rpId,
                attackerId: bot.id,
                damage: dmg,
                isHeadshot: isHead,
                weapon: bot.weapon
              }));
            }
          }
        }
      });
    }
  }

  private handleBotKill(bot: BotInstance, victimId: string, isHeadshot: boolean) {
    const victim = this.botManager.getBot(victimId);
    if (victim) {
      if (this.isOnlineMode && this.isHost && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'hit_damage',
          targetId: victimId,
          attackerId: bot.id,
          damage: 100,
          isHeadshot,
          weapon: bot.weapon
        }));
      } else {
        this.callbacks.onKillFeed({
          id: 'kf_' + Math.random(),
          killerName: bot.name,
          killerTeam: bot.team,
          victimName: victim.name,
          victimTeam: victim.team,
          weapon: bot.weapon,
          isHeadshot,
          timestamp: Date.now()
        });
        this.checkOfflineRoundWin();
      }
    }
  }

  public takeDamage(amount: number, isHeadshot: boolean, _attackerName: string) {
    if (!this.isAlive) return;

    // 50% damage reduction for tactical gunfights and survivability
    let mitigatedDamage = Math.max(1, Math.round(amount * 0.5));

    // Helmet reduces headshot damage by 35%
    if (isHeadshot && this.hasHelmet && this.armor > 0) {
      mitigatedDamage = Math.max(1, Math.round(mitigatedDamage * 0.65));
    }

    // CS:GO Kevlar Armor absorption: absorbs 50% of the damage
    if (this.armor > 0) {
      const armorAbsorb = Math.min(this.armor, Math.ceil(mitigatedDamage * 0.5));
      const healthDamage = mitigatedDamage - armorAbsorb;
      this.armor = Math.max(0, this.armor - armorAbsorb);
      if (this.armor === 0) this.hasHelmet = false;
      this.health = Math.max(0, this.health - healthDamage);
    } else {
      this.health = Math.max(0, this.health - mitigatedDamage);
    }

    sounds.playPlayerHurt();

    // Camera flinch
    this.pitch += 0.025;
    this.yaw += (Math.random() - 0.5) * 0.03;

    if (this.health === 0) {
      this.handlePlayerDeath(_attackerName);
    }
  }

  private handlePlayerDeath(_killerName: string) {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.setScopeLevel(0);
    this.respawnTimer = 4.0;
    sounds.playDefeatSound();

    // CS:GO Rule: Dying resets your equipment to default starter pistol (USP-S) for the next round
    this.primaryWeapon = null;
    this.secondaryWeapon = 'usp';
    this.armor = 0;
    this.hasHelmet = false;

    if (!this.isOnlineMode) {
      setTimeout(() => {
        this.checkOfflineRoundWin();
      }, 350);
    }
  }

  private respawnLocalPlayer() {
    const survivedPreviousRound = this.isAlive && this.currentRound > 1;
    this.health = 100;
    this.isAlive = true;
    this.respawnTimer = 0;
    this.isReloading = false;
    this.setScopeLevel(0);

    if (!survivedPreviousRound && this.currentRound === 1) {
      // Round 1 Pistol Round: Start with USP-S, no primary weapon, no armor
      this.primaryWeapon = null;
      this.secondaryWeapon = 'usp';
      this.armor = 0;
      this.hasHelmet = false;
    }

    // Refill magazines and reserve ammo for owned weapons
    (Object.keys(this.ammoState) as WeaponType[]).forEach(k => {
      if (k !== 'knife') {
        this.ammoState[k].mag = WEAPONS[k].magSize;
        this.ammoState[k].reserve = WEAPONS[k].maxReserveAmmo;
      }
    });

    // Equip primary weapon if owned, otherwise secondary pistol
    if (this.primaryWeapon) {
      this.setWeapon(this.primaryWeapon, true);
    } else {
      this.setWeapon(this.secondaryWeapon, true);
    }

    const spawnList = this.mapData.spawns[this.team];
    const mySpawn = spawnList[this.slot % spawnList.length] || spawnList[0];
    this.playerPos.set(mySpawn.x, mySpawn.y, mySpawn.z);
    this.yaw = mySpawn.rotY;
    this.pitch = 0;
    this.playerVelocity.set(0, 0, 0);
  }

  private checkOfflineRoundWin() {
    if (this.roundEnded) return;

    let redAlive = 0;
    let blueAlive = 0;

    if (this.team === 'red' && this.isAlive) redAlive++;
    if (this.team === 'blue' && this.isAlive) blueAlive++;

    this.botManager.getAllBots().forEach(bot => {
      if (bot.isAlive) {
        if (bot.team === 'red') redAlive++;
        else blueAlive++;
      }
    });

    if (redAlive === 0 && blueAlive === 0) {
      this.triggerRoundEnd('draw', 'Hiệp đấu Hòa!');
    } else if (redAlive === 0) {
      this.blueScore++;
      this.triggerRoundEnd('blue', 'Đội Xanh tiêu diệt toàn bộ đối thủ!');
    } else if (blueAlive === 0) {
      this.redScore++;
      this.triggerRoundEnd('red', 'Đội Đỏ tiêu diệt toàn bộ đối thủ!');
    }
  }

  private triggerRoundEnd(winner: Team | 'draw', message: string) {
    if (this.roundEnded) return;
    this.roundEnded = true;
    const playerWon = winner === this.team;
    if (playerWon) {
      sounds.playWinSound();
      this.callbacks.onMoneyReward?.(3250, 'Thắng hiệp đấu');
    } else if (winner === 'draw') {
      sounds.playDefeatSound();
      this.callbacks.onMoneyReward?.(1500, 'Hòa hiệp đấu');
    } else {
      sounds.playDefeatSound();
      this.callbacks.onMoneyReward?.(1900, 'Trợ cấp thua hiệp');
    }

    this.callbacks.onRoundStatus({
      show: true,
      winner,
      message
    });

    setTimeout(() => {
      if (this.disposed) return;
      this.currentRound++;
      this.roundTimeLeft = 90;
      this.roundEnded = false;
      this.respawnLocalPlayer();

      // Respawn all bots with distinct team spawn slots and round-appropriate CS:GO weapons
      let redBotIdx = this.team === 'red' ? 1 : 0;
      let blueBotIdx = this.team === 'blue' ? 1 : 0;
      this.botManager.getAllBots().forEach(bot => {
        const teamSpawns = this.mapData.spawns[bot.team];
        const idx = bot.team === 'red' ? redBotIdx++ : blueBotIdx++;
        const spawn = teamSpawns[idx % teamSpawns.length] || teamSpawns[0];
        this.botManager.respawnBot(bot, spawn, this.currentRound);
      });

      this.callbacks.onRoundStatus({ show: false, message: '' });
      sounds.playRoundStart();
    }, 4000);
  }

  // Physics & Collision Update (Ultra-smooth FPS movement, auto-step climbing & fluid air control)
  private updatePhysics(delta: number) {
    if (!this.isAlive) return;

    // 1. Smooth crouch eye-height transition
    const targetEyeHeight = this.isCrouching ? 1.05 : 1.6;
    this.currentEyeHeight = THREE.MathUtils.lerp(this.currentEyeHeight, targetEyeHeight, Math.min(1, delta * 14));
    const eyeHeight = this.currentEyeHeight;

    // 2. Camera look vectors
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    // 3. Desired move direction
    const wishDir = new THREE.Vector3();
    if (this.moveForward) wishDir.add(forward);
    if (this.moveBackward) wishDir.sub(forward);
    if (this.moveRight) wishDir.add(right);
    if (this.moveLeft) wishDir.sub(right);

    const isMoving = wishDir.lengthSq() > 0.001;
    if (isMoving) {
      wishDir.normalize();
    }

    // 4. Dynamic speeds (with CS:GO weapon weight mobility)
    let wishSpeed = 6.8; // m/s
    if (this.isCrouching) wishSpeed = 3.2;
    else if (this.isWalking) wishSpeed = 4.2;

    if (this.currentWeapon === 'knife' && !this.isCrouching) {
      wishSpeed *= 1.08;
    } else if (this.currentWeapon === 'awp') {
      wishSpeed *= this.scopeLevel > 0 ? 0.55 : 0.85;
    } else if (this.scopeLevel > 0) {
      wishSpeed *= 0.78;
    }

    // 5. Ground Friction & Acceleration
    if (this.isGrounded) {
      const horizSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
      if (horizSpeed > 0.001) {
        const friction = isMoving ? 8.5 : 20.0;
        const drop = horizSpeed * friction * delta;
        const newSpeed = Math.max(0, horizSpeed - drop);
        const ratio = newSpeed / horizSpeed;
        this.playerVelocity.x *= ratio;
        this.playerVelocity.z *= ratio;
        if (!isMoving && newSpeed < 0.06) {
          this.playerVelocity.x = 0;
          this.playerVelocity.z = 0;
        }
      }

      const curSpeed = this.playerVelocity.x * wishDir.x + this.playerVelocity.z * wishDir.z;
      const addSpeed = wishSpeed - curSpeed;
      if (addSpeed > 0 && isMoving) {
        const accelSpeed = Math.min(addSpeed, 48 * delta * wishSpeed);
        this.playerVelocity.x += accelSpeed * wishDir.x;
        this.playerVelocity.z += accelSpeed * wishDir.z;
      }
    } else {
      const airWishSpeed = Math.min(wishSpeed, 3.2);
      const curAirSpeed = this.playerVelocity.x * wishDir.x + this.playerVelocity.z * wishDir.z;
      const addSpeed = airWishSpeed - curAirSpeed;
      if (addSpeed > 0 && isMoving) {
        const airAccelSpeed = Math.min(addSpeed, 26 * delta * airWishSpeed);
        this.playerVelocity.x += airAccelSpeed * wishDir.x;
        this.playerVelocity.z += airAccelSpeed * wishDir.z;
      }

      this.playerVelocity.x *= (1 - 0.4 * delta);
      this.playerVelocity.z *= (1 - 0.4 * delta);
    }

    // 6. Clamp horizontal speed
    const maxSpeed = wishSpeed * 1.15;
    const currentHoriz = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);
    if (currentHoriz > maxSpeed) {
      this.playerVelocity.x = (this.playerVelocity.x / currentHoriz) * maxSpeed;
      this.playerVelocity.z = (this.playerVelocity.z / currentHoriz) * maxSpeed;
    }

    // 7. Jump buffering (Coyote time)
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= delta;
      if (this.isGrounded) {
        this.playerVelocity.y = 6.4;
        this.isGrounded = false;
        this.jumpBufferTimer = 0;
      }
    }

    // 8. Gravity
    this.playerVelocity.y -= 19.6 * delta;

    // 9. Auto-step collision check
    const radius = 0.42;
    this.moveWithCollisions(delta, radius, eyeHeight);

    // 10. Footstep sounds (silent when tactical walking or crouching)
    if (isMoving && this.isGrounded && !this.isWalking && !this.isCrouching) {
      this.stepTimer += delta;
      if (this.stepTimer >= 0.33) {
        sounds.playFootstep();
        this.stepTimer = 0;
      }
    } else {
      this.stepTimer = 0.2;
    }

    // 11. Head bobbing calculation (subtle and smooth)
    if (isMoving && this.isGrounded) {
      const bobFreq = this.isCrouching ? 7 : (this.isWalking ? 8 : 12);
      this.bobTimer += delta * bobFreq;
    } else {
      this.bobTimer = THREE.MathUtils.lerp(this.bobTimer, 0, delta * 6);
    }

    // 12. Strafe camera roll tilt (-1 deg to +1 deg)
    let targetRoll = 0;
    if (this.moveLeft) targetRoll += 0.016;
    if (this.moveRight) targetRoll -= 0.016;
    this.cameraRoll = THREE.MathUtils.lerp(this.cameraRoll, targetRoll, delta * 10);
  }

  // Smooth sliding collision with auto-step climbing (glides over curbs, stairs and crate lips)
  private moveWithCollisions(delta: number, radius: number, eyeHeight: number) {
    const feetY = this.playerPos.y - eyeHeight;
    const headY = this.playerPos.y + 0.2;
    const stepHeight = 0.36;

    // 1. Move X & check collision with auto-step
    this.playerPos.x += this.playerVelocity.x * delta;

    for (const b of this.mapData.colliders) {
      if (headY > b.minY && feetY < b.maxY) {
        if (
          this.playerPos.x + radius > b.minX &&
          this.playerPos.x - radius < b.maxX &&
          this.playerPos.z + radius > b.minZ &&
          this.playerPos.z - radius < b.maxZ
        ) {
          const obstacleStep = b.maxY - feetY;
          if (obstacleStep > 0 && obstacleStep <= stepHeight && this.playerVelocity.y <= 0) {
            this.playerPos.y = Math.max(this.playerPos.y, b.maxY + eyeHeight);
            this.isGrounded = true;
          } else {
            const midX = (b.minX + b.maxX) / 2;
            if (this.playerVelocity.x > 0 || (this.playerVelocity.x === 0 && this.playerPos.x < midX)) {
              this.playerPos.x = b.minX - radius - 0.002;
            } else {
              this.playerPos.x = b.maxX + radius + 0.002;
            }
            this.playerVelocity.x = 0;
          }
        }
      }
    }

    // 2. Move Z & check collision with auto-step
    this.playerPos.z += this.playerVelocity.z * delta;

    for (const b of this.mapData.colliders) {
      if (headY > b.minY && feetY < b.maxY) {
        if (
          this.playerPos.x + radius > b.minX &&
          this.playerPos.x - radius < b.maxX &&
          this.playerPos.z + radius > b.minZ &&
          this.playerPos.z - radius < b.maxZ
        ) {
          const obstacleStep = b.maxY - feetY;
          if (obstacleStep > 0 && obstacleStep <= stepHeight && this.playerVelocity.y <= 0) {
            this.playerPos.y = Math.max(this.playerPos.y, b.maxY + eyeHeight);
            this.isGrounded = true;
          } else {
            const midZ = (b.minZ + b.maxZ) / 2;
            if (this.playerVelocity.z > 0 || (this.playerVelocity.z === 0 && this.playerPos.z < midZ)) {
              this.playerPos.z = b.minZ - radius - 0.002;
            } else {
              this.playerPos.z = b.maxZ + radius + 0.002;
            }
            this.playerVelocity.z = 0;
          }
        }
      }
    }

    // 3. Move Y
    this.playerPos.y += this.playerVelocity.y * delta;

    let groundY = eyeHeight;
    for (const box of this.mapData.colliders) {
      if (
        this.playerPos.x + radius > box.minX &&
        this.playerPos.x - radius < box.maxX &&
        this.playerPos.z + radius > box.minZ &&
        this.playerPos.z - radius < box.maxZ
      ) {
        const topY = box.maxY + eyeHeight;
        if (this.playerPos.y >= topY - 0.4 && this.playerPos.y <= topY + 0.45 && this.playerVelocity.y <= 0) {
          if (topY > groundY) {
            groundY = topY;
          }
        }
      }
    }

    if (this.playerPos.y <= groundY) {
      this.playerPos.y = groundY;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }

  // Animation Frame Loop
  private loop = () => {
    if (this.disposed) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = performance.now();

    // 1. Update Physics & Player Position
    this.updatePhysics(delta);

    // 2. Camera Orientation
    const targetPitch = this.pitch + this.recoilPitch;
    const targetYaw = this.yaw + this.recoilYaw;

    // Smoothly recover recoil & camera roll
    this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, delta * 14);
    this.recoilYaw = THREE.MathUtils.lerp(this.recoilYaw, 0, delta * 14);
    this.cameraRoll = THREE.MathUtils.lerp(this.cameraRoll, 0, delta * 12);

    // Screen shake trauma decay & offset calculation (for headshot impact)
    let shakePitch = 0;
    let shakeYaw = 0;
    let shakeRoll = 0;
    if (this.screenShakeTrauma > 0.001) {
      this.screenShakeTrauma = Math.max(0, this.screenShakeTrauma - delta * 2.8);
      const shakePower = Math.pow(this.screenShakeTrauma, 2);
      shakePitch = (Math.random() - 0.5) * 0.045 * shakePower;
      shakeYaw = (Math.random() - 0.5) * 0.045 * shakePower;
      shakeRoll = (Math.random() - 0.5) * 0.03 * shakePower;
    }

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = targetYaw + shakeYaw;
    this.camera.rotation.x = targetPitch + shakePitch;
    this.camera.rotation.z = this.cameraRoll + shakeRoll;

    // Bobbing offset
    const bobX = Math.cos(this.bobTimer) * 0.02;
    const bobY = Math.abs(Math.sin(this.bobTimer)) * 0.035;
    this.camera.position.set(
      this.playerPos.x + bobX,
      this.playerPos.y + bobY,
      this.playerPos.z
    );

    // 3. Update Viewmodels (Breathing & sway)
    const swayX = -bobX * 0.8;
    const swayY = -bobY * 0.8;
    this.fpCameraRig.position.set(swayX, swayY, 0);

    // Smoothly recover firearm viewmodel kickback & mechanism cycling
    this.gunKickZ = THREE.MathUtils.lerp(this.gunKickZ, 0, delta * 20);
    this.gunKickRotX = THREE.MathUtils.lerp(this.gunKickRotX, 0, delta * 20);

    if (this.currentWeapon === 'usp') {
      this.uspRig.group.position.set(0.20, -0.19, -0.38 + this.gunKickZ);
      this.uspRig.group.rotation.set(0.012 + this.gunKickRotX, -0.012, 0);
      this.uspRig.slideMesh.position.z = THREE.MathUtils.lerp(this.uspRig.slideMesh.position.z, -0.05, delta * 22);
    } else if (this.currentWeapon === 'pistol') {
      this.pistolRig.group.position.set(0.20, -0.19, -0.38 + this.gunKickZ);
      this.pistolRig.group.rotation.set(0.012 + this.gunKickRotX, -0.012, 0);
      this.pistolRig.slideMesh.position.z = THREE.MathUtils.lerp(this.pistolRig.slideMesh.position.z, -0.06, delta * 22);
    } else if (this.currentWeapon === 'mp9') {
      this.mp9Rig.group.position.set(0.21, -0.20, -0.40 + this.gunKickZ);
      this.mp9Rig.group.rotation.set(0.01 + this.gunKickRotX, -0.012, 0);
      this.mp9Rig.boltMesh.position.z = THREE.MathUtils.lerp(this.mp9Rig.boltMesh.position.z, -0.04, delta * 22);
    } else if (this.currentWeapon === 'xm1014') {
      this.xm1014Rig.group.position.set(0.22, -0.21, -0.42 + this.gunKickZ);
      this.xm1014Rig.group.rotation.set(0.01 + this.gunKickRotX, -0.012, 0);
      this.xm1014Rig.boltMesh.position.z = THREE.MathUtils.lerp(this.xm1014Rig.boltMesh.position.z, -0.02, delta * 22);
    } else if (this.currentWeapon === 'ak47') {
      this.ak47Rig.group.position.set(0.22, -0.21, -0.42 + this.gunKickZ);
      this.ak47Rig.group.rotation.set(0.01 + this.gunKickRotX, -0.012, 0);
      this.ak47Rig.boltMesh.position.z = THREE.MathUtils.lerp(this.ak47Rig.boltMesh.position.z, -0.01, delta * 22);
    } else if (this.currentWeapon === 'm4a1s') {
      const adsX = this.scopeLevel > 0 ? 0.08 : 0.22;
      const adsY = this.scopeLevel > 0 ? -0.17 : -0.21;
      this.m4a1sRig.group.position.set(adsX, adsY, -0.42 + this.gunKickZ);
      this.m4a1sRig.group.rotation.set(0.01 + this.gunKickRotX, -0.012, 0);
      this.m4a1sRig.boltMesh.position.z = THREE.MathUtils.lerp(this.m4a1sRig.boltMesh.position.z, -0.02, delta * 22);
    } else if (this.currentWeapon === 'awp') {
      this.awpRig.group.visible = this.scopeLevel === 0;
      this.awpRig.group.position.set(0.22, -0.20, -0.42 + this.gunKickZ);
      this.awpRig.group.rotation.set(0.01 + this.gunKickRotX, -0.012, 0);
      this.awpRig.boltMesh.position.z = THREE.MathUtils.lerp(this.awpRig.boltMesh.position.z, -0.02, delta * 18);
    }

    // Knife Attack Animation (Slash arc or heavy thrust)
    if (this.currentWeapon === 'knife') {
      const knifeElapsed = (now - this.knifeSwingTime) / 1000;
      const swingDur = this.knifeSwingType === 'stab' ? 0.32 : 0.24;
      if (knifeElapsed < swingDur) {
        const progress = knifeElapsed / swingDur;
        if (this.knifeSwingType === 'slash') {
          if (progress < 0.3) {
            const p = progress / 0.3;
            this.knifeRig.group.position.set(
              THREE.MathUtils.lerp(0.25, 0.28, p),
              THREE.MathUtils.lerp(-0.24, -0.16, p),
              THREE.MathUtils.lerp(-0.42, -0.36, p)
            );
            this.knifeRig.group.rotation.set(
              THREE.MathUtils.lerp(0, 0.4, p),
              THREE.MathUtils.lerp(0, -0.3, p),
              THREE.MathUtils.lerp(0, -0.5, p)
            );
          } else {
            const p = (progress - 0.3) / 0.7;
            this.knifeRig.group.position.set(
              THREE.MathUtils.lerp(0.28, -0.12, p),
              THREE.MathUtils.lerp(-0.16, -0.32, p),
              THREE.MathUtils.lerp(-0.36, -0.46, p)
            );
            this.knifeRig.group.rotation.set(
              THREE.MathUtils.lerp(0.4, 0.6, p),
              THREE.MathUtils.lerp(-0.3, 0.5, p),
              THREE.MathUtils.lerp(-0.5, 1.4, p)
            );
          }
        } else {
          if (progress < 0.4) {
            const p = progress / 0.4;
            this.knifeRig.group.position.set(0.25, -0.24, THREE.MathUtils.lerp(-0.42, -0.68, p));
            this.knifeRig.group.rotation.set(THREE.MathUtils.lerp(0, -0.2, p), 0, 0);
          } else {
            const p = (progress - 0.4) / 0.6;
            this.knifeRig.group.position.set(0.25, -0.24, THREE.MathUtils.lerp(-0.68, -0.42, p));
            this.knifeRig.group.rotation.set(THREE.MathUtils.lerp(-0.2, 0, p), 0, 0);
          }
        }
      } else {
        this.knifeRig.group.position.set(0.25, -0.24, -0.42);
        this.knifeRig.group.rotation.set(0, 0, 0);
      }
    }

    // Automatic weapon continuous fire check
    if (this.isFiring && WEAPONS[this.currentWeapon].isAutomatic) {
      this.triggerShoot();
    }

    // Reload completion check
    if (this.isReloading && now >= this.reloadEndTime) {
      this.isReloading = false;
      const wData = WEAPONS[this.currentWeapon];
      const cur = this.ammoState[this.currentWeapon];
      const needed = wData.magSize - cur.mag;
      const taken = Math.min(needed, cur.reserve);
      cur.mag += taken;
      cur.reserve -= taken;
    }

    // 4. Update AI Bots (Include local player, bots, and online remote players so 2v2 works with full humans or bots)
    const potentialTargets = [
      {
        id: this.localPlayerId,
        team: this.team,
        position: this.playerPos.clone(),
        isAlive: this.isAlive
      }
    ];

    this.botManager.getAllBots().forEach(bot => {
      potentialTargets.push({
        id: bot.id,
        team: bot.team,
        position: bot.position.clone(),
        isAlive: bot.isAlive
      });
    });

    if (this.isOnlineMode && this.isHost) {
      this.remotePlayers.forEach((rp, rpId) => {
        potentialTargets.push({
          id: rpId,
          team: rp.team,
          position: rp.position.clone().add(new THREE.Vector3(0, 1.6, 0)),
          isAlive: rp.health > 0
        });
      });
    }

    this.botManager.update(delta, potentialTargets);

    // 5. Update Remote Players lerp & visibility
    this.remotePlayers.forEach(rp => {
      if (rp.health > 0) {
        rp.position.lerp(rp.targetPos, delta * 14);
        rp.meshData.mesh.position.copy(rp.position);
        rp.meshData.mesh.rotation.y = rp.rotY;
        rp.meshData.mesh.visible = true;
      } else {
        rp.meshData.mesh.visible = false;
      }
    });

    // 6. Update Tracers
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const tr = this.bulletTracers[i];
      if (now >= tr.expire) {
        this.scene.remove(tr.obj);
        tr.obj.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
            else child.material.dispose();
          }
        });
        this.bulletTracers.splice(i, 1);
      }
    }

    // 7. Update Particles (Sparks & Blood)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (now >= p.expire) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      } else {
        const posAttr = p.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let j = 0; j < p.velocities.length; j++) {
          const v = p.velocities[j];
          v.y -= 9.8 * delta;
          posAttr.setXYZ(
            j,
            posAttr.getX(j) + v.x * delta,
            posAttr.getY(j) + v.y * delta,
            posAttr.getZ(j) + v.z * delta
          );
        }
        posAttr.needsUpdate = true;
      }
    }

    // 8. Spectate/round-wait timer when dead (Players respawn on next round in CS:GO elimination)
    if (!this.isAlive && this.respawnTimer > 0) {
      this.respawnTimer = Math.max(0, this.respawnTimer - delta);
    }

    // 9. Match timer countdown (Offline mode)
    if (!this.isOnlineMode && !this.roundEnded && this.roundTimeLeft > 0) {
      this.roundTimeLeft = Math.max(0, this.roundTimeLeft - delta);
      if (this.roundTimeLeft === 0) {
        this.triggerRoundEnd('draw', 'Hết thời gian thi đấu!');
      }
    }

    // 10. Network Position Sync (15Hz)
    if (this.isOnlineMode && this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (now - this.lastNetSend >= 66) {
        this.lastNetSend = now;
        this.ws.send(JSON.stringify({
          type: 'player_move',
          x: this.playerPos.x,
          y: this.playerPos.y,
          z: this.playerPos.z,
          rotY: this.yaw,
          pitch: this.pitch,
          weapon: this.currentWeapon
        }));
      }

      // If room host, also sync bot positions to other clients (15Hz)
      if (this.isHost && now - this.lastBotNetSend >= 66) {
        this.lastBotNetSend = now;
        this.botManager.getAllBots().forEach(bot => {
          if (bot.isAlive) {
            this.ws?.send(JSON.stringify({
              type: 'sync_bot',
              botId: bot.id,
              x: bot.position.x,
              y: bot.position.y,
              z: bot.position.z,
              rotY: bot.rotY,
              pitch: 0,
              weapon: bot.weapon
            }));
          }
        });
      }
    }

    // 11. Radar data collection (with full 3D coordinates and rotation)
    const allies: { x: number; y: number; z: number; name?: string; rotY?: number }[] = [];
    const enemies: { x: number; y: number; z: number; rotY?: number }[] = [];

    this.botManager.getAllBots().forEach(b => {
      if (b.isAlive) {
        if (b.team === this.team) {
          allies.push({ x: b.position.x, y: b.position.y, z: b.position.z, name: b.name, rotY: b.rotY });
        } else {
          enemies.push({ x: b.position.x, y: b.position.y, z: b.position.z, rotY: b.rotY });
        }
      }
    });

    this.remotePlayers.forEach(rp => {
      if (rp.health > 0) {
        if (rp.team === this.team) {
          allies.push({ x: rp.position.x, y: rp.position.y, z: rp.position.z, name: rp.name, rotY: rp.rotY });
        } else {
          enemies.push({ x: rp.position.x, y: rp.position.y, z: rp.position.z, rotY: rp.rotY });
        }
      }
    });

    this.callbacks.onRadarUpdate({
      playerPos: { x: this.playerPos.x, y: this.playerPos.y, z: this.playerPos.z, rotY: this.yaw },
      allies,
      enemies
    });

    // 12. Push HUD Update to React
    this.callbacks.onHUDUpdate({
      health: this.health,
      armor: this.armor,
      hasHelmet: this.hasHelmet,
      ammo: this.ammoState[this.currentWeapon].mag,
      reserveAmmo: this.ammoState[this.currentWeapon].reserve,
      weapon: this.currentWeapon,
      primaryWeapon: this.primaryWeapon,
      secondaryWeapon: this.secondaryWeapon,
      isReloading: this.isReloading,
      isScoped: this.scopeLevel > 0,
      scopeLevel: this.scopeLevel,
      redScore: this.redScore,
      blueScore: this.blueScore,
      round: this.currentRound,
      timeLeft: Math.ceil(this.roundTimeLeft),
      isLocked: this.isPointerLocked,
      hitMarker: false,
      isDead: !this.isAlive,
      respawnTimer: Math.ceil(this.respawnTimer)
    });

    // 13. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  };

  // Cleanup on unmount
  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animFrameId);
    this.unlock();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.bulletTracers.forEach(t => {
      this.scene.remove(t.obj);
      t.obj.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
          else child.material.dispose();
        }
      });
    });
    this.bulletDecals.forEach(d => {
      this.scene.remove(d);
      d.geometry.dispose();
    });
    this.knifeScratchDecals.forEach(d => {
      this.scene.remove(d);
      d.geometry.dispose();
    });
    this.particles.forEach(p => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    });

    this.botManager.clearAll();

    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
