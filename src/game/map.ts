import * as THREE from 'three';
import { textures } from './textures';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface MapData {
  sceneGroup: THREE.Group;
  colliders: CollisionBox[];
  spawns: {
    red: { x: number; y: number; z: number; rotY: number }[];
    blue: { x: number; y: number; z: number; rotY: number }[];
  };
  patrolPoints: THREE.Vector3[];
}

export function buildClassicMap(): MapData {
  const group = new THREE.Group();
  const colliders: CollisionBox[] = [];

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

  // 1. Main Ground Floor (70m x 70m)
  const floorGeo = new THREE.PlaneGeometry(72, 72);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Helper to add box and register collider
  const addSolidBox = (
    w: number, h: number, d: number,
    x: number, y: number, z: number,
    mat: THREE.Material,
    cast = true
  ): THREE.Mesh => {
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
    return mesh;
  };

  // 2. Perimeter Boundary Walls (Height: 6m, Thickness: 2m)
  const mapRadius = 36;
  const wallHeight = 6;
  // North Wall
  addSolidBox(72, wallHeight, 2, 0, 0, -mapRadius, wallMat);
  // South Wall
  addSolidBox(72, wallHeight, 2, 0, 0, mapRadius, wallMat);
  // West Wall
  addSolidBox(2, wallHeight, 72, -mapRadius, 0, 0, wallMat);
  // East Wall
  addSolidBox(2, wallHeight, 72, mapRadius, 0, 0, wallMat);

  // Battlements trim on top of perimeter
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

  // 3. Central Courtyard (Mid Arena)
  // Central Double Archway / Gate Walls separating Mid
  addSolidBox(12, 5, 2, -10, 0, 0, wallMat);
  addSolidBox(12, 5, 2, 10, 0, 0, wallMat);
  // Arch top lintel
  const archLintel = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 2), wallMat);
  archLintel.position.set(0, 4.4, 0);
  group.add(archLintel);
  colliders.push({
    minX: -4, maxX: 4, minY: 3.8, maxY: 5.0, minZ: -1, maxZ: 1
  });

  // Center Sandstone Pillar Monument
  addSolidBox(2.4, 4.5, 2.4, 0, 0, 6, wallMat);
  addSolidBox(3.0, 0.6, 3.0, 0, 0, 6, wallMat); // Pillar base

  // Center Mid Double Crate Cover
  addSolidBox(1.8, 1.8, 1.8, -3.5, 0, -5, crateMat);
  addSolidBox(1.8, 1.8, 1.8, -3.5, 1.8, -5, crateMat); // Stacked 2-high
  addSolidBox(1.8, 1.8, 1.8, -1.7, 0, -5, crateMat); // 1 beside it

  addSolidBox(1.8, 1.8, 1.8, 4, 0, 5, crateMat);
  addSolidBox(1.8, 1.8, 1.8, 4, 0, 3.2, crateMat);

  // 4. Elevated Catwalk / Sniper Balcony (y = 2.2m)
  // Catwalk platform (x: 12 to 24, z: -10 to 10)
  addSolidBox(12, 0.4, 18, 18, 2.0, 0, grateMat);
  // Supporting steel pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1f2227, roughness: 0.6, metalness: 0.8 });
  const addPillar = (px: number, pz: number) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.0, 8), pillarMat);
    p.position.set(px, 1.0, pz);
    group.add(p);
    colliders.push({ minX: px - 0.25, maxX: px + 0.25, minY: 0, maxY: 2.0, minZ: pz - 0.25, maxZ: pz + 0.25 });
  };
  addPillar(13, -8);
  addPillar(13, 0);
  addPillar(13, 8);
  addPillar(23, -8);
  addPillar(23, 0);
  addPillar(23, 8);

  // Ramp to Catwalk (from Blue side z = 14 to z = 9, rising from 0 to 2.0m)
  for (let step = 0; step < 8; step++) {
    const stepH = 0.25;
    const stepY = step * stepH;
    const stepZ = 13.5 - step * 0.6;
    addSolidBox(4, stepH * (step + 1), 0.6, 18, 0, stepZ, wallMat);
  }

  // Catwalk safety railing
  const railMat = new THREE.MeshStandardMaterial({ color: 0x33373d, roughness: 0.4 });
  const addRail = (w: number, d: number, rx: number, rz: number) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w, 1.0, d), railMat);
    r.position.set(rx, 2.7, rz);
    group.add(r);
    colliders.push({ minX: rx - w / 2, maxX: rx + w / 2, minY: 2.2, maxY: 3.2, minZ: rz - d / 2, maxZ: rz + d / 2 });
  };
  addRail(0.2, 18, 12, 0); // Front edge railing

  // 5. Long A Alley / Corridor (West side x = -20 to -26, z = -32 to 32)
  // Dividing Long Wall with Arch
  addSolidBox(2, 5, 26, -18, 0, -18, wallMat);
  addSolidBox(2, 5, 24, -18, 0, 18, wallMat);
  // Opening arch between Long and Mid is at z = -2 to 3

  // Shipping Container in Long A
  addSolidBox(3.2, 2.8, 7.5, -26, 0, -6, metalMat);
  addSolidBox(1.8, 1.8, 1.8, -22, 0, -14, crateMat);
  addSolidBox(1.8, 1.8, 1.8, -26, 0, 12, crateMat);
  addSolidBox(1.8, 1.8, 1.8, -26, 1.8, 12, crateMat);

  // 6. Red Spawn Area (Phoenix / Terrorist Base: x = -28, z = -28)
  // Bunkers & Sandbags
  addSolidBox(8, 3.5, 2, -28, 0, -22, wallMat);
  addSolidBox(2, 3.5, 6, -24, 0, -26, wallMat);
  addSolidBox(1.8, 1.8, 1.8, -32, 0, -32, crateMat);
  addSolidBox(1.8, 1.8, 1.8, -20, 0, -28, crateMat);

  // 7. Blue Spawn Area (Seal / CT Base: x = 28, z = 28)
  // Defensive Fortification
  addSolidBox(8, 3.5, 2, 26, 0, 20, wallMat);
  addSolidBox(2, 3.5, 6, 22, 0, 24, wallMat);
  addSolidBox(3.2, 2.8, 7.5, 28, 0, 10, metalMat); // Blue shipping container
  addSolidBox(1.8, 1.8, 1.8, 32, 0, 32, crateMat);
  addSolidBox(1.8, 1.8, 1.8, 20, 0, 30, crateMat);

  // 8. Flanking Underpass Tunnel (Tunnels connecting Spawn to Mid, x = -6 to 6, z = -18 to -26)
  // Low roof tunnel
  const tunnelRoof = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 12), wallMat);
  tunnelRoof.position.set(-6, 3.2, -18);
  group.add(tunnelRoof);
  addSolidBox(2, 3.2, 12, -11, 0, -18, wallMat);
  addSolidBox(2, 3.2, 12, -1, 0, -18, wallMat);

  // Hanging Industrial Warm Lights in Tunnel & Gateway
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

  // Tactical navigation waypoints for AI Bots
  const patrolPoints: THREE.Vector3[] = [
    new THREE.Vector3(-28, 1.6, -28), // Red Spawn
    new THREE.Vector3(-24, 1.6, -14), // Long A Entrance
    new THREE.Vector3(-26, 1.6, 0),   // Long A Mid
    new THREE.Vector3(-26, 1.6, 18),  // Long A South
    new THREE.Vector3(-6, 1.6, -18),  // Underpass Tunnel
    new THREE.Vector3(0, 1.6, -6),    // Mid Doors North
    new THREE.Vector3(0, 1.6, 6),     // Mid Doors South
    new THREE.Vector3(6, 1.6, 0),     // Mid Courtyard
    new THREE.Vector3(18, 3.6, 0),    // Catwalk High ground
    new THREE.Vector3(18, 1.6, 14),   // Catwalk Ramp
    new THREE.Vector3(26, 1.6, 14),   // Blue Approach
    new THREE.Vector3(28, 1.6, 28),   // Blue Spawn
  ];

  return {
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
    patrolPoints
  };
}
