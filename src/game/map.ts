import * as THREE from 'three';
import { MapId, MAPS_METADATA } from '../types/game';
import { textures } from './textures';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface RadarObstacle {
  x: number;
  z: number;
  w: number;
  d: number;
  type?: 'wall' | 'site' | 'spawn' | 'tunnel' | 'catwalk' | 'crate' | 'pillar' | 'vehicle';
  label?: string;
}

export interface MapData {
  id: MapId;
  name: string;
  vietnameseName: string;
  sceneGroup: THREE.Group;
  colliders: CollisionBox[];
  spawns: {
    red: { x: number; y: number; z: number; rotY: number }[];
    blue: { x: number; y: number; z: number; rotY: number }[];
  };
  bombsites: { id: 'A' | 'B'; name: string; x: number; z: number }[];
  patrolPoints: THREE.Vector3[];
  radarObstacles: RadarObstacle[];
  getLocationName: (x: number, z: number) => string;
}

// Helper to create solid boxes and register colliders + radar obstacles
function createSolidBoxBuilder(group: THREE.Group, colliders: CollisionBox[], radarObstacles: RadarObstacle[]) {
  return function addSolidBox(
    w: number, h: number, d: number,
    x: number, y: number, z: number,
    mat: THREE.Material,
    radarType: 'wall' | 'catwalk' | 'tunnel' | 'crate' | 'pillar' | 'vehicle' = 'wall',
    label?: string,
    cast = true
  ): THREE.Mesh {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    group.add(mesh);

    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minY: y,
      maxY: y + h,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });

    radarObstacles.push({
      x,
      z,
      w,
      d,
      type: radarType,
      label
    });

    return mesh;
  };
}

