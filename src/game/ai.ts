import * as THREE from 'three';
import { BotDifficulty, Team, WeaponType, WEAPONS } from '../types/game';
import { CollisionBox } from './map';
import { createPlayerMesh } from './models';
import { sounds } from './audio';

export interface BotInstance {
  id: string;
  name: string;
  team: Team;
  meshData: ReturnType<typeof createPlayerMesh>;
  health: number;
  isAlive: boolean;
  weapon: WeaponType;
  kills: number;
  deaths: number;
  difficulty: BotDifficulty;
  currentWaypointIdx: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotY: number;
  targetPos: THREE.Vector3 | null;
  lastShotTime: number;
  burstCount: number;
  strafeTimer: number;
  strafeDir: number;
  recoilTimer: number;
  deathTimer: number;
}

export class BotManager {
  private bots: Map<string, BotInstance> = new Map();
  private waypoints: THREE.Vector3[] = [];
  private colliders: CollisionBox[] = [];
  private scene: THREE.Scene;
  private onBotShoot: (bot: BotInstance, origin: THREE.Vector3, dir: THREE.Vector3) => void;
  private onBotKill: (bot: BotInstance, victimId: string, isHeadshot: boolean) => void;

  constructor(
    scene: THREE.Scene,
    waypoints: THREE.Vector3[],
    colliders: CollisionBox[],
    onBotShoot: (bot: BotInstance, origin: THREE.Vector3, dir: THREE.Vector3) => void,
    onBotKill: (bot: BotInstance, victimId: string, isHeadshot: boolean) => void
  ) {
    this.scene = scene;
    this.waypoints = waypoints;
    this.colliders = colliders;
    this.onBotShoot = onBotShoot;
    this.onBotKill = onBotKill;
  }

  public addBot(
    id: string,
    name: string,
    team: Team,
    spawnPos: { x: number; y: number; z: number; rotY: number },
    difficulty: BotDifficulty = 'normal'
  ): BotInstance {
    const meshData = createPlayerMesh(team, name);
    meshData.mesh.position.set(spawnPos.x, spawnPos.y - 1.6, spawnPos.z);
    meshData.mesh.rotation.y = spawnPos.rotY;
    this.scene.add(meshData.mesh);

    // Pick closest waypoint to start
    let bestIdx = 0;
    let bestDist = Infinity;
    this.waypoints.forEach((wp, idx) => {
      const d = wp.distanceTo(new THREE.Vector3(spawnPos.x, spawnPos.y, spawnPos.z));
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });

    const bot: BotInstance = {
      id,
      name,
      team,
      meshData,
      health: 100,
      isAlive: true,
      weapon: 'ak47',
      kills: 0,
      deaths: 0,
      difficulty,
      currentWaypointIdx: bestIdx,
      position: new THREE.Vector3(spawnPos.x, spawnPos.y, spawnPos.z),
      velocity: new THREE.Vector3(),
      rotY: spawnPos.rotY,
      targetPos: null,
      lastShotTime: 0,
      burstCount: 0,
      strafeTimer: 0,
      strafeDir: 1,
      recoilTimer: 0,
      deathTimer: 0,
    };

    // Tag meshes with bot id
    meshData.headMesh.userData = { hitbox: 'head', playerId: id, isBot: true };
    meshData.bodyMesh.userData = { hitbox: 'body', playerId: id, isBot: true };
    meshData.legsMesh.children.forEach(c => {
      c.userData = { hitbox: 'legs', playerId: id, isBot: true };
    });

    this.bots.set(id, bot);
    return bot;
  }

  public getBot(id: string): BotInstance | undefined {
    return this.bots.get(id);
  }

  public getAllBots(): BotInstance[] {
    return Array.from(this.bots.values());
  }

  public removeBot(id: string) {
    const bot = this.bots.get(id);
    if (bot) {
      this.scene.remove(bot.meshData.mesh);
      this.bots.delete(id);
    }
  }

  public clearAll() {
    this.bots.forEach(bot => {
      this.scene.remove(bot.meshData.mesh);
    });
    this.bots.clear();
  }

