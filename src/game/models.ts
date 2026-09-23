import * as THREE from 'three';
import { WeaponType, Team } from '../types/game';

// Materials pool for optimal performance
const gunMetalMat = new THREE.MeshStandardMaterial({
  color: 0x222428,
  roughness: 0.45,
  metalness: 0.8
});

const gunWoodMat = new THREE.MeshStandardMaterial({
  color: 0x7c431b,
  roughness: 0.6,
  metalness: 0.1
});

const knifeBladeMat = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  roughness: 0.25,
  metalness: 0.95
});

const armSkinMat = new THREE.MeshStandardMaterial({
  color: 0xc68e64,
  roughness: 0.8
});

const armSleeveMat = new THREE.MeshStandardMaterial({
  color: 0x2e3b2e, // Olive drab camo sleeve
  roughness: 0.9
});

export function createFirstPersonAK47(): {
  group: THREE.Group;
  muzzlePos: THREE.Vector3;
  magMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Receiver / Main body
  const receiverGeo = new THREE.BoxGeometry(0.08, 0.12, 0.48);
  const receiver = new THREE.Mesh(receiverGeo, gunMetalMat);
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.45, 8);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, gunMetalMat);
  barrel.position.set(0, 0.02, -0.42);
  group.add(barrel);

  // Gas tube above barrel
  const gasTubeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8);
  gasTubeGeo.rotateX(Math.PI / 2);
  const gasTube = new THREE.Mesh(gasTubeGeo, gunMetalMat);
  gasTube.position.set(0, 0.045, -0.32);
  group.add(gasTube);

  // Wooden Handguard
  const handguardGeo = new THREE.BoxGeometry(0.075, 0.085, 0.24);
  const handguard = new THREE.Mesh(handguardGeo, gunWoodMat);
  handguard.position.set(0, 0.02, -0.28);
  group.add(handguard);

  // Wooden Buttstock
  const stockGeo = new THREE.BoxGeometry(0.07, 0.14, 0.36);
  const stock = new THREE.Mesh(stockGeo, gunWoodMat);
  stock.position.set(0, -0.05, 0.38);
  stock.rotation.x = -0.15;
  group.add(stock);

  // Pistol Grip
  const gripGeo = new THREE.BoxGeometry(0.065, 0.18, 0.08);
  const grip = new THREE.Mesh(gripGeo, gunWoodMat);
  grip.position.set(0, -0.14, 0.1);
  grip.rotation.x = -0.35;
  group.add(grip);

  // Curved Banana Magazine (distinctive AK-47 shape)
  const magGeo = new THREE.BoxGeometry(0.06, 0.28, 0.12);
  const magMesh = new THREE.Mesh(magGeo, gunMetalMat);
  magMesh.position.set(0, -0.16, -0.08);
  magMesh.rotation.x = 0.28;
  group.add(magMesh);

  // Front Sight Post
  const sightGeo = new THREE.BoxGeometry(0.02, 0.06, 0.02);
  const sight = new THREE.Mesh(sightGeo, gunMetalMat);
  sight.position.set(0, 0.07, -0.58);
  group.add(sight);

  // Rear Sight
  const rearSightGeo = new THREE.BoxGeometry(0.04, 0.03, 0.04);
  const rearSight = new THREE.Mesh(rearSightGeo, gunMetalMat);
  rearSight.position.set(0, 0.075, -0.12);
  group.add(rearSight);

  // First-person right hand & forearm holding grip
  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 8), armSleeveMat);
  rightForearm.position.set(0.12, -0.28, 0.25);
  rightForearm.rotation.set(0.8, -0.3, 0.4);
  group.add(rightForearm);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), armSkinMat);
  rightHand.position.set(0.03, -0.14, 0.12);
  group.add(rightHand);

  // First-person left hand holding handguard
  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 8), armSleeveMat);
  leftForearm.position.set(-0.2, -0.26, -0.15);
  leftForearm.rotation.set(0.7, 0.4, -0.6);
  group.add(leftForearm);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.09), armSkinMat);
  leftHand.position.set(-0.04, -0.01, -0.25);
  group.add(leftHand);

  const muzzlePos = new THREE.Vector3(0, 0.02, -0.66);
  return { group, muzzlePos, magMesh };
}