// ==========================================
// 1. DUST II MAP (de_dust2)
// ==========================================
export function buildDust2Map(): MapData {
  const group = new THREE.Group();
  const colliders: CollisionBox[] = [];
  const radarObstacles: RadarObstacle[] = [];
  const addSolidBox = createSolidBoxBuilder(group, colliders, radarObstacles);

  const wallTex = textures.getSandstoneWall();
  wallTex.repeat.set(4, 2);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85 });

  const floorTex = textures.getFloorTexture();
  floorTex.repeat.set(18, 18);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 });

  const crateTex = textures.getWoodCrate();
  const crateMat = new THREE.MeshStandardMaterial({ map: crateTex, roughness: 0.7 });

  const metalTex = textures.getMetalContainer();
  const metalMat = new THREE.MeshStandardMaterial({ map: metalTex, roughness: 0.6, metalness: 0.2 });

  const grateTex = textures.getMetalGrating();
  grateTex.repeat.set(4, 1);
  const grateMat = new THREE.MeshStandardMaterial({ map: grateTex, roughness: 0.5, metalness: 0.5 });

  // Main ground
  const floorGeo = new THREE.PlaneGeometry(74, 74);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Outer boundary walls (72x72)
  const mapRadius = 36;
  const wallHeight = 6;
  addSolidBox(72, wallHeight, 2, 0, 0, -mapRadius, wallMat, 'wall', 'BẮC');
  addSolidBox(72, wallHeight, 2, 0, 0, mapRadius, wallMat, 'wall', 'NAM');
  addSolidBox(2, wallHeight, 72, -mapRadius, 0, 0, wallMat, 'wall', 'TÂY');
  addSolidBox(2, wallHeight, 72, mapRadius, 0, 0, wallMat, 'wall', 'ĐÔNG');

  // Rim trims
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x8a7250 });
  const addRim = (w: number, d: number, x: number, z: number) => {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), rimMat);
    rim.position.set(x, wallHeight + 0.2, z);
    group.add(rim);
  };
  addRim(72, 2.4, 0, -mapRadius);
  addRim(72, 2.4, 0, mapRadius);
  addRim(2.4, 72, -mapRadius, 0);
  addRim(2.4, 72, mapRadius, 0);

  // Mid Doors / Gateway
  addSolidBox(12, 5, 2, -10, 0, 0, wallMat, 'wall', 'MID');
  addSolidBox(12, 5, 2, 10, 0, 0, wallMat, 'wall', 'MID');
  // Arch top lintel
  const archLintel = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 2), wallMat);
  archLintel.position.set(0, 4.4, 0);
  group.add(archLintel);
  colliders.push({ minX: -4, maxX: 4, minY: 3.8, maxY: 5.0, minZ: -1, maxZ: 1 });

  // Center Mid Sandstone Pillar
  addSolidBox(2.4, 4.5, 2.4, 0, 0, 6, wallMat, 'pillar');
  addSolidBox(3.0, 0.6, 3.0, 0, 0, 6, wallMat, 'pillar');

  // Mid Crates Cover
  addSolidBox(1.8, 1.8, 1.8, -3.5, 0, -5, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, -3.5, 1.8, -5, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, -1.7, 0, -5, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, 4, 0, 5, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, 4, 0, 3.2, crateMat, 'crate');

  // Catwalk (Site A High Ground: y = 2.0m)
  addSolidBox(12, 0.4, 18, 18, 2.0, 0, grateMat, 'catwalk', 'CATWALK A');
  // Ramp to Catwalk
  for (let step = 0; step < 8; step++) {
    const stepH = 0.25;
    const stepZ = 13.5 - step * 0.6;
    addSolidBox(4, stepH * (step + 1), 0.6, 18, 0, stepZ, wallMat, 'catwalk');
  }
  // Catwalk front railing
  const railMat = new THREE.MeshStandardMaterial({ color: 0x33373d, roughness: 0.4 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 18), railMat);
  rail.position.set(12, 2.7, 0);
  group.add(rail);
  colliders.push({ minX: 11.9, maxX: 12.1, minY: 2.2, maxY: 3.2, minZ: -9, maxZ: 9 });

  // Long A Alley & Corridors (West side)
  addSolidBox(2, 5, 26, -18, 0, -18, wallMat, 'wall', 'LONG A');
  addSolidBox(2, 5, 24, -18, 0, 18, wallMat, 'wall', 'LONG A');
  // Long A Shipping Containers & Crates
  addSolidBox(3.2, 2.8, 7.5, -26, 0, -6, metalMat, 'vehicle');
  addSolidBox(1.8, 1.8, 1.8, -22, 0, -14, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, -26, 0, 12, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, -26, 1.8, 12, crateMat, 'crate');

  // Red Spawn (Phoenix / T: -28, -28)
  addSolidBox(8, 3.5, 2, -28, 0, -22, wallMat, 'wall');
  addSolidBox(2, 3.5, 6, -24, 0, -26, wallMat, 'wall');
  addSolidBox(1.8, 1.8, 1.8, -32, 0, -32, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, -20, 0, -28, crateMat, 'crate');

  // Blue Spawn (CT: 28, 28)
  addSolidBox(8, 3.5, 2, 26, 0, 20, wallMat, 'wall');
  addSolidBox(2, 3.5, 6, 22, 0, 24, wallMat, 'wall');
  addSolidBox(3.2, 2.8, 7.5, 28, 0, 10, metalMat, 'vehicle');
  addSolidBox(1.8, 1.8, 1.8, 32, 0, 32, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, 20, 0, 30, crateMat, 'crate');

  // Underpass Tunnel
  const tunnelRoof = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 12), wallMat);
  tunnelRoof.position.set(-6, 3.2, -18);
  group.add(tunnelRoof);
  addSolidBox(2, 3.2, 12, -11, 0, -18, wallMat, 'tunnel');
  addSolidBox(2, 3.2, 12, -1, 0, -18, wallMat, 'tunnel');

  // Bombsite A marker box at (18, 0)
  addSolidBox(2.2, 1.6, 2.2, 18, 2.2, 0, crateMat, 'crate', 'SITE A');

  // Bombsite B marker at (-22, 16)
  addSolidBox(2.2, 1.8, 2.2, -22, 0, 16, crateMat, 'crate', 'SITE B');

  // Warm Lanterns
  const lightColors = [0xffd175, 0xffecaa, 0xffcc66];
  const lampPositions = [
    new THREE.Vector3(-6, 3.0, -18),
    new THREE.Vector3(0, 4.2, 0),
    new THREE.Vector3(18, 3.5, 0)
  ];
  lampPositions.forEach((pos, idx) => {
    const lampBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({ color: lightColors[idx % lightColors.length] })
    );
    lampBulb.position.copy(pos);
    group.add(lampBulb);

    const pLight = new THREE.PointLight(lightColors[idx % lightColors.length], 0.9, 14);
    pLight.position.copy(pos);
    pLight.position.y -= 0.2;
    group.add(pLight);
  });

  const patrolPoints: THREE.Vector3[] = [
    new THREE.Vector3(-28, 1.6, -28), // T Spawn
    new THREE.Vector3(-24, 1.6, -14), // Long A Entrance
    new THREE.Vector3(-26, 1.6, 0),   // Long A Mid
    new THREE.Vector3(-26, 1.6, 18),  // Long A South (B Site)
    new THREE.Vector3(-6, 1.6, -18),  // Underpass Tunnel
    new THREE.Vector3(0, 1.6, -6),    // Mid Doors North
    new THREE.Vector3(0, 1.6, 6),     // Mid Doors South
    new THREE.Vector3(6, 1.6, 0),     // Mid Courtyard
    new THREE.Vector3(18, 3.6, 0),    // Catwalk High ground (Site A)
    new THREE.Vector3(18, 1.6, 14),   // Catwalk Ramp
    new THREE.Vector3(26, 1.6, 14),   // CT Approach
    new THREE.Vector3(28, 1.6, 28),   // CT Spawn
  ];

  return {
    id: 'dust2',
    name: 'Dust II',
    vietnameseName: 'Sa Mạc Bụi Cát II',
    sceneGroup: group,
    colliders,
    spawns: {
      red: [
        { x: -28, y: 1.6, z: -28, rotY: -3 * Math.PI / 4 },
        { x: -32, y: 1.6, z: -24, rotY: -3 * Math.PI / 4 }
      ],
      blue: [
        { x: 28, y: 1.6, z: 28, rotY: Math.PI / 4 },
        { x: 24, y: 1.6, z: 32, rotY: Math.PI / 4 }
      ]
    },
    bombsites: [
      { id: 'A', name: 'Khu đặt bom A (Catwalk)', x: 18, z: 0 },
      { id: 'B', name: 'Khu đặt bom B (Plaza)', x: -22, z: 16 }
    ],
    patrolPoints,
    radarObstacles,
    getLocationName: (x: number, z: number): string => {
      if (x >= 10 && x <= 26 && z >= -10 && z <= 10) return '📍 [A] KHU VỰC CATWALK (SITE A)';
      if (x <= -16 && z >= 8) return '📍 [B] KHU VỰC QUẢNG TRƯỜNG (SITE B)';
      if (x <= -16 && z >= -18 && z < 8) return '📍 [B] HÀNH LANG DÀI (LONG B)';
      if (x >= -8 && x <= 8 && z >= -20 && z <= -4) return '📍 ĐƯỜNG HẦM (UNDERPASS)';
      if (Math.abs(x) < 14 && Math.abs(z) < 14) return '📍 KHU TRUNG TÂM (MID DOORS)';
      if (x <= -18 && z <= -18) return '📍 CĂN CỨ PHE ĐỎ (T BASE)';
      if (x >= 18 && z >= 18) return '📍 CĂN CỨ PHE XANH (CT BASE)';
      return '📍 HÀNH LANG CHIẾN ĐẤU';
    }
  };
}

