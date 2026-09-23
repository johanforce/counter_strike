import * as THREE from 'three';
import {
  WeaponType,
  Team,
  GameMode,
  KillFeedEvent,
  GameSettings,
  WEAPONS
} from '../types/game';
import { textures } from './textures';
import {
  createFirstPersonAK47,
  createFirstPersonPistol,
  createFirstPersonKnife,
  createPlayerMesh
} from './models';
import { buildClassicMap, MapData } from './map';
import { sounds } from './audio';
import { BotManager, BotInstance } from './ai';

export interface GameEngineCallbacks {
  onHUDUpdate: (data: {
    health: number;
    ammo: number;
    reserveAmmo: number;
    weapon: WeaponType;
    isReloading: boolean;
    redScore: number;
    blueScore: number;
    round: number;
    timeLeft: number;
    isLocked: boolean;
    hitMarker: boolean;
    isDead: boolean;
    respawnTimer: number;
  }) => void;
  onKillFeed: (event: KillFeedEvent) => void;
  onRadarUpdate: (data: {
    playerPos: { x: number; z: number; rotY: number };
    allies: { x: number; z: number }[];
    enemies: { x: number; z: number }[];
  }) => void;
  onRoundStatus: (status: {
    show: boolean;
    winner?: 'red' | 'blue' | 'draw';
    message: string;
  }) => void;
  onConnectionChange: (connected: boolean) => void;
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

  // Player State
  public localPlayerId: string;
  public playerName: string;
  public team: Team;
  public mode: GameMode;
  public health: number = 100;
  public isAlive: boolean = true;
  public respawnTimer: number = 0;
  public currentWeapon: WeaponType = 'ak47';
  public ammoState: Record<WeaponType, { mag: number; reserve: number }> = {
    ak47: { mag: 30, reserve: 90 },
    pistol: { mag: 12, reserve: 36 },
    knife: { mag: 1, reserve: 0 }
  };
  public isReloading: boolean = false;
  public reloadEndTime: number = 0;

  // First-person viewmodels
  private fpCameraRig: THREE.Group;
  private ak47Rig: ReturnType<typeof createFirstPersonAK47>;
  private pistolRig: ReturnType<typeof createFirstPersonPistol>;
  private knifeRig: ReturnType<typeof createFirstPersonKnife>;
  private muzzleFlashSprite: THREE.Sprite;
  private muzzleFlashLight: THREE.PointLight;

  // Knife Combat Visuals
  private knifeSwingTime: number = 0;
  private knifeSwingType: 'slash' | 'stab' = 'slash';

  // Movement & Camera Controls
  private playerPos = new THREE.Vector3(-28, 1.6, -28);
  private playerVelocity = new THREE.Vector3();
  private yaw: number = 0;
  private pitch: number = 0;
  private isGrounded: boolean = false;
  private isCrouching: boolean = false;
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
  private botManager: BotManager;

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
  private bulletTracers: { line: THREE.Line; expire: number }[] = [];
  private bulletDecals: THREE.Mesh[] = [];
  private knifeScratchDecals: THREE.Mesh[] = [];
  private particles: { mesh: THREE.Points; velocities: THREE.Vector3[]; expire: number }[] = [];

  // Match State
  private redScore: number = 0;
  private blueScore: number = 0;
  private currentRound: number = 1;
  private roundTimeLeft: number = 90;
  private roundEnded: boolean = false;