export function createFirstPersonPistol(): {
  group: THREE.Group;
  muzzlePos: THREE.Vector3;
  slideMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Slide (recoils back on shot)
  const slideGeo = new THREE.BoxGeometry(0.06, 0.065, 0.32);
  const slideMesh = new THREE.Mesh(slideGeo, gunMetalMat);
  slideMesh.position.set(0, 0.03, -0.06);
  group.add(slideMesh);

  // Frame
  const frameGeo = new THREE.BoxGeometry(0.055, 0.05, 0.28);
  const frame = new THREE.Mesh(frameGeo, gunMetalMat);
  frame.position.set(0, -0.01, -0.05);
  group.add(frame);

  // Grip
  const gripGeo = new THREE.BoxGeometry(0.05, 0.18, 0.08);
  const grip = new THREE.Mesh(gripGeo, new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.85 }));
  grip.position.set(0, -0.1, 0.06);
  grip.rotation.x = -0.25;
  group.add(grip);

  // Trigger guard
  const guardGeo = new THREE.BoxGeometry(0.03, 0.06, 0.08);
  const guard = new THREE.Mesh(guardGeo, gunMetalMat);
  guard.position.set(0, -0.05, -0.02);
  group.add(guard);

  // Sights
  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.02), gunMetalMat);
  frontSight.position.set(0, 0.07, -0.2);
  group.add(frontSight);

  // Right hand holding pistol
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), armSkinMat);
  rightHand.position.set(0.01, -0.1, 0.06);
  group.add(rightHand);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 8), armSleeveMat);
  rightForearm.position.set(0.08, -0.3, 0.22);
  rightForearm.rotation.set(0.8, -0.2, 0.2);
  group.add(rightForearm);

  const muzzlePos = new THREE.Vector3(0, 0.03, -0.24);
  return { group, muzzlePos, slideMesh };
}

export function createFirstPersonKnife(): {
  group: THREE.Group;
  bladeMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Tactical Handle
  const handleGeo = new THREE.CylinderGeometry(0.025, 0.028, 0.22, 8);
  const handle = new THREE.Mesh(handleGeo, new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.9 }));
  handle.position.set(0, -0.08, 0);
  group.add(handle);

  // Handguard
  const guardGeo = new THREE.BoxGeometry(0.08, 0.015, 0.04);
  const guard = new THREE.Mesh(guardGeo, gunMetalMat);
  guard.position.set(0, 0.03, 0);
  group.add(guard);

  // Combat Blade (sharp curved edge)
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.035, 0.02);
  bladeShape.lineTo(0.03, 0.26);
  bladeShape.lineTo(0, 0.32); // Point
  bladeShape.lineTo(-0.02, 0.2);
  bladeShape.lineTo(-0.02, 0);
  bladeShape.closePath();

  const extrudeSettings = { depth: 0.008, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.003, bevelThickness: 0.003 };
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
  bladeGeo.center();
  const bladeMesh = new THREE.Mesh(bladeGeo, knifeBladeMat);
  bladeMesh.position.set(0, 0.18, 0);
  group.add(bladeMesh);

  // Right Hand gripping handle
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), armSkinMat);
  hand.position.set(0, -0.08, 0);
  group.add(hand);

  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 8), armSleeveMat);
  forearm.position.set(0.06, -0.28, 0.16);
  forearm.rotation.set(0.6, -0.2, 0.2);
  group.add(forearm);

  return { group, bladeMesh };
}