// ==========================================
// 2. MIRAGE MAP (de_mirage)
// ==========================================
export function buildMirageMap(): MapData {
  const group = new THREE.Group();
  const colliders: CollisionBox[] = [];
  const radarObstacles: RadarObstacle[] = [];
  const addSolidBox = createSolidBoxBuilder(group, colliders, radarObstacles);

  // Materials for Middle-Eastern / Mirage town
  const mirageWallTex = textures.getSandstoneWall();
  mirageWallTex.repeat.set(3, 2);
  const mirageWallMat = new THREE.MeshStandardMaterial({
    map: mirageWallTex,
    color: 0xdec8a5,
    roughness: 0.8
  });

  const palaceWallMat = new THREE.MeshStandardMaterial({
    color: 0xc49b71,
    roughness: 0.75
  });

  const tileFloorTex = textures.getFloorTexture();
  tileFloorTex.repeat.set(16, 16);
  const mirageFloorMat = new THREE.MeshStandardMaterial({
    map: tileFloorTex,
    color: 0xe0d2bd,
    roughness: 0.85
  });

  const crateTex = textures.getWoodCrate();
  const crateMat = new THREE.MeshStandardMaterial({ map: crateTex, roughness: 0.7 });

  const metalTex = textures.getMetalContainer();
  const vanMat = new THREE.MeshStandardMaterial({
    map: metalTex,
    color: 0x4a6572,
    roughness: 0.5,
    metalness: 0.3
  });

  // Main ground (72x72)
  const floorGeo = new THREE.PlaneGeometry(74, 74);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, mirageFloorMat);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Perimeter Walls
  const mapRadius = 36;
  const wallHeight = 6.5;
  addSolidBox(72, wallHeight, 2, 0, 0, -mapRadius, mirageWallMat, 'wall', 'BẮC');
  addSolidBox(72, wallHeight, 2, 0, 0, mapRadius, mirageWallMat, 'wall', 'NAM');
  addSolidBox(2, wallHeight, 72, -mapRadius, 0, 0, mirageWallMat, 'wall', 'TÂY');
  addSolidBox(2, wallHeight, 72, mapRadius, 0, 0, mirageWallMat, 'wall', 'ĐÔNG');

  // Roof parapet
  const parapetMat = new THREE.MeshStandardMaterial({ color: 0x9b6b43 });
  const addParapet = (w: number, d: number, x: number, z: number) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), parapetMat);
    p.position.set(x, wallHeight + 0.2, z);
    group.add(p);
  };
  addParapet(72, 2.4, 0, -mapRadius);
  addParapet(72, 2.4, 0, mapRadius);
  addParapet(2.4, 72, -mapRadius, 0);
  addParapet(2.4, 72, mapRadius, 0);

  // 1. SITE A & PALACE (East & North-East)
  // Palace elevated corridor & balcony (x: 20 to 30, z: -26 to -10, y: 2.2m)
  addSolidBox(10, 0.5, 16, 25, 2.2, -18, palaceWallMat, 'catwalk', 'PALACE');
  addSolidBox(2, 5.5, 16, 30, 0, -18, palaceWallMat, 'wall'); // Back palace wall
  addSolidBox(10, 5.5, 2, 25, 0, -26, palaceWallMat, 'wall'); // North palace wall
  // Palace Balcony front railing
  addSolidBox(10, 1.0, 0.3, 25, 2.7, -10, palaceWallMat, 'wall');
  // Palace entrance ramp
  for (let s = 0; s < 7; s++) {
    const rZ = -26 - (s * 0.7);
    addSolidBox(4, 0.3 * (7 - s), 0.7, 25, 0, rZ, palaceWallMat, 'catwalk');
  }

  // Site A Ground & Pillars
  addSolidBox(2.2, 4.0, 2.2, 16, 0, -12, mirageWallMat, 'pillar');
  addSolidBox(2.2, 4.0, 2.2, 22, 0, -4, mirageWallMat, 'pillar');
  // Triple Crates at Site A
  addSolidBox(1.8, 1.8, 1.8, 14, 0, -16, crateMat, 'crate', 'SITE A');
  addSolidBox(1.8, 1.8, 1.8, 14, 1.8, -16, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, 16, 0, -16, crateMat, 'crate');
  // Firebox cover
  addSolidBox(1.8, 1.8, 1.8, 22, 0, -14, crateMat, 'crate');

  // Connector (Mid to A Site): angled corridor with walls
  addSolidBox(2, 5, 14, 8, 0, -6, mirageWallMat, 'wall', 'CONNECTOR');
  addSolidBox(2, 5, 14, 14, 0, 4, mirageWallMat, 'wall', 'CONNECTOR');

  // 2. MID ARENA & SNIPER WINDOW
  // CT Sniper Nest / Mid Window at (2, 10, y: 1.8m)
  addSolidBox(10, 2.0, 6, 2, 0, 12, mirageWallMat, 'catwalk', 'WINDOW MID');
  // Window slit aperture
  addSolidBox(3.5, 3.5, 1.5, -1.5, 2.0, 9, mirageWallMat, 'wall');
  addSolidBox(3.5, 3.5, 1.5, 5.5, 2.0, 9, mirageWallMat, 'wall');
  addSolidBox(10, 1.2, 1.5, 2, 4.3, 9, mirageWallMat, 'wall'); // Window header
  // Window cover box
  addSolidBox(1.5, 1.2, 1.5, 2, 2.0, 9, crateMat, 'crate');

  // Top Mid Boxes & Catwalk (Short B)
  addSolidBox(1.8, 1.8, 1.8, -4, 0, -12, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, -4, 1.8, -12, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, -6, 0, -12, crateMat, 'crate');

  // Catwalk (Short B: x: -12 to 0, z: 0 to 4)
  addSolidBox(12, 1.8, 3, -6, 0, 2, mirageWallMat, 'catwalk', 'SHORT B');
  addSolidBox(2, 5, 10, -12, 0, -4, mirageWallMat, 'wall');

  // 3. B APARTMENTS & SITE B (West & South-West)
  // B Apartments (Covered 2-story building along west: x: -24, z: -14 to 10)
  addSolidBox(8, 5, 2, -26, 0, -14, mirageWallMat, 'wall', 'CĂN HỘ B');
  addSolidBox(8, 5, 2, -26, 0, 10, mirageWallMat, 'wall', 'CĂN HỘ B');
  addSolidBox(2, 5, 24, -20, 0, -2, mirageWallMat, 'wall'); // Inner corridor wall
  // Apartment roof
  const aptRoof = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 26), mirageWallMat);
  aptRoof.position.set(-25, 4.2, -2);
  group.add(aptRoof);

  // B Site Arena
  // Delivery Van at (-16, 14)
  addSolidBox(3.4, 2.6, 6.5, -16, 0, 14, vanMat, 'vehicle', 'XE VAN B');
  // B Site Planting Platform & Pillar
  addSolidBox(3.0, 0.6, 3.0, -20, 0, 18, mirageWallMat, 'crate', 'SITE B');
  addSolidBox(2.0, 4.5, 2.0, -20, 0, 24, mirageWallMat, 'pillar');
  // Market door & wall to CT
  addSolidBox(12, 4.5, 2, -10, 0, 24, mirageWallMat, 'wall');
  addSolidBox(1.8, 1.8, 1.8, -26, 0, 20, crateMat, 'crate');

  // 4. SPAWN BASES
  // T Spawn (Red: -24, -26)
  addSolidBox(10, 3.5, 2, -24, 0, -20, mirageWallMat, 'wall');
  addSolidBox(1.8, 1.8, 1.8, -28, 0, -30, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, -18, 0, -28, crateMat, 'crate');

  // CT Spawn (Blue: 18, 24)
  addSolidBox(10, 3.5, 2, 16, 0, 18, mirageWallMat, 'wall');
  addSolidBox(1.8, 1.8, 1.8, 24, 0, 28, crateMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, 12, 0, 26, crateMat, 'crate');

  // Warm Oriental Lanterns
  const lampPositions = [
    new THREE.Vector3(25, 3.4, -18), // Palace
    new THREE.Vector3(2, 3.2, 9),    // Window
    new THREE.Vector3(-20, 3.2, 18), // Site B
    new THREE.Vector3(14, 3.0, -14), // Site A
    new THREE.Vector3(-6, 3.0, 0)    // Mid
  ];
  lampPositions.forEach(pos => {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd27d })
    );
    lamp.position.copy(pos);
    group.add(lamp);

    const light = new THREE.PointLight(0xffb84d, 0.9, 14);
    light.position.copy(pos);
    light.position.y -= 0.2;
    group.add(light);
  });

  const patrolPoints: THREE.Vector3[] = [
    new THREE.Vector3(-24, 1.6, -26), // T Spawn
    new THREE.Vector3(-24, 1.6, -8),  // B Apps Entry
    new THREE.Vector3(-20, 1.6, 10),  // B Apps Window
    new THREE.Vector3(-20, 1.6, 18),  // B Site (Van)
    new THREE.Vector3(-4, 1.6, -14),  // Top Mid
    new THREE.Vector3(0, 1.6, 0),     // Mid Center
    new THREE.Vector3(2, 2.2, 10),    // Mid Window
    new THREE.Vector3(8, 1.6, -4),    // Connector
    new THREE.Vector3(16, 1.6, -14),  // Site A Triple Box
    new THREE.Vector3(24, 2.6, -18),  // Palace Balcony
    new THREE.Vector3(18, 1.6, 8),    // CT Ticket Booth
    new THREE.Vector3(18, 1.6, 24),   // CT Spawn
  ];

  return {
    id: 'mirage',
    name: 'Mirage',
    vietnameseName: 'Thị Trấn Cổ Mirage',
    sceneGroup: group,
    colliders,
    spawns: {
      red: [
        { x: -24, y: 1.6, z: -26, rotY: -Math.PI / 4 },
        { x: -28, y: 1.6, z: -22, rotY: -Math.PI / 4 }
      ],
      blue: [
        { x: 18, y: 1.6, z: 24, rotY: 3 * Math.PI / 4 },
        { x: 14, y: 1.6, z: 28, rotY: 3 * Math.PI / 4 }
      ]
    },
    bombsites: [
      { id: 'A', name: 'Khu đặt bom A (Triple/Palace)', x: 16, z: -14 },
      { id: 'B', name: 'Khu đặt bom B (Van/Apps)', x: -20, z: 18 }
    ],
    patrolPoints,
    radarObstacles,
    getLocationName: (x: number, z: number): string => {
      if (x >= 18 && z <= -10) return '📍 [A] CUNG ĐIỆN (PALACE)';
      if (x >= 8 && x <= 22 && z >= -18 && z <= -6) return '📍 [A] KHU VỰC ĐẶT BOM A';
      if (x >= 4 && x <= 14 && z >= -6 && z <= 6) return '📍 HÀNH LANG CONNECTOR';
      if (x >= -4 && x <= 8 && z >= 6 && z <= 16) return '📍 [CT] CỬA SỔ MID (WINDOW)';
      if (Math.abs(x) < 12 && z >= -14 && z <= 4) return '📍 KHU TRUNG TÂM (MID)';
      if (x <= -16 && z >= -14 && z <= 8) return '📍 [B] CĂN HỘ B (APARTMENTS)';
      if (x <= -12 && z >= 12) return '📍 [B] KHU VỰC ĐẶT BOM B (SITE B)';
      if (x <= -18 && z <= -18) return '📍 CĂN CỨ PHE ĐỎ (T SPAWN)';
      if (x >= 12 && z >= 18) return '📍 CĂN CỨ PHE XANH (CT SPAWN)';
      return '📍 HÀNH LANG THỊ TRẤN';
    }
  };
}