  public applyDamage(botId: string, damage: number, isHeadshot: boolean, attackerId: string): boolean {
    const bot = this.bots.get(botId);
    if (!bot || !bot.isAlive) return false;

    bot.health = Math.max(0, bot.health - damage);
    bot.meshData.updateHealthTag(bot.health);

    if (bot.health === 0) {
      bot.isAlive = false;
      bot.deaths++;
      bot.deathTimer = 1.5; // Ragdoll/fall down
      return true; // was killed
    }
    return false;
  }

  public respawnBot(bot: BotInstance, spawn: { x: number; y: number; z: number; rotY: number }) {
    bot.health = 100;
    bot.isAlive = true;
    bot.position.set(spawn.x, spawn.y, spawn.z);
    bot.rotY = spawn.rotY;
    bot.weapon = 'ak47';
    bot.meshData.updateWeapon('ak47');
    bot.meshData.updateHealthTag(100);
    bot.meshData.mesh.position.set(spawn.x, spawn.y - 1.6, spawn.z);
    bot.meshData.mesh.rotation.set(0, spawn.rotY, 0);
  }

  // Check line of sight avoiding solid walls
  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    dir.normalize();
    const ray = new THREE.Ray(from, dir);

    for (const box of this.colliders) {
      const b3 = new THREE.Box3(
        new THREE.Vector3(box.minX, box.minY, box.minZ),
        new THREE.Vector3(box.maxX, box.maxY, box.maxZ)
      );
      const hit = ray.intersectBox(b3, new THREE.Vector3());
      if (hit) {
        if (hit.distanceTo(from) < dist - 0.5) {
          return false; // Obstructed by wall
        }
      }
    }
    return true;
  }

  public update(
    delta: number,
    potentialTargets: { id: string; team: Team; position: THREE.Vector3; isAlive: boolean }[]
  ) {
    const now = performance.now();

    this.bots.forEach(bot => {
      if (!bot.isAlive) {
        // Death fall animation
        if (bot.deathTimer > 0) {
          bot.deathTimer -= delta;
          bot.meshData.mesh.rotation.x = Math.min(Math.PI / 2, bot.meshData.mesh.rotation.x + delta * 3);
          bot.meshData.mesh.position.y = Math.max(0.1, bot.meshData.mesh.position.y - delta * 2);
        }
        return;
      }

      // Find best opposing target in line of sight
      let activeTarget: { id: string; position: THREE.Vector3 } | null = null;
      let closestDist = Infinity;

      for (const t of potentialTargets) {
        if (t.isAlive && t.team !== bot.team && t.id !== bot.id) {
          const d = bot.position.distanceTo(t.position);
          if (d < 45 && d < closestDist) {
            const eyePos = bot.position.clone().setY(bot.position.y);
            const targetEyePos = t.position.clone();
            if (this.hasLineOfSight(eyePos, targetEyePos)) {
              closestDist = d;
              activeTarget = { id: t.id, position: t.position };
            }
          }
        }
      }

      let moveTarget: THREE.Vector3;
      let moveSpeed = 4.2; // m/s

      if (activeTarget) {
        // Combat state: Face target
        const dx = activeTarget.position.x - bot.position.x;
        const dz = activeTarget.position.z - bot.position.z;
        const desiredRotY = Math.atan2(dx, dz);
        bot.rotY = desiredRotY;

        // Strafe during gunfight
        bot.strafeTimer -= delta;
        if (bot.strafeTimer <= 0) {
          bot.strafeTimer = 0.8 + Math.random() * 0.8;
          bot.strafeDir *= -1;
        }

        const rightVec = new THREE.Vector3(Math.cos(desiredRotY), 0, -Math.sin(desiredRotY));
        const strafeMove = rightVec.multiplyScalar(bot.strafeDir * 2.2 * delta);
        bot.position.add(strafeMove);

        // Weapon logic
        const dist = closestDist;
        if (dist <= 2.8 && bot.weapon !== 'knife') {
          bot.weapon = 'knife';
          bot.meshData.updateWeapon('knife');
        } else if (dist > 3.0 && bot.weapon === 'knife') {
          bot.weapon = 'ak47';
          bot.meshData.updateWeapon('ak47');
        }

        // Shooting cadence
        const reactionDelay = bot.difficulty === 'hard' ? 220 : bot.difficulty === 'normal' ? 380 : 600;
        const shootInterval = bot.weapon === 'ak47' ? 140 : bot.weapon === 'pistol' ? 280 : 450;

        if (now - bot.lastShotTime > shootInterval) {
          bot.burstCount++;
          if (bot.weapon === 'ak47' && bot.burstCount > 4) {
            // Recoil pause between bursts
            if (now - bot.lastShotTime > 650) {
              bot.burstCount = 0;
            }
          } else {
            bot.lastShotTime = now;

            // Compute fire direction with difficulty spread
            const spreadFactor = bot.difficulty === 'hard' ? 0.02 : bot.difficulty === 'normal' ? 0.05 : 0.09;
            const spreadX = (Math.random() - 0.5) * spreadFactor;
            const spreadY = (Math.random() - 0.5) * spreadFactor;

            const eyePos = bot.position.clone().setY(bot.position.y + 0.1);
            const aimDir = new THREE.Vector3()
              .subVectors(activeTarget.position, eyePos)
              .normalize()
              .add(new THREE.Vector3(spreadX, spreadY, 0))
              .normalize();

            // Sound
            if (bot.weapon === 'ak47') sounds.playAK47Shot();
            else if (bot.weapon === 'pistol') sounds.playPistolShot();
            else sounds.playKnifeSlash();

            this.onBotShoot(bot, eyePos, aimDir);
          }
        }
      } else {
        // Patrol state: Move along waypoints
        moveTarget = this.waypoints[bot.currentWaypointIdx];
        const toWp = new THREE.Vector3().subVectors(moveTarget, bot.position);
        toWp.y = 0;
        const distToWp = toWp.length();

        if (distToWp < 2.0) {
          // Advance to next waypoint
          bot.currentWaypointIdx = (bot.currentWaypointIdx + 1) % this.waypoints.length;
        } else {
          toWp.normalize();
          const targetRotY = Math.atan2(toWp.x, toWp.z);
          bot.rotY = targetRotY;
          bot.position.add(toWp.multiplyScalar(moveSpeed * delta));
        }
      }

      // Simple collision resolution with map walls
      for (const b of this.colliders) {
        const radius = 0.45;
        if (
          bot.position.x + radius > b.minX &&
          bot.position.x - radius < b.maxX &&
          bot.position.z + radius > b.minZ &&
          bot.position.z - radius < b.maxZ &&
          bot.position.y < b.maxY &&
          bot.position.y + 1.6 > b.minY
        ) {
          // Push out
          const overlapX1 = (bot.position.x + radius) - b.minX;
          const overlapX2 = b.maxX - (bot.position.x - radius);
          const overlapZ1 = (bot.position.z + radius) - b.minZ;
          const overlapZ2 = b.maxZ - (bot.position.z - radius);

          const minOverlap = Math.min(overlapX1, overlapX2, overlapZ1, overlapZ2);
          if (minOverlap === overlapX1) bot.position.x -= overlapX1;
          else if (minOverlap === overlapX2) bot.position.x += overlapX2;
          else if (minOverlap === overlapZ1) bot.position.z -= overlapZ1;
          else if (minOverlap === overlapZ2) bot.position.z += overlapZ2;
        }
      }

      // Animate leg swings when moving
      const isMoving = bot.velocity.lengthSq() > 0.01 || activeTarget !== null;
      if (isMoving) {
        const swing = Math.sin(now * 0.008) * 0.4;
        bot.meshData.legsMesh.children[0].rotation.x = swing;
        bot.meshData.legsMesh.children[1].rotation.x = -swing;
      } else {
        bot.meshData.legsMesh.children[0].rotation.x = 0;
        bot.meshData.legsMesh.children[1].rotation.x = 0;
      }

      // Update 3D mesh
      bot.meshData.mesh.position.set(bot.position.x, bot.position.y - 1.6, bot.position.z);
      bot.meshData.mesh.rotation.y = bot.rotY;
    });
  }
}