// 3D Player / Bot Avatar (Retro Low-Poly Military Soldier)
export function createPlayerMesh(team: Team, name: string): {
  mesh: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  legsMesh: THREE.Group;
  weaponHolder: THREE.Group;
  nameSprite: THREE.Sprite;
  updateWeapon: (weapon: WeaponType) => void;
  updateHealthTag: (health: number) => void;
} {
  const group = new THREE.Group();

  const isRed = team === 'red';
  const uniformColor = isRed ? 0xa84126 : 0x224870; // Phoenix Red / CT Navy Blue
  const vestColor = isRed ? 0x6e3828 : 0x18283d;
  const skinColor = 0xd49b72;
  const gearMat = new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.8 });
  const uniformMat = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.7 });
  const vestMat = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });

  // Body / Torso (Height: 0.7m, Center Y: 1.05m)
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.65, 0.3);
  const bodyMesh = new THREE.Mesh(bodyGeo, vestMat);
  bodyMesh.position.set(0, 1.05, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyMesh.userData = { hitbox: 'body' };
  group.add(bodyMesh);

  // Tactical Pouches on Vest
  const pouchGeo = new THREE.BoxGeometry(0.12, 0.15, 0.08);
  const pouch1 = new THREE.Mesh(pouchGeo, gearMat);
  pouch1.position.set(-0.15, 0.98, 0.18);
  group.add(pouch1);
  const pouch2 = new THREE.Mesh(pouchGeo, gearMat);
  pouch2.position.set(0.15, 0.98, 0.18);
  group.add(pouch2);

  // Head (Center Y: 1.55m, Radius: ~0.16m)
  const headGeo = new THREE.BoxGeometry(0.28, 0.3, 0.28);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.set(0, 1.55, 0);
  headMesh.castShadow = true;
  headMesh.userData = { hitbox: 'head' };
  group.add(headMesh);

  // Headgear (Red: Balaclava / Headband; Blue: Tactical Helmet)
  if (isRed) {
    const headband = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), new THREE.MeshStandardMaterial({ color: 0xc92a2a }));
    headband.position.set(0, 1.62, 0);
    group.add(headband);
  } else {
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.32), new THREE.MeshStandardMaterial({ color: 0x1b2c42, roughness: 0.6 }));
    helmet.position.set(0, 1.66, 0);
    group.add(helmet);

    // Visor / Goggles
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.08), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 }));
    visor.position.set(0, 1.57, -0.14);
    group.add(visor);
  }

  // Legs Group
  const legsMesh = new THREE.Group();
  const legGeo = new THREE.BoxGeometry(0.18, 0.72, 0.2);

  const leftLeg = new THREE.Mesh(legGeo, uniformMat);
  leftLeg.position.set(-0.14, 0.36, 0);
  leftLeg.castShadow = true;
  leftLeg.userData = { hitbox: 'legs' };
  legsMesh.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, uniformMat);
  rightLeg.position.set(0.14, 0.36, 0);
  rightLeg.castShadow = true;
  rightLeg.userData = { hitbox: 'legs' };
  legsMesh.add(rightLeg);

  // Combat Boots
  const bootGeo = new THREE.BoxGeometry(0.19, 0.16, 0.26);
  const leftBoot = new THREE.Mesh(bootGeo, gearMat);
  leftBoot.position.set(-0.14, 0.08, -0.03);
  legsMesh.add(leftBoot);
  const rightBoot = new THREE.Mesh(bootGeo, gearMat);
  rightBoot.position.set(0.14, 0.08, -0.03);
  legsMesh.add(rightBoot);

  group.add(legsMesh);

  // Weapon holder attached to right arm/shoulder
  const weaponHolder = new THREE.Group();
  weaponHolder.position.set(0.24, 1.15, -0.2);
  group.add(weaponHolder);

  // Held weapon meshes
  const akMesh = createMiniAK();
  const pistolMesh = createMiniPistol();
  const knifeMesh = createMiniKnife();

  weaponHolder.add(akMesh);
  weaponHolder.add(pistolMesh);
  weaponHolder.add(knifeMesh);

  const updateWeapon = (type: WeaponType) => {
    akMesh.visible = type === 'ak47';
    pistolMesh.visible = type === 'pistol';
    knifeMesh.visible = type === 'knife';
  };
  updateWeapon('ak47');

  // Overhead Tag (Canvas Sprite showing Name & Health bar)
  const tagCanvas = document.createElement('canvas');
  tagCanvas.width = 256;
  tagCanvas.height = 80;
  const tagCtx = tagCanvas.getContext('2d')!;
  const tagTexture = new THREE.CanvasTexture(tagCanvas);

  const drawTag = (hp: number) => {
    tagCtx.clearRect(0, 0, 256, 80);

    // Name text
    tagCtx.font = 'bold 24px monospace';
    tagCtx.textAlign = 'center';
    tagCtx.fillStyle = isRed ? '#ff6655' : '#55aaff';
    tagCtx.fillText(name, 128, 30);

    // HP background bar
    tagCtx.fillStyle = 'rgba(0,0,0,0.65)';
    tagCtx.fillRect(28, 44, 200, 18);

    // HP fill bar
    const hpWidth = Math.max(0, Math.min(200, (hp / 100) * 200));
    tagCtx.fillStyle = hp > 50 ? '#38d430' : hp > 25 ? '#e09819' : '#e02828';
    tagCtx.fillRect(28, 44, hpWidth, 18);

    // HP border
    tagCtx.strokeStyle = '#fff';
    tagCtx.lineWidth = 1.5;
    tagCtx.strokeRect(28, 44, 200, 18);

    tagTexture.needsUpdate = true;
  };

  drawTag(100);

  const spriteMat = new THREE.SpriteMaterial({ map: tagTexture, depthTest: false });
  const nameSprite = new THREE.Sprite(spriteMat);
  nameSprite.position.set(0, 1.95, 0);
  nameSprite.scale.set(1.4, 0.44, 1);
  group.add(nameSprite);

  return {
    mesh: group,
    headMesh,
    bodyMesh,
    legsMesh,
    weaponHolder,
    nameSprite,
    updateWeapon,
    updateHealthTag: drawTag
  };
}

function createMiniAK(): THREE.Group {
  const g = new THREE.Group();
  const rec = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.35), gunMetalMat);
  g.add(rec);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), gunMetalMat);
  barrel.rotateX(Math.PI / 2);
  barrel.position.set(0, 0.015, -0.3);
  g.add(barrel);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.22), gunWoodMat);
  stock.position.set(0, -0.03, 0.26);
  g.add(stock);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.08), gunMetalMat);
  mag.position.set(0, -0.1, -0.06);
  mag.rotation.x = 0.25;
  g.add(mag);
  g.scale.set(0.9, 0.9, 0.9);
  return g;
}

function createMiniPistol(): THREE.Group {
  const g = new THREE.Group();
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.18), gunMetalMat);
  slide.position.set(0, 0.02, -0.04);
  g.add(slide);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.05), gunMetalMat);
  grip.position.set(0, -0.05, 0.03);
  grip.rotation.x = -0.2;
  g.add(grip);
  return g;
}

function createMiniKnife(): THREE.Group {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.04), knifeBladeMat);
  blade.position.set(0, 0.08, -0.05);
  blade.rotation.x = Math.PI / 3;
  g.add(blade);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.1, 0.03), gunMetalMat);
  handle.position.set(0, -0.04, 0.03);
  g.add(handle);
  return g;
}