// ==========================================
// 3. INFERNO MAP (de_inferno)
// ==========================================
export function buildInfernoMap(): MapData {
  const group = new THREE.Group();
  const colliders: CollisionBox[] = [];
  const radarObstacles: RadarObstacle[] = [];
  const addSolidBox = createSolidBoxBuilder(group, colliders, radarObstacles);

  // Textures and European stone materials
  const brickWallMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a3c,
    roughness: 0.9
  });

  const stuccoWallMat = new THREE.MeshStandardMaterial({
    color: 0xbdb09e,
    roughness: 0.85
  });

  const cobbleFloorMat = new THREE.MeshStandardMaterial({
    color: 0x5a544d,
    roughness: 0.95
  });

  const woodBarrelMat = new THREE.MeshStandardMaterial({
    color: 0x6e4a2d,
    roughness: 0.7
  });

  const carMat = new THREE.MeshStandardMaterial({
    color: 0x8b2500, // Rust red wreck
    roughness: 0.6,
    metalness: 0.4
  });

  const sandbagMat = new THREE.MeshStandardMaterial({
    color: 0x8c7853,
    roughness: 0.95
  });

  // Main Cobblestone Floor (72x72)
  const floorGeo = new THREE.PlaneGeometry(74, 74);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, cobbleFloorMat);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Outer Perimeter Walls
  const mapRadius = 36;
  const wallHeight = 6.8;
  addSolidBox(72, wallHeight, 2, 0, 0, -mapRadius, brickWallMat, 'wall', 'BẮC');
  addSolidBox(72, wallHeight, 2, 0, 0, mapRadius, brickWallMat, 'wall', 'NAM');
  addSolidBox(2, wallHeight, 72, -mapRadius, 0, 0, brickWallMat, 'wall', 'TÂY');
  addSolidBox(2, wallHeight, 72, mapRadius, 0, 0, brickWallMat, 'wall', 'ĐÔNG');

  // Red terracotta tile roof trim
  const roofTileMat = new THREE.MeshStandardMaterial({ color: 0x7c3826 });
  const addTileRoof = (w: number, d: number, x: number, z: number) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), roofTileMat);
    r.position.set(x, wallHeight + 0.2, z);
    group.add(r);
  };
  addTileRoof(72, 2.4, 0, -mapRadius);
  addTileRoof(72, 2.4, 0, mapRadius);
  addTileRoof(2.4, 72, -mapRadius, 0);
  addTileRoof(2.4, 72, mapRadius, 0);

  // 1. BANANA LANE (Narrow curving corridor to Site B: West side)
  // Banana curving barrier walls
  addSolidBox(2, 5.5, 24, -24, 0, -4, brickWallMat, 'wall', 'BANANA');
  addSolidBox(2, 5.5, 14, -12, 0, -10, brickWallMat, 'wall', 'BANANA');
  addSolidBox(2, 5.5, 12, -12, 0, 6, stuccoWallMat, 'wall', 'BANANA');

  // Burned Car cover in Banana at (-18, 2)
  addSolidBox(3.4, 2.2, 5.8, -18, 0, 2, carMat, 'vehicle', 'XE BANANA');

  // Sandbag fort at (-14, 8)
  addSolidBox(2.8, 1.4, 1.4, -15, 0, 8, sandbagMat, 'crate', 'SANDBAGS');
  addSolidBox(2.8, 1.4, 1.4, -15, 0, 9.4, sandbagMat, 'crate');

  // 2. SITE B (Church, Fountain, New Box)
  // Fountain Monument in Site B center at (-18, 20)
  addSolidBox(3.6, 1.2, 3.6, -18, 0, 20, stuccoWallMat, 'pillar', 'SITE B');
  addSolidBox(1.6, 3.2, 1.6, -18, 1.2, 20, stuccoWallMat, 'pillar');

  // Church Wall & Arch back of B
  addSolidBox(14, 6.0, 2, -18, 0, 28, brickWallMat, 'wall', 'CHURCH');
  addSolidBox(2, 6.0, 10, -26, 0, 23, brickWallMat, 'wall', 'CHURCH');

  // New Box / Spools at B
  addSolidBox(2.0, 2.0, 2.0, -22, 0, 16, woodBarrelMat, 'crate');
  addSolidBox(2.0, 2.0, 2.0, -22, 0, 23, woodBarrelMat, 'crate');
  addSolidBox(2.0, 2.0, 2.0, -13, 0, 24, woodBarrelMat, 'crate');

  // 3. MAIN MID & SECOND MID (Center)
  // Dividing block separating Alt Mid and Main Mid
  addSolidBox(4, 5.5, 18, -4, 0, -6, stuccoWallMat, 'wall', 'MID');
  // Arch over Mid
  const midArch = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 2), stuccoWallMat);
  midArch.position.set(2, 4.4, 0);
  group.add(midArch);

  // Boiler & Apartments (x: 8 to 18, z: -4 to 8)
  addSolidBox(10, 5.5, 2, 13, 0, -4, stuccoWallMat, 'wall', 'BOILER');
  addSolidBox(10, 5.5, 2, 13, 0, 8, stuccoWallMat, 'wall', 'BOILER');
  addSolidBox(2, 5.5, 12, 8, 0, 2, stuccoWallMat, 'wall'); // Mid-facing apartment wall
  // Apartment Balcony & stairs to A
  addSolidBox(4, 1.8, 4, 16, 0, 8, stuccoWallMat, 'catwalk', 'BALCONY A');

  // 4. SITE A & PIT (East & South-East)
  // Site A Plant Truck / Boxes at (18, 14)
  addSolidBox(3.4, 2.4, 6.5, 18, 0, 14, carMat, 'vehicle', 'SITE A');
  addSolidBox(1.8, 1.8, 1.8, 14, 0, 16, woodBarrelMat, 'crate');
  addSolidBox(1.8, 1.8, 1.8, 14, 1.8, 16, woodBarrelMat, 'crate');

  // Pit (Sunken protective trench / wall at 26, 20)
  addSolidBox(2, 2.4, 12, 22, 0, 22, stuccoWallMat, 'wall', 'HỐ PIT');
  addSolidBox(10, 2.4, 2, 27, 0, 16, stuccoWallMat, 'wall', 'HỐ PIT');

  // Graveyard Wall (East edge)
  addSolidBox(2, 4.5, 16, 30, 0, 8, brickWallMat, 'wall', 'GRAVEYARD');

  // 5. SPAWN BASES
  // T Spawn (Red: -16, -28)
  addSolidBox(12, 3.5, 2, -16, 0, -22, brickWallMat, 'wall');
  addSolidBox(2, 3.5, 8, -10, 0, -26, brickWallMat, 'wall');
  addSolidBox(2.0, 2.0, 2.0, -22, 0, -30, woodBarrelMat, 'crate');

  // CT Spawn (Blue: 18, 26)
  addSolidBox(12, 3.5, 2, 18, 0, 22, brickWallMat, 'wall');
  addSolidBox(2.0, 2.0, 2.0, 24, 0, 28, woodBarrelMat, 'crate');
  addSolidBox(2.0, 2.0, 2.0, 12, 0, 28, woodBarrelMat, 'crate');

  // European Gas Street Lamps
  const lampPositions = [
    new THREE.Vector3(-18, 3.6, 2),  // Banana
    new THREE.Vector3(-18, 3.4, 20), // Site B
    new THREE.Vector3(2, 3.8, 0),    // Mid
    new THREE.Vector3(18, 3.6, 14),  // Site A
    new THREE.Vector3(24, 3.2, 20)   // Pit
  ];
  lampPositions.forEach(pos => {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe29a })
    );
    lamp.position.copy(pos);
    group.add(lamp);

    const light = new THREE.PointLight(0xffbe5c, 0.9, 14);
    light.position.copy(pos);
    light.position.y -= 0.2;
    group.add(light);
  });

  const patrolPoints: THREE.Vector3[] = [
    new THREE.Vector3(-16, 1.6, -26), // T Spawn
    new THREE.Vector3(-18, 1.6, -14), // Banana Start
    new THREE.Vector3(-18, 1.6, 2),   // Banana Car
    new THREE.Vector3(-18, 1.6, 20),  // Site B Fountain
    new THREE.Vector3(0, 1.6, -16),   // Top Mid
    new THREE.Vector3(2, 1.6, 0),     // Mid Center
    new THREE.Vector3(8, 1.6, 2),     // Boiler
    new THREE.Vector3(16, 2.0, 8),    // Balcony
    new THREE.Vector3(18, 1.6, 14),   // Site A Truck
    new THREE.Vector3(24, 1.6, 20),   // Pit
    new THREE.Vector3(18, 1.6, 26),   // CT Spawn
    new THREE.Vector3(2, 1.6, 22),    // CT Arch to B
  ];

  return {
    id: 'inferno',
    name: 'Inferno',
    vietnameseName: 'Phố Cổ Inferno',
    sceneGroup: group,
    colliders,
    spawns: {
      red: [
        { x: -16, y: 1.6, z: -26, rotY: -Math.PI / 4 },
        { x: -20, y: 1.6, z: -22, rotY: -Math.PI / 4 }
      ],
      blue: [
        { x: 18, y: 1.6, z: 26, rotY: 3 * Math.PI / 4 },
        { x: 14, y: 1.6, z: 28, rotY: 3 * Math.PI / 4 }
      ]
    },
    bombsites: [
      { id: 'A', name: 'Khu đặt bom A (Truck/Pit)', x: 18, z: 14 },
      { id: 'B', name: 'Khu đặt bom B (Fountain/Church)', x: -18, z: 20 }
    ],
    patrolPoints,
    radarObstacles,
    getLocationName: (x: number, z: number): string => {
      if (x <= -12 && z >= -14 && z <= 10) return '📍 [B] ĐOẠN CUA CHUỐI (BANANA)';
      if (x <= -12 && z >= 12) return '📍 [B] KHU VỰC ĐẶT BOM B (CHURCH)';
      if (x >= 20 && z >= 16) return '📍 [A] HỐ TỬ THẦN (PIT)';
      if (x >= 12 && z >= 6 && z <= 18) return '📍 [A] KHU VỰC ĐẶT BOM A';
      if (x >= 6 && x <= 16 && z >= -4 && z <= 6) return '📍 PHÒNG NỒI HƠI (BOILER)';
      if (Math.abs(x) < 10 && z >= -16 && z <= 10) return '📍 ĐƯỜNG TRUNG TÂM (MID)';
      if (x <= -10 && z <= -18) return '📍 CĂN CỨ PHE ĐỎ (T SPAWN)';
      if (x >= 10 && z >= 20) return '📍 CĂN CỨ PHE XANH (CT SPAWN)';
      return '📍 HÀNH LANG PHỐ CỔ';
    }
  };
}