  // Network WebSocket
  private ws: WebSocket | null = null;
  private lastNetSend: number = 0;
  private isOnlineMode: boolean = false;
  private roomCode: string = '';

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
    }
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.settings = options.settings;
    this.playerName = options.playerName;
    this.team = options.team;
    this.mode = options.mode;
    this.isOnlineMode = options.isOnline;
    this.roomCode = options.roomCode || 'SOLO_' + Math.random().toString(36).substring(2, 6).toUpperCase();
    this.localPlayerId = options.localPlayerId || ('player_' + Math.random().toString(36).substring(2, 9));

    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x9a8365, 0.008);

    this.camera = new THREE.PerspectiveCamera(
      this.settings.fov || 75,
      container.clientWidth / container.clientHeight,
      0.05,
      400
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
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
    const mySpawn = this.mapData.spawns[this.team][0];
    this.playerPos.set(mySpawn.x, mySpawn.y, mySpawn.z);
    this.yaw = mySpawn.rotY;

    // 4. First-Person Viewmodels Rig attached to Camera
    this.fpCameraRig = new THREE.Group();
    this.camera.add(this.fpCameraRig);
    this.scene.add(this.camera);

    this.ak47Rig = createFirstPersonAK47();
    this.ak47Rig.group.position.set(0.24, -0.22, -0.45);
    this.ak47Rig.group.visible = false;
    this.fpCameraRig.add(this.ak47Rig.group);

    this.pistolRig = createFirstPersonPistol();
    this.pistolRig.group.position.set(0.22, -0.2, -0.4);
    this.pistolRig.group.visible = false;
    this.fpCameraRig.add(this.pistolRig.group);

    this.knifeRig = createFirstPersonKnife();
    this.knifeRig.group.position.set(0.25, -0.24, -0.42);
    this.knifeRig.group.visible = false;
    this.fpCameraRig.add(this.knifeRig.group);

    // Muzzle flash particle sprite for firearms
    const flashTex = textures.getMuzzleFlashSprite();
    const flashMat = new THREE.SpriteMaterial({ map: flashTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    this.muzzleFlashSprite = new THREE.Sprite(flashMat);
    this.muzzleFlashSprite.scale.set(0.35, 0.35, 0.35);
    this.muzzleFlashSprite.visible = false;
    this.fpCameraRig.add(this.muzzleFlashSprite);

    this.muzzleFlashLight = new THREE.PointLight(0xffaa22, 0, 8);
    this.fpCameraRig.add(this.muzzleFlashLight);

    // Force set weapon to AK47 and ensure ONLY AK47 is visible
    this.setWeapon('ak47', true);

    // 5. Bot Manager for Solo and Filling Teams
    this.botManager = new BotManager(
      this.scene,
      this.mapData.patrolPoints,
      this.mapData.colliders,
      (bot, origin, dir) => this.handleBotShoot(bot, origin, dir),
      (bot, victimId, isHeadshot) => this.handleBotKill(bot, victimId, isHeadshot)
    );

    // Populate Bots if offline or needed
    if (!this.isOnlineMode) {
      this.setupOfflineMatch(options.botDifficulty || 'normal');
    } else {
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
    if (msg.type === 'joined_room' || msg.type === 'player_joined') {
      if (msg.room) {
        this.redScore = msg.room.redScore;
        this.blueScore = msg.room.blueScore;
        this.currentRound = msg.room.round;
        this.roundTimeLeft = msg.room.roundTimeLeft;

        msg.room.players.forEach((p: any) => {
          if (p.id !== this.localPlayerId) {
            this.upsertRemotePlayer(p);
          }
        });
      }
    } else if (msg.type === 'player_moved' && msg.id && msg.id !== this.localPlayerId) {
      const rp = this.remotePlayers.get(msg.id);
      if (rp) {
        rp.targetPos.set(msg.x || 0, (msg.y || 0) - 1.6, msg.z || 0);
        rp.rotY = msg.rotY || 0;
        if (msg.weapon && msg.weapon !== rp.weapon) {
          rp.weapon = msg.weapon;
          rp.meshData.updateWeapon(msg.weapon);
        }
      }
    } else if (msg.type === 'player_shot' && msg.shooterId && msg.shooterId !== this.localPlayerId) {
      if (msg.weapon === 'ak47') sounds.playAK47Shot();
      else if (msg.weapon === 'pistol') sounds.playPistolShot();
      else sounds.playKnifeSlash();

      if (msg.weapon !== 'knife' && msg.origin && msg.direction) {
        const from = new THREE.Vector3(msg.origin.x, msg.origin.y, msg.origin.z);
        const dir = new THREE.Vector3(msg.direction.x, msg.direction.y, msg.direction.z);
        const to = from.clone().add(dir.clone().multiplyScalar(40));
        this.createBulletTracer(from, to, 40);
      }
    } else if (msg.type === 'player_damaged') {
      if (msg.targetId === this.localPlayerId) {
        this.takeDamage(msg.damage || 20, false, 'Remote');
      } else {
        const rp = this.remotePlayers.get(msg.targetId || '');
        if (rp) {
          rp.health = msg.damage ? Math.max(0, rp.health - msg.damage) : 100;
          rp.meshData.updateHealthTag(rp.health);
        }
      }
    } else if (msg.type === 'player_killed') {
      this.callbacks.onKillFeed({
        id: 'kf_' + Math.random(),
        killerName: msg.killerName || 'Unknown',
        killerTeam: msg.killerTeam || 'red',
        victimName: msg.victimName || 'Unknown',
        victimTeam: msg.victimTeam || 'blue',
        weapon: msg.weapon || 'ak47',
        isHeadshot: !!msg.isHeadshot,
        timestamp: Date.now()
      });

      if (msg.victimId === this.localPlayerId) {
        this.handlePlayerDeath(msg.killerName || 'Đối thủ');
      }
    } else if (msg.type === 'round_started') {
      this.roundEnded = false;
      this.respawnLocalPlayer();
      this.callbacks.onRoundStatus({ show: false, message: '' });
      sounds.playRoundStart();
    } else if (msg.type === 'round_ended') {
      this.roundEnded = true;
      const won = msg.winner === this.team;
      if (won) sounds.playWinSound();
      else sounds.playDefeatSound();

      this.callbacks.onRoundStatus({
        show: true,
        winner: msg.winner,
        message: msg.reason || (won ? 'CHIẾN THẮNG!' : 'THẤT BẠI!')
      });
    }
  }

  private upsertRemotePlayer(p: any) {
    let rp = this.remotePlayers.get(p.id);
    if (!rp) {
      const meshData = createPlayerMesh(p.team, p.name);
      this.scene.add(meshData.mesh);
      rp = {
        meshData,
        position: new THREE.Vector3(p.x, p.y - 1.6, p.z),
        targetPos: new THREE.Vector3(p.x, p.y - 1.6, p.z),
        rotY: p.rotY,
        team: p.team,
        name: p.name,
        health: p.health,
        weapon: p.weapon
      };
      this.remotePlayers.set(p.id, rp);
    }
    rp.targetPos.set(p.x, p.y - 1.6, p.z);
    rp.rotY = p.rotY;
    rp.health = p.health;
    rp.meshData.updateHealthTag(p.health);
    rp.meshData.updateWeapon(p.weapon);
  }

  // Setup Key and Mouse Listeners (Supporting Vietnamese keyboard/IME layout & direct hold)
  private setupInputs() {
    const isForward = (e: KeyboardEvent) => {
      const k = e.key ? e.key.toLowerCase() : '';
      return e.code === 'KeyW' || k === 'w' || k === 'ư' || e.code === 'ArrowUp';
    };
    const isBackward = (e: KeyboardEvent) => {
      const k = e.key ? e.key.toLowerCase() : '';
      return e.code === 'KeyS' || k === 's' || e.code === 'ArrowDown';
    };
    const isLeft = (e: KeyboardEvent) => {
      const k = e.key ? e.key.toLowerCase() : '';
      return e.code === 'KeyA' || k === 'a' || e.code === 'ArrowLeft';
    };
    const isRight = (e: KeyboardEvent) => {
      const k = e.key ? e.key.toLowerCase() : '';
      return e.code === 'KeyD' || k === 'd' || e.code === 'ArrowRight';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isForward(e)) { this.moveForward = true; }
      if (isBackward(e)) { this.moveBackward = true; }
      if (isLeft(e)) { this.moveLeft = true; }
      if (isRight(e)) { this.moveRight = true; }

      // Weapon slots (1: AK-47, 2: Pistol, 3: Knife)
      if (e.code === 'Digit1') this.setWeapon('ak47');
      if (e.code === 'Digit2') this.setWeapon('pistol');
      if (e.code === 'Digit3') this.setWeapon('knife');

      // Reload
      if (e.code === 'KeyR' || (e.key && e.key.toLowerCase() === 'r')) {
        this.reloadWeapon();
      }

      // Jump
      if (e.code === 'Space' && this.isGrounded && this.isAlive) {
        this.playerVelocity.y = 6.8;
        this.isGrounded = false;
      }

      // Crouch
      if (e.code === 'KeyC' || e.code === 'ControlLeft' || (e.key && e.key.toLowerCase() === 'c')) {
        this.isCrouching = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isForward(e)) { this.moveForward = false; }
      if (isBackward(e)) { this.moveBackward = false; }
      if (isLeft(e)) { this.moveLeft = false; }
      if (isRight(e)) { this.moveRight = false; }

      if (e.code === 'KeyC' || e.code === 'ControlLeft' || (e.key && e.key.toLowerCase() === 'c')) {
        this.isCrouching = false;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
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

      const sens = (this.settings.mouseSensitivity || 1.0) * 0.0022;
      const invert = this.settings.invertY ? -1 : 1;

      this.yaw -= (e.movementX || 0) * sens;
      this.pitch -= (e.movementY || 0) * sens * invert;

      // Clamp pitch to avoid gimbal flip (-88 to 88 degrees)
      const maxPitch = Math.PI / 2 - 0.04;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    };

    const onWheel = (e: WheelEvent) => {
      const order: WeaponType[] = ['ak47', 'pistol', 'knife'];
      const curIdx = order.indexOf(this.currentWeapon);
      const nextIdx = e.deltaY > 0 ? (curIdx + 1) % 3 : (curIdx - 1 + 3) % 3;
      this.setWeapon(order[nextIdx]);
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onBlur = () => {
      this.moveForward = false;
      this.moveBackward = false;
      this.moveLeft = false;
      this.moveRight = false;
      this.isCrouching = false;
      this.isFiring = false;
      this.isMouseDown = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    this.container.addEventListener('wheel', onWheel);
    this.container.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', onBlur);

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
      this.callbacks.onHUDUpdate({
        health: this.health,
        ammo: this.ammoState[this.currentWeapon].mag,
        reserveAmmo: this.ammoState[this.currentWeapon].reserve,
        weapon: this.currentWeapon,
        isReloading: this.isReloading,
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
    this.container.requestPointerLock?.();
  }

  public unlock() {
    document.exitPointerLock?.();
  }

  public setWeapon(weapon: WeaponType, force: boolean = false) {
    if (!force && this.currentWeapon === weapon && !this.isReloading) return;
    this.currentWeapon = weapon;
    this.isReloading = false;

    // Viewmodel visibility - strictly ensure only the active weapon is visible
    this.ak47Rig.group.visible = weapon === 'ak47';
    this.pistolRig.group.visible = weapon === 'pistol';
    this.knifeRig.group.visible = weapon === 'knife';

    // Quick draw recoil kick
    this.recoilPitch = 0.04;
  }

  public reloadWeapon() {
    if (this.currentWeapon === 'knife') return;
    if (this.isReloading || !this.isAlive) return;

    const wData = WEAPONS[this.currentWeapon];
    const cur = this.ammoState[this.currentWeapon];
    if (cur.mag >= wData.magSize || cur.reserve <= 0) return;

    this.isReloading = true;
    this.reloadEndTime = performance.now() + wData.reloadTime;
    sounds.playReload();
  }

  // Firearms shooting logic (AK-47 / Pistol)
  private triggerShoot() {
    if (!this.isAlive || this.isReloading) return;
    if (this.currentWeapon === 'knife') return;

    const wData = WEAPONS[this.currentWeapon];
    const now = performance.now();

    if (now - this.lastFireTime < wData.fireRate) return;

    const ammo = this.ammoState[this.currentWeapon];
    if (ammo.mag <= 0) {
      this.reloadWeapon();
      return;
    }

    this.lastFireTime = now;
    ammo.mag--;

    // Play gunshot sound
    if (wData.id === 'ak47') sounds.playAK47Shot();
    else if (wData.id === 'pistol') sounds.playPistolShot();

    // Recoil Kick
    this.recoilPitch += wData.recoilKick;
    this.recoilYaw += (Math.random() - 0.5) * (wData.recoilKick * 0.5);

    // Muzzle Flash effect
    this.triggerMuzzleFlash();

    // Raycast hit detection for bullets
    this.performGunRaycast(wData);

    // Broadcast shoot to WS
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const eyePos = this.camera.position;
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);

      this.ws.send(JSON.stringify({
        type: 'player_shoot',
        weapon: this.currentWeapon,
        origin: { x: eyePos.x, y: eyePos.y, z: eyePos.z },
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

    // Play knife whoosh slash sound
    sounds.playKnifeSlash();

    // Short-range melee raycast (2.5m slash, 2.8m stab)
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
        // ENEMY FLESH HIT
        const isHead = hitbox === 'head';
        const baseDmg = isHeavy ? 85 : 55;
        const damage = isHead ? 100 : baseDmg;

        sounds.playKnifeHit();
        this.createBloodParticles(hit.point);

        // Flash Hitmarker
        this.callbacks.onHUDUpdate({
          health: this.health,
          ammo: 1,
          reserveAmmo: 0,
          weapon: 'knife',
          isReloading: false,
          redScore: this.redScore,
          blueScore: this.blueScore,
          round: this.currentRound,
          timeLeft: this.roundTimeLeft,
          isLocked: this.isPointerLocked,
          hitMarker: true,
          isDead: !this.isAlive,
          respawnTimer: this.respawnTimer
        });

        // Apply damage to bot
        const botId = hitObj.userData?.playerId;
        if (botId && this.botManager.getBot(botId)) {
          const killed = this.botManager.applyDamage(botId, damage, isHead, this.localPlayerId);
          if (killed) {
            const bot = this.botManager.getBot(botId)!;
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
        // WALL / CRATE KNIFE CUT
        sounds.playKnifeHitWall();
        this.createKnifeScratchDecal(hit.point, hit.face?.normal || new THREE.Vector3(0, 0, 1));
        this.createSparkParticles(hit.point);
      }
    }
  }

  private triggerMuzzleFlash() {
    if (this.currentWeapon === 'knife') return;

    let muzzleOffset = new THREE.Vector3(0.24, -0.2, -0.8);
    if (this.currentWeapon === 'pistol') {
      muzzleOffset.set(0.22, -0.17, -0.5);
    }

    this.muzzleFlashSprite.position.copy(muzzleOffset);
    this.muzzleFlashSprite.visible = true;
    this.muzzleFlashLight.position.copy(muzzleOffset);
    this.muzzleFlashLight.intensity = 2.5;

    setTimeout(() => {
      this.muzzleFlashSprite.visible = false;
      this.muzzleFlashLight.intensity = 0;
    }, 45);
  }

  private performGunRaycast(wData: typeof WEAPONS[WeaponType]) {
    const raycaster = new THREE.Raycaster();

    // Spread calculation
    const spread = (Math.random() - 0.5) * wData.spread;
    const spreadY = (Math.random() - 0.5) * wData.spread;

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

    const muzzleWorld = new THREE.Vector3();
    this.camera.getWorldPosition(muzzleWorld);
    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    muzzleWorld.add(cameraDir.clone().multiplyScalar(0.4));
    muzzleWorld.add(new THREE.Vector3(0.18, -0.15, 0));

    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitObj = hit.object;
      const hitboxType = hitObj.userData?.hitbox;

      this.createBulletTracer(muzzleWorld, hit.point, 1);

      if (hitboxType) {
        // ENEMY HIT!
        const isHeadshot = hitboxType === 'head';
        const mult = isHeadshot ? wData.headshotMultiplier : hitboxType === 'legs' ? 0.75 : 1.0;
        const damage = Math.round(wData.damage * mult);

        if (isHeadshot) sounds.playHeadshot();
        else sounds.playHitmarker();

        // Flash Hitmarker on HUD
        this.callbacks.onHUDUpdate({
          health: this.health,
          ammo: this.ammoState[this.currentWeapon].mag,
          reserveAmmo: this.ammoState[this.currentWeapon].reserve,
          weapon: this.currentWeapon,
          isReloading: this.isReloading,
          redScore: this.redScore,
          blueScore: this.blueScore,
          round: this.currentRound,
          timeLeft: this.roundTimeLeft,
          isLocked: this.isPointerLocked,
          hitMarker: true,
          isDead: !this.isAlive,
          respawnTimer: this.respawnTimer
        });

        // Apply to Bot
        const botId = hitObj.userData?.playerId;
        if (botId && this.botManager.getBot(botId)) {
          const killed = this.botManager.applyDamage(botId, damage, isHeadshot, this.localPlayerId);
          if (killed) {
            const bot = this.botManager.getBot(botId)!;
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
        // Hit wall / obstacle: place bullet hole decal
        if (hit.face) {
          this.createBulletHole(hit.point, hit.face.normal);
        }
      }
    } else {
      // Missed into distance: tracer extends to max range
      const endPoint = muzzleWorld.clone().add(cameraDir.clone().multiplyScalar(60));
      this.createBulletTracer(muzzleWorld, endPoint, 60);
    }
  }

  private createBulletTracer(from: THREE.Vector3, to: THREE.Vector3, _dist: number) {
    const points = [from, to];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffea88,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.bulletTracers.push({ line, expire: performance.now() + 65 });
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

    // Check if hit player
    const eyePos = this.playerPos.clone();
    const toPlayer = eyePos.clone().sub(origin);
    const proj = toPlayer.dot(dir);

    if (proj > 0 && proj < 45) {
      const closestPoint = origin.clone().add(dir.clone().multiplyScalar(proj));
      const dist = closestPoint.distanceTo(eyePos);

      // Hitbox cylinder check
      if (dist < 0.65 && this.isAlive) {
        const isHead = closestPoint.y > eyePos.y - 0.2;
        const wData = WEAPONS[bot.weapon];
        const mult = isHead ? wData.headshotMultiplier : 1.0;
        const dmg = Math.round(wData.damage * mult * 0.85); // bot balance
        this.takeDamage(dmg, isHead, bot.name);

        if (this.health <= 0) {
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
          this.handlePlayerDeath(bot.name);
        }
      }
    }
  }

  private handleBotKill(bot: BotInstance, victimId: string, isHeadshot: boolean) {
    const victim = this.botManager.getBot(victimId);
    if (victim) {
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

  public takeDamage(amount: number, _isHeadshot: boolean, _attackerName: string) {
    if (!this.isAlive) return;

    this.health = Math.max(0, this.health - amount);
    sounds.playPlayerHurt();

    // Camera flinch
    this.pitch += 0.04;
    this.yaw += (Math.random() - 0.5) * 0.05;

    if (this.health === 0) {
      this.handlePlayerDeath(_attackerName);
    }
  }

  private handlePlayerDeath(_killerName: string) {
    this.isAlive = false;
    this.respawnTimer = 3.5;
    sounds.playDefeatSound();

    if (!this.isOnlineMode) {
      setTimeout(() => {
        this.checkOfflineRoundWin();
      }, 500);
    }
  }

  private respawnLocalPlayer() {
    this.health = 100;
    this.isAlive = true;
    this.respawnTimer = 0;
    this.ammoState.ak47.mag = 30;
    this.ammoState.pistol.mag = 12;

    const mySpawn = this.mapData.spawns[this.team][0];
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

    if (redAlive === 0) {
      this.blueScore++;
      this.triggerRoundEnd('blue', 'Đội Xanh tiêu diệt toàn bộ đối thủ!');
    } else if (blueAlive === 0) {
      this.redScore++;
      this.triggerRoundEnd('red', 'Đội Đỏ tiêu diệt toàn bộ đối thủ!');
    }
  }

  private triggerRoundEnd(winner: Team | 'draw', message: string) {
    this.roundEnded = true;
    const playerWon = winner === this.team;
    if (playerWon) sounds.playWinSound();
    else sounds.playDefeatSound();

    this.callbacks.onRoundStatus({
      show: true,
      winner,
      message
    });

    setTimeout(() => {
      this.currentRound++;
      this.roundTimeLeft = 90;
      this.roundEnded = false;
      this.respawnLocalPlayer();

      // Respawn all bots
      this.botManager.getAllBots().forEach(bot => {
        const spawn = this.mapData.spawns[bot.team][0];
        this.botManager.respawnBot(bot, spawn);
      });

      this.callbacks.onRoundStatus({ show: false, message: '' });
      sounds.playRoundStart();
    }, 4000);
  }

  // Physics & Collision Update (Smooth sliding AABB, NO trapping or getting stuck)
  private updatePhysics(delta: number) {
    if (!this.isAlive) return;

    // Camera look vectors
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    // Desired move direction using direct input flags
    const moveDir = new THREE.Vector3();
    if (this.moveForward) moveDir.add(forward);
    if (this.moveBackward) moveDir.sub(forward);
    if (this.moveRight) moveDir.add(right);
    if (this.moveLeft) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) {
      moveDir.normalize();
    }

    const baseSpeed = this.isCrouching ? 3.0 : 6.5;
    const accel = this.isGrounded ? 45 : 16;

    // Apply acceleration
    this.playerVelocity.x += moveDir.x * accel * delta;
    this.playerVelocity.z += moveDir.z * accel * delta;

    // Ground friction
    const friction = this.isGrounded ? 8.5 : 1.5;
    this.playerVelocity.x -= this.playerVelocity.x * friction * delta;
    this.playerVelocity.z -= this.playerVelocity.z * friction * delta;

    // Clamp horizontal speed
    const horizSpeed = Math.sqrt(this.playerVelocity.x ** 2 + this.playerVelocity.z ** 2);
    if (horizSpeed > baseSpeed) {
      this.playerVelocity.x = (this.playerVelocity.x / horizSpeed) * baseSpeed;
      this.playerVelocity.z = (this.playerVelocity.z / horizSpeed) * baseSpeed;
    }

    // Gravity
    this.playerVelocity.y -= 19.8 * delta;

    // Smooth sliding collision check
    const radius = 0.42;
    const eyeHeight = this.isCrouching ? 1.05 : 1.6;

    this.moveWithCollisions(delta, radius, eyeHeight);

    // Footsteps sound
    if (isMoving && this.isGrounded) {
      this.stepTimer += delta;
      const stepInterval = this.isCrouching ? 0.5 : 0.34;
      if (this.stepTimer >= stepInterval) {
        sounds.playFootstep();
        this.stepTimer = 0;
      }
    } else {
      this.stepTimer = 0.2;
    }

    // Head Bobbing calculation
    if (isMoving && this.isGrounded) {
      this.bobTimer += delta * (this.isCrouching ? 7 : 12);
    }
  }

  // Smooth sliding collision along separate axes
  private moveWithCollisions(delta: number, radius: number, eyeHeight: number) {
    const feetY = this.playerPos.y - eyeHeight;
    const headY = this.playerPos.y + 0.2;

    // 1. Move X & check collision
    const oldX = this.playerPos.x;
    this.playerPos.x += this.playerVelocity.x * delta;

    for (const b of this.mapData.colliders) {
      if (headY > b.minY && feetY < b.maxY) {
        if (
          this.playerPos.x + radius > b.minX &&
          this.playerPos.x - radius < b.maxX &&
          this.playerPos.z + radius > b.minZ &&
          this.playerPos.z - radius < b.maxZ
        ) {
          if (this.playerVelocity.x > 0) {
            this.playerPos.x = b.minX - radius;
          } else if (this.playerVelocity.x < 0) {
            this.playerPos.x = b.maxX + radius;
          } else {
            this.playerPos.x = oldX;
          }
          this.playerVelocity.x = 0;
          break;
        }
      }
    }

    // 2. Move Z & check collision
    const oldZ = this.playerPos.z;
    this.playerPos.z += this.playerVelocity.z * delta;

    for (const b of this.mapData.colliders) {
      if (headY > b.minY && feetY < b.maxY) {
        if (
          this.playerPos.x + radius > b.minX &&
          this.playerPos.x - radius < b.maxX &&
          this.playerPos.z + radius > b.minZ &&
          this.playerPos.z - radius < b.maxZ
        ) {
          if (this.playerVelocity.z > 0) {
            this.playerPos.z = b.minZ - radius;
          } else if (this.playerVelocity.z < 0) {
            this.playerPos.z = b.maxZ + radius;
          } else {
            this.playerPos.z = oldZ;
          }
          this.playerVelocity.z = 0;
          break;
        }
      }
    }

    // 3. Move Y
    this.playerPos.y += this.playerVelocity.y * delta;

    // Floor check (y = 0)
    if (this.playerPos.y <= eyeHeight) {
      this.playerPos.y = eyeHeight;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
      // Also check elevated crates and catwalk
      for (const box of this.mapData.colliders) {
        if (
          this.playerPos.x + radius > box.minX &&
          this.playerPos.x - radius < box.maxX &&
          this.playerPos.z + radius > box.minZ &&
          this.playerPos.z - radius < box.maxZ
        ) {
          if (
            this.playerPos.y - eyeHeight >= box.maxY - 0.35 &&
            this.playerPos.y - eyeHeight <= box.maxY + 0.4 &&
            this.playerVelocity.y <= 0
          ) {
            this.playerPos.y = box.maxY + eyeHeight;
            this.playerVelocity.y = 0;
            this.isGrounded = true;
            break;
          }
        }
      }
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

    // Smoothly recover recoil
    this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, delta * 14);
    this.recoilYaw = THREE.MathUtils.lerp(this.recoilYaw, 0, delta * 14);

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = targetYaw;
    this.camera.rotation.x = targetPitch;

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

    // Knife Attack Animation (Slash arc or heavy thrust)
    if (this.currentWeapon === 'knife') {
      const knifeElapsed = (now - this.knifeSwingTime) / 1000;
      const swingDur = this.knifeSwingType === 'stab' ? 0.32 : 0.24;
      if (knifeElapsed < swingDur) {
        const progress = knifeElapsed / swingDur;
        if (this.knifeSwingType === 'slash') {
          // Slash: pulls back and up, then cuts violently across screen
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
          // Heavy stab: thrust forward sharply
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
        // Return to rest pose
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

    // 4. Update AI Bots
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

    this.botManager.update(delta, potentialTargets);

    // 5. Update Remote Players lerp
    this.remotePlayers.forEach(rp => {
      rp.position.lerp(rp.targetPos, delta * 12);
      rp.meshData.mesh.position.copy(rp.position);
      rp.meshData.mesh.rotation.y = rp.rotY;
    });

    // 6. Update Tracers
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const tr = this.bulletTracers[i];
      if (now >= tr.expire) {
        this.scene.remove(tr.line);
        tr.line.geometry.dispose();
        (tr.line.material as THREE.Material).dispose();
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
          v.y -= 9.8 * delta; // gravity
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

    // 8. Respawn countdown
    if (!this.isAlive && this.respawnTimer > 0) {
      this.respawnTimer = Math.max(0, this.respawnTimer - delta);
      if (this.respawnTimer === 0) {
        this.respawnLocalPlayer();
      }
    }

    // 9. Match timer countdown
    if (!this.roundEnded && this.roundTimeLeft > 0) {
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
    }

    // 11. Radar data collection
    const allies: { x: number; z: number }[] = [];
    const enemies: { x: number; z: number }[] = [];

    this.botManager.getAllBots().forEach(b => {
      if (b.isAlive) {
        if (b.team === this.team) allies.push({ x: b.position.x, z: b.position.z });
        else enemies.push({ x: b.position.x, z: b.position.z });
      }
    });

    this.remotePlayers.forEach(rp => {
      if (rp.health > 0) {
        if (rp.team === this.team) allies.push({ x: rp.position.x, z: rp.position.z });
        else enemies.push({ x: rp.position.x, z: rp.position.z });
      }
    });

    this.callbacks.onRadarUpdate({
      playerPos: { x: this.playerPos.x, z: this.playerPos.z, rotY: this.yaw },
      allies,
      enemies
    });

    // 12. Push HUD Update to React
    this.callbacks.onHUDUpdate({
      health: this.health,
      ammo: this.ammoState[this.currentWeapon].mag,
      reserveAmmo: this.ammoState[this.currentWeapon].reserve,
      weapon: this.currentWeapon,
      isReloading: this.isReloading,
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
      this.scene.remove(t.line);
      t.line.geometry.dispose();
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