// Master map loader supporting all 3 maps
export function loadMap(mapId: MapId = 'dust2'): MapData {
  switch (mapId) {
    case 'mirage':
      return buildMirageMap();
    case 'inferno':
      return buildInfernoMap();
    case 'dust2':
    default:
      return buildDust2Map();
  }
}

// Backward compatibility alias
export function buildClassicMap(): MapData {
  return buildDust2Map();
}

export interface MapBlueprint {
  mapId: MapId;
  name: string;
  code: string;
  vietnameseName: string;
  tagline: string;
  description: string;
  obstacles: RadarObstacle[];
  bombsites: { id: 'A' | 'B'; name: string; x: number; z: number; description: string }[];
  spawns: {
    red: { x: number; z: number; label: string };
    blue: { x: number; z: number; label: string };
  };
  callouts: { name: string; x: number; z: number; color?: string }[];
  tactics: {
    tips: string[];
    smokeSpots: string[];
  };
}

export function getLocationNameForMap(mapId: MapId = 'dust2', x: number, z: number): string {
  if (mapId === 'mirage') {
    if (x >= 14 && z <= -8) return '📍 [A] CUNG ĐIỆN HOÀNG GIA (PALACE)';
    if (x >= 10 && z >= -6 && z <= 8) return '📍 [A] KHU ĐẶT BOM A (TETRIS/RAMP)';
    if (x <= -12 && z >= 8) return '📍 [B] KHU ĐẶT BOM B (SITE B / VAN)';
    if (x <= -12 && z < 8 && z >= -18) return '📍 [B] CĂN HỘ CHUNG CƯ (B APTS)';
    if (x >= 0 && x <= 8 && z >= 2 && z <= 12) return '📍 CỬA SỔ BẮN TỈA (SNIPER WINDOW)';
    if (x >= 4 && x <= 14 && z >= -8 && z <= 2) return '📍 ĐƯỜNG NỐI (CONNECTOR)';
    if (Math.abs(x) < 10 && z >= -12 && z <= 12) return '📍 QUẢNG TRƯỜNG GIỮA (MID)';
    if (x <= -14 && z <= -18) return '📍 CĂN CỨ PHE ĐỎ (T SPAWN)';
    if (x >= 14 && z >= 18) return '📍 CĂN CỨ PHE XANH (CT SPAWN)';
    return '📍 HÀNH LANG MIRAGE';
  }

  if (mapId === 'inferno') {
    if (x <= -10 && z >= -14 && z <= 10) return '📍 [B] ĐOẠN CUA CHUỐI (BANANA)';
    if (x <= -10 && z >= 12) return '📍 [B] KHU ĐẶT BOM B (CHURCH / FOUNTAIN)';
    if (x >= 18 && z >= 14) return '📍 [A] HỐ TỬ THẦN (PIT)';
    if (x >= 10 && z >= 6 && z <= 18) return '📍 [A] KHU ĐẶT BOM A (TRUCK/BALCONY)';
    if (x >= 4 && x <= 14 && z >= -4 && z <= 6) return '📍 PHÒNG NỒI HƠI (BOILER)';
    if (Math.abs(x) < 10 && z >= -16 && z <= 10) return '📍 ĐƯỜNG TRUNG TÂM (MID)';
    if (x <= -10 && z <= -18) return '📍 CĂN CỨ PHE ĐỎ (T SPAWN)';
    if (x >= 10 && z >= 18) return '📍 CĂN CỨ PHE XANH (CT SPAWN)';
    return '📍 HÀNH LANG PHỐ CỔ';
  }

  // Dust II default
  if (x >= 10 && x <= 26 && z >= -10 && z <= 10) return '📍 [A] KHU VỰC CATWALK (SITE A)';
  if (x <= -16 && z >= 8) return '📍 [B] KHU VỰC QUẢNG TRƯỜNG (SITE B)';
  if (x <= -16 && z >= -18 && z < 8) return '📍 [B] HÀNH LANG DÀI (LONG B / TUNNELS)';
  if (x >= -8 && x <= 8 && z >= -20 && z <= -4) return '📍 ĐƯỜNG HẦM (UNDERPASS)';
  if (Math.abs(x) < 14 && Math.abs(z) < 14) return '📍 KHU TRUNG TÂM (MID COURTYARD)';
  if (x <= -18 && z <= -18) return '📍 CĂN CỨ PHE ĐỎ (T BASE)';
  if (x >= 18 && z >= 18) return '📍 CĂN CỨ PHE XANH (CT BASE)';
  return '📍 HÀNH LANG CHIẾN ĐẤU';
}

export function getMapBlueprint(mapId: MapId = 'dust2'): MapBlueprint {
  if (mapId === 'mirage') {
    return {
      mapId: 'mirage',
      name: 'Mirage',
      code: 'de_mirage',
      vietnameseName: 'Cung Điện Mirage',
      tagline: 'Đấu trường ốc đảo Ma-rốc với các góc kê súng kinh điển',
      description: 'Một trong những bản đồ thi đấu chuyên nghiệp được yêu thích nhất mọi thời đại. Khu vực Mid rộng lớn với Window, Connector và Underpass tạo nên những pha đọ súng AWP nghẹt thở.',
      obstacles: [
        // Perimeter
        { x: 0, z: -36, w: 72, d: 2, type: 'wall' },
        { x: 0, z: 36, w: 72, d: 2, type: 'wall' },
        { x: -36, z: 0, w: 2, d: 72, type: 'wall' },
        { x: 36, z: 0, w: 2, d: 72, type: 'wall' },
        // Mid Window & Connector
        { x: 4, z: 6, w: 10, d: 2, type: 'wall', label: 'WINDOW' },
        { x: 8, z: -2, w: 2, d: 14, type: 'wall', label: 'CONNECTOR' },
        { x: -4, z: -4, w: 8, d: 14, type: 'tunnel', label: 'UNDERPASS' },
        // Palace & A Ramp
        { x: 22, z: -14, w: 12, d: 14, type: 'catwalk', label: 'PALACE' },
        { x: 16, z: -22, w: 6, d: 12, type: 'wall', label: 'A RAMP' },
        // B Apartments & Short
        { x: -22, z: -6, w: 6, d: 28, type: 'tunnel', label: 'B APTS' },
        { x: -10, z: 10, w: 14, d: 2, type: 'catwalk', label: 'B SHORT' },
        // Crates & Obstacles
        { x: 12, z: -4, w: 3.5, d: 3.5, type: 'crate', label: 'TETRIS' },
        { x: 16, z: 2, w: 3, d: 3, type: 'crate' },
        { x: -18, z: 16, w: 4, d: 6, type: 'vehicle', label: 'VAN' },
        { x: -22, z: 22, w: 3, d: 3, type: 'crate' }
      ],
      bombsites: [
        { id: 'A', name: 'Khu đặt bom A (Tetris / Palace / Ramp)', x: 16, z: 2, description: 'Điểm nóng giao tranh giữa Palace, Ramp A và Connector' },
        { id: 'B', name: 'Khu đặt bom B (B Apartments / Van / Market)', x: -18, z: 18, description: 'Khu vực hẹp dưới chân khu chung cư B và xe tải van' }
      ],
      spawns: {
        red: { x: -24, z: -26, label: 'T Spawn (Ốc đảo Phe Đỏ)' },
        blue: { x: 24, z: 26, label: 'CT Spawn (Căn cứ Phe Xanh)' }
      },
      callouts: [
        { name: 'Palace', x: 22, z: -14, color: '#f59e0b' },
        { name: 'Window', x: 4, z: 6, color: '#06b6d4' },
        { name: 'B Apts', x: -22, z: -6, color: '#a855f7' },
        { name: 'Tetris', x: 12, z: -4, color: '#10b981' },
        { name: 'Underpass', x: -4, z: -4, color: '#64748b' },
        { name: 'Site A', x: 16, z: 2, color: '#eab308' },
        { name: 'Site B', x: -18, z: 18, color: '#eab308' }
      ],
      tactics: {
        tips: [
          'Kiểm soát Mid là chìa khóa: Chiếm Mid Window cho phép ép cả Connector sang A lẫn Short sang B.',
          'Ném Smoke che Sniper Window ngay đầu hiệp từ T Spawn để chặn tầm ngắm AWP đối thủ.',
          'Đẩy Site A kết hợp đồng thời từ A Ramp và Palace sẽ gây phân tán hỏa lực đối phương.'
        ],
        smokeSpots: [
          'Smoke Mid Window (Từ T Roof)',
          'Smoke CT Spawn Site A (Từ A Ramp)',
          'Smoke Jungle & Connector (Từ A Tetris)',
          'Smoke B Short / Catwalk (Từ B Apartments)'
        ]
      }
    };
  }

  if (mapId === 'inferno') {
    return {
      mapId: 'inferno',
      name: 'Inferno',
      code: 'de_inferno',
      vietnameseName: 'Phố Cổ Inferno',
      tagline: 'Chiến trường thị trấn nước Ý cổ kính với góc Banana khét tiếng',
      description: 'Bản đồ kinh điển đậm chất chiến thuật với hẻm cua quả chuối (Banana) huyền thoại, hố Pit sâu Site A, và những góc ném lựu đạn nảy tường bất ngờ.',
      obstacles: [
        // Perimeter
        { x: 0, z: -36, w: 72, d: 2, type: 'wall' },
        { x: 0, z: 36, w: 72, d: 2, type: 'wall' },
        { x: -36, z: 0, w: 2, d: 72, type: 'wall' },
        { x: 36, z: 0, w: 2, d: 72, type: 'wall' },
        // Banana corridor
        { x: -14, z: -8, w: 2, d: 22, type: 'wall', label: 'BANANA' },
        { x: -22, z: 0, w: 2, d: 18, type: 'wall' },
        { x: -18, z: 6, w: 4, d: 4, type: 'crate', label: 'CAR' },
        // Site B Church
        { x: -18, z: 20, w: 14, d: 12, type: 'wall', label: 'CHURCH' },
        // Mid & Second Mid
        { x: 0, z: -6, w: 2, d: 26, type: 'wall', label: 'MID' },
        { x: 6, z: -4, w: 8, d: 2, type: 'wall' },
        // Boiler & Apartments
        { x: 10, z: 2, w: 10, d: 12, type: 'tunnel', label: 'BOILER' },
        // Site A Pit & Balcony
        { x: 24, z: 18, w: 10, d: 10, type: 'catwalk', label: 'PIT' },
        { x: 18, z: 14, w: 8, d: 6, type: 'wall', label: 'TRUCK' },
        { x: 14, z: 8, w: 3, d: 3, type: 'crate' }
      ],
      bombsites: [
        { id: 'A', name: 'Khu đặt bom A (Truck / Pit / Balcony)', x: 18, z: 14, description: 'Quảng trường thị trấn với hố Pit sâu và ban công căn hộ' },
        { id: 'B', name: 'Khu đặt bom B (Fountain / Church Ruins)', x: -18, z: 20, description: 'Sân đài phun nước giáo đường nối từ đường cua Banana' }
      ],
      spawns: {
        red: { x: -16, z: -26, label: 'T Spawn (Đầu Ngõ Phe Đỏ)' },
        blue: { x: 18, z: 26, label: 'CT Spawn (Quảng Trường Phe Xanh)' }
      },
      callouts: [
        { name: 'Banana', x: -16, z: -4, color: '#f59e0b' },
        { name: 'Mid', x: 0, z: -8, color: '#06b6d4' },
        { name: 'Boiler', x: 10, z: 2, color: '#a855f7' },
        { name: 'Pit', x: 24, z: 18, color: '#ef4444' },
        { name: 'Church', x: -18, z: 20, color: '#10b981' },
        { name: 'Site A', x: 18, z: 14, color: '#eab308' },
        { name: 'Site B', x: -18, z: 20, color: '#eab308' }
      ],
      tactics: {
        tips: [
          'Banana là vị trí sống còn của Site B: Phe nào ném lựu đạn HE và Smoke chặn Banana sớm sẽ chiếm ưu thế tuyệt đối.',
          'Hố Pit ở Site A là góc ẩn nấp khó chịu nhất: Hãy chuẩn bị lựu đạn nổ HE để quét sạch Pit trước khi đặt bom.',
          'Đi qua Boiler và Balcony từ Second Mid để tấn công bất ngờ vào Site A từ trên cao.'
        ],
        smokeSpots: [
          'Smoke Banana Coffin (Từ Banana T Car)',
          'Smoke CT Arch sang B (Từ Banana)',
          'Smoke Moto / Pit Site A (Từ Second Mid)',
          'Smoke Library / CT A (Từ Apartments Balcony)'
        ]
      }
    };
  }

  // Dust II default
  return {
    mapId: 'dust2',
    name: 'Dust II',
    code: 'de_dust2',
    vietnameseName: 'Sa Mạc Bụi II',
    tagline: 'Bản đồ bắn súng huyền thoại nhất lịch sử CS:GO',
    description: 'Biểu tượng bất tử của Counter-Strike với bố cục hình cỏ 4 lá hoàn hảo. Long A, Catwalk, Cửa Mid và Đường Hầm B luôn là chiến trường rực lửa.',
    obstacles: [
      // Outer perimeter walls
      { x: 0, z: -36, w: 72, d: 2, type: 'wall' },
      { x: 0, z: 36, w: 72, d: 2, type: 'wall' },
      { x: -36, z: 0, w: 2, d: 72, type: 'wall' },
      { x: 36, z: 0, w: 2, d: 72, type: 'wall' },
      // Mid doors
      { x: -10, z: 0, w: 12, d: 2, type: 'wall', label: 'MID' },
      { x: 10, z: 0, w: 12, d: 2, type: 'wall', label: 'MID' },
      // Underpass tunnel
      { x: 0, z: -11, w: 10, d: 14, type: 'tunnel', label: 'TUNNEL' },
      // Catwalk
      { x: 18, z: 0, w: 12, d: 16, type: 'catwalk', label: 'CATWALK' },
      // Long A corridor
      { x: -24, z: 0, w: 8, d: 36, type: 'tunnel', label: 'LONG' },
      // Crates & shipping containers
      { x: -8, z: -10, w: 4, d: 4, type: 'crate' },
      { x: 8, z: 10, w: 4, d: 4, type: 'crate' },
      { x: -24, z: 14, w: 5, d: 8, type: 'crate' }
    ],
    bombsites: [
      { id: 'A', name: 'Khu đặt bom A (Catwalk / Long A)', x: 18, z: 0, description: 'Khu vực trên cao Catwalk nhìn thẳng ra Long A và CT Spawn' },
      { id: 'B', name: 'Khu đặt bom B (Quảng trường B)', x: -24, z: 14, description: 'Khu vực khép kín với lối vào duy nhất từ B Tunnels và Cửa B' }
    ],
    spawns: {
      red: { x: -28, z: -28, label: 'T Spawn (Căn cứ Phe Đỏ)' },
      blue: { x: 28, z: 28, label: 'CT Spawn (Căn cứ Phe Xanh)' }
    },
    callouts: [
      { name: 'Long A', x: -24, z: -6, color: '#f59e0b' },
      { name: 'Catwalk', x: 18, z: 2, color: '#06b6d4' },
      { name: 'Mid Doors', x: 0, z: 0, color: '#a855f7' },
      { name: 'B Tunnels', x: -18, z: -14, color: '#10b981' },
      { name: 'Site A', x: 18, z: 0, color: '#eab308' },
      { name: 'Site B', x: -24, z: 14, color: '#eab308' }
    ],
    tactics: {
      tips: [
        'Long A là chìa khóa chiếm Site A: Phe Đỏ cần ném Flashbang qua cổng Long để đẩy ra chiếm góc.',
        'Smoke Cửa Mid giúp cắt đứt tầm nhìn ngắm tỉa AWP nguy hiểm từ CT Spawn sang T Spawn.',
        'Khi công B, sử dụng Smoke che Cửa B và Window để cô lập các góc kê phòng thủ.'
      ],
      smokeSpots: [
        'Smoke Cửa Mid (Từ T Spawn)',
        'Smoke CT Spawn từ Long A (Chiếm Site A an toàn)',
        'Smoke Cửa B & Cửa Sổ B (Từ B Tunnels)',
        'Smoke A Short / Catwalk (Từ Mid T)'
      ]
    }
  };
}
