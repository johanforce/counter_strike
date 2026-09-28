import * as THREE from 'three';
import { WeaponType, Team } from '../types/game';
import { textures } from './textures';

// High-fidelity PBR Materials for Viewmodel Weapons
const gunMetalMat = new THREE.MeshStandardMaterial({
  map: textures.getGunMetalTexture(),
  roughness: 0.32,
  metalness: 0.88
});

const darkSteelMat = new THREE.MeshStandardMaterial({
  color: 0x181a1d,
  roughness: 0.38,
  metalness: 0.92
});

const polishedSteelMat = new THREE.MeshStandardMaterial({
  color: 0xc4cdd6,
  roughness: 0.18,
  metalness: 0.96
});

const akWoodMat = new THREE.MeshStandardMaterial({
  map: textures.getRussianLaminateWoodTexture(),
  roughness: 0.38,
  metalness: 0.08
});

const tacticalGripMat = new THREE.MeshStandardMaterial({
  map: textures.getTacticalGripTexture(),
  color: 0x1a1a1c,
  roughness: 0.85
});

const polymerFrameMat = new THREE.MeshStandardMaterial({
  color: 0x1c1e21,
  roughness: 0.75,
  metalness: 0.2
});

const brassBulletMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  roughness: 0.25,
  metalness: 0.92
});

const tritiumGreenMat = new THREE.MeshBasicMaterial({
  color: 0x24ff66
});

const knifeBladeMat = new THREE.MeshStandardMaterial({
  color: 0xd5dde5,
  roughness: 0.15,
  metalness: 0.98
});

const armSkinMat = new THREE.MeshStandardMaterial({
  color: 0xc8926d,
  roughness: 0.65
});

const gloveFabricMat = new THREE.MeshStandardMaterial({
  map: textures.getGloveTexture(),
  roughness: 0.85
});

const gloveArmorMat = new THREE.MeshStandardMaterial({
  color: 0x121315,
  roughness: 0.35,
  metalness: 0.5
});

const armSleeveMat = new THREE.MeshStandardMaterial({
  color: 0x2a382a, // Tactical olive drab sleeve
  roughness: 0.9
});

export function createFirstPersonAK47(): {
  group: THREE.Group;
  muzzlePos: THREE.Vector3;
  muzzlePoint: THREE.Object3D;
  magMesh: THREE.Object3D;
  boltMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // 1. Lower Receiver (smooth beveled stamped steel)
  const receiverGeo = new THREE.BoxGeometry(0.068, 0.085, 0.38);
  const receiver = new THREE.Mesh(receiverGeo, gunMetalMat);
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // 2. Rounded Stamped Upper Dust Cover (Half-cylinder top eliminating angularity!)
  const dustCoverGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.35, 24, 1, false, 0, Math.PI);
  dustCoverGeo.rotateZ(Math.PI / 2);
  dustCoverGeo.rotateY(Math.PI / 2);
  const dustCover = new THREE.Mesh(dustCoverGeo, darkSteelMat);
  dustCover.position.set(0, 0.042, -0.01);
  group.add(dustCover);

  // Stamped structural ribs on dust cover
  for (let i = -1; i <= 1; i++) {
    const ribGeo = new THREE.TorusGeometry(0.0342, 0.0022, 8, 20, Math.PI);
    ribGeo.rotateY(Math.PI / 2);
    const rib = new THREE.Mesh(ribGeo, darkSteelMat);
    rib.position.set(0, 0.042, i * 0.08);
    group.add(rib);
  }

  // Right-side Ejection Port Cutout showing bolt carrier & brass round
  const portGeo = new THREE.BoxGeometry(0.015, 0.03, 0.12);
  const portChamber = new THREE.Mesh(portGeo, darkSteelMat);
  portChamber.position.set(0.033, 0.02, -0.02);
  group.add(portChamber);

  const brassRound = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 12), brassBulletMat);
  brassRound.rotateX(Math.PI / 2);
  brassRound.position.set(0.03, 0.02, -0.02);
  group.add(brassRound);

  // Steel Bolt Carrier & Right-side Charging Handle
  const boltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 16), polishedSteelMat);
  boltMesh.rotateX(Math.PI / 2);
  boltMesh.position.set(0.028, 0.025, -0.01);
  group.add(boltMesh);

  const handleGeo = new THREE.CylinderGeometry(0.005, 0.007, 0.032, 12);
  handleGeo.rotateZ(Math.PI / 2);
  const chargingHandle = new THREE.Mesh(handleGeo, polishedSteelMat);
  chargingHandle.position.set(0.05, 0.028, -0.02);
  group.add(chargingHandle);

  // Safety Selector Switch Lever on right side
  const selector = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.12), darkSteelMat);
  selector.position.set(0.036, 0.005, 0.04);
  selector.rotation.z = -0.15;
  group.add(selector);

  // Smooth Curved Trigger Guard & Trigger
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0035, 10, 20, Math.PI), darkSteelMat);
  triggerGuard.rotation.x = Math.PI / 2;
  triggerGuard.position.set(0, -0.045, 0.07);
  group.add(triggerGuard);

  const trigger = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.003, 0.025, 8), darkSteelMat);
  trigger.rotation.x = 0.35;
  trigger.position.set(0, -0.05, 0.075);
  group.add(trigger);

  // 3. Stepped High-Poly Barrel Assembly
  const trunnion = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.021, 0.08, 24), darkSteelMat);
  trunnion.rotateX(Math.PI / 2);
  trunnion.position.set(0, 0.018, -0.22);
  group.add(trunnion);

  const barrelGeo = new THREE.CylinderGeometry(0.0145, 0.0155, 0.44, 28);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, darkSteelMat);
  barrel.position.set(0, 0.018, -0.42);
  group.add(barrel);

  // Iconic AKM Slanted Muzzle Brake (Angle-cut compensator with hollow bore)
  const muzzleBrakeGeo = new THREE.CylinderGeometry(0.017, 0.016, 0.065, 28);
  muzzleBrakeGeo.rotateX(Math.PI / 2);
  const muzzleBrake = new THREE.Mesh(muzzleBrakeGeo, darkSteelMat);
  muzzleBrake.position.set(0, 0.018, -0.66);
  muzzleBrake.rotation.x = 0.12; // Slanted cut!
  group.add(muzzleBrake);

  // Hollow muzzle crown bore
  const boreGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.03, 20);
  boreGeo.rotateX(Math.PI / 2);
  const bore = new THREE.Mesh(boreGeo, new THREE.MeshBasicMaterial({ color: 0x050505 }));
  bore.position.set(0, 0.018, -0.68);
  group.add(bore);

  // Slim Under-Barrel Steel Cleaning Rod
  const rodGeo = new THREE.CylinderGeometry(0.0028, 0.0028, 0.44, 12);
  rodGeo.rotateX(Math.PI / 2);
  const cleaningRod = new THREE.Mesh(rodGeo, polishedSteelMat);
  cleaningRod.position.set(0, -0.002, -0.44);
  group.add(cleaningRod);

  // Gas Block connecting Barrel & Gas Tube with Bayonet Lug
  const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.045), darkSteelMat);
  gasBlock.position.set(0, 0.032, -0.46);
  group.add(gasBlock);

  // Upper Gas Tube (smooth cylinder)
  const gasTubeGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.28, 24);
  gasTubeGeo.rotateX(Math.PI / 2);
  const gasTube = new THREE.Mesh(gasTubeGeo, darkSteelMat);
  gasTube.position.set(0, 0.044, -0.32);
  group.add(gasTube);

  // Front Sight Tower with Twin Protective Wings & Adjustable Post
  const frontSightTower = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.055, 0.025), darkSteelMat);
  frontSightTower.position.set(0, 0.048, -0.62);
  group.add(frontSightTower);

  const sightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.02, 10), polishedSteelMat);
  sightPost.position.set(0, 0.076, -0.62);
  group.add(sightPost);

  // Protective curved sight wings
  const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.03, 0.015), darkSteelMat);
  wingLeft.position.set(-0.011, 0.072, -0.62);
  wingLeft.rotation.z = -0.2;
  group.add(wingLeft);

  const wingRight = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.03, 0.015), darkSteelMat);
  wingRight.position.set(0.011, 0.072, -0.62);
  wingRight.rotation.z = 0.2;
  group.add(wingRight);

  // Rear Tangent Leaf Sight with Graduated Elevation Slider
  const rearSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.025, 0.06), darkSteelMat);
  rearSightBase.position.set(0, 0.052, -0.16);
  group.add(rearSightBase);

  const rearLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.01, 0.075), darkSteelMat);
  rearLeaf.position.set(0, 0.062, -0.17);
  rearLeaf.rotation.x = -0.06;
  group.add(rearLeaf);

  // 4. Contoured Russian Laminate Wood Handguards (Smooth, rounded, ergonomic!)
  // Lower handguard: rounded capsule profile with side finger swells
  const lowerWoodGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.23, 24, 1, false, Math.PI, Math.PI);
  lowerWoodGeo.rotateZ(Math.PI / 2);
  lowerWoodGeo.rotateY(Math.PI / 2);
  const lowerWood = new THREE.Mesh(lowerWoodGeo, akWoodMat);
  lowerWood.position.set(0, 0.008, -0.30);
  group.add(lowerWood);

  // Upper wood heat shield over gas tube
  const upperWoodGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.19, 24, 1, false, 0, Math.PI);
  upperWoodGeo.rotateZ(Math.PI / 2);
  upperWoodGeo.rotateY(Math.PI / 2);
  const upperWood = new THREE.Mesh(upperWoodGeo, akWoodMat);
  upperWood.position.set(0, 0.046, -0.30);
  group.add(upperWood);

  // Steel retaining bands holding the wooden handguards
  const bandRear = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 24), darkSteelMat);
  bandRear.rotateX(Math.PI / 2);
  bandRear.position.set(0, 0.024, -0.19);
  group.add(bandRear);

  const bandFront = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.02, 24), darkSteelMat);
  bandFront.rotateX(Math.PI / 2);
  bandFront.position.set(0, 0.024, -0.41);
  group.add(bandFront);

  // 5. Contoured Russian Laminate Buttstock
  const stockGroup = new THREE.Group();
  const stockBodyGeo = new THREE.CylinderGeometry(0.028, 0.042, 0.32, 20);
  stockBodyGeo.rotateX(Math.PI / 2);
  const stockBody = new THREE.Mesh(stockBodyGeo, akWoodMat);
  stockBody.scale.set(0.8, 1.8, 1.0);
  stockBody.position.set(0, -0.045, 0.32);
  stockBody.rotation.x = -0.12;
  stockGroup.add(stockBody);

  // Buttplate in dark steel with screws
  const buttplate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.015), darkSteelMat);
  buttplate.position.set(0, -0.08, 0.48);
  buttplate.rotation.x = -0.12;
  stockGroup.add(buttplate);

  // Sling swivel ring
  const slingSwivel = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 8, 16), darkSteelMat);
  slingSwivel.position.set(-0.026, -0.06, 0.42);
  stockGroup.add(slingSwivel);
  group.add(stockGroup);

  // 6. Ergonomic Contoured Bakelite Pistol Grip
  const gripGroup = new THREE.Group();
  const gripCore = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.16, 20), tacticalGripMat);
  gripCore.scale.set(0.7, 1.0, 1.2);
  gripCore.position.set(0, -0.13, 0.10);
  gripCore.rotation.x = -0.32;
  gripGroup.add(gripCore);

  // Grip base plate with screw
  const gripBase = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.015, 16), darkSteelMat);
  gripBase.scale.set(0.7, 1.0, 1.2);
  gripBase.position.set(0, -0.20, 0.13);
  gripBase.rotation.x = -0.32;
  gripGroup.add(gripBase);
  group.add(gripGroup);

  // 7. Iconic Curved Banana Magazine (30-round arc with horizontal stamping ribs)
  const magGroup = new THREE.Group();
  magGroup.position.set(0, -0.05, -0.06);

  // Constructed of 4 smoothly chained curved segments forming the authentic crescent
  const segmentCount = 4;
  for (let s = 0; s < segmentCount; s++) {
    const t = s / (segmentCount - 1);
    const segAngle = 0.08 + t * 0.28;
    const segY = -t * 0.20;
    const segZ = -t * 0.07;

    const segGeo = new THREE.BoxGeometry(0.052, 0.065, 0.095);
    const segMesh = new THREE.Mesh(segGeo, darkSteelMat);
    segMesh.position.set(0, segY, segZ);
    segMesh.rotation.x = segAngle;
    magGroup.add(segMesh);

    // Stamped reinforcement ribs on both sides
    for (let r = -1; r <= 1; r++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.005, 0.06), darkSteelMat);
      rib.position.set(0, segY + r * 0.018, segZ);
      rib.rotation.x = segAngle;
      magGroup.add(rib);
    }
  }

  // Steel Magazine Floorplate
  const floorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.012, 0.105), darkSteelMat);
  floorPlate.position.set(0, -0.22, -0.08);
  floorPlate.rotation.x = 0.36;
  magGroup.add(floorPlate);
  group.add(magGroup);

  // 8. First-Person Tactical Gloved Hands & Smooth Forearms
  // Right Arm & Hand gripping pistol grip
  const rightForearmGeo = new THREE.CylinderGeometry(0.052, 0.062, 0.44, 20);
  const rightForearm = new THREE.Mesh(rightForearmGeo, armSleeveMat);
  rightForearm.position.set(0.13, -0.28, 0.26);
  rightForearm.rotation.set(0.82, -0.28, 0.38);
  group.add(rightForearm);

  const rightGlove = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.046, 0.12, 16), gloveFabricMat);
  rightGlove.position.set(0.03, -0.13, 0.11);
  rightGlove.rotation.set(0.2, 0, -0.15);
  group.add(rightGlove);

  // Carbon fiber knuckle armor plate
  const rightKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.065), gloveArmorMat);
  rightKnuckle.position.set(0.045, -0.12, 0.11);
  rightKnuckle.rotation.set(0.2, 0, -0.15);
  group.add(rightKnuckle);

  // Left Arm & Hand supporting lower handguard
  const leftForearmGeo = new THREE.CylinderGeometry(0.052, 0.062, 0.48, 20);
  const leftForearm = new THREE.Mesh(leftForearmGeo, armSleeveMat);
  leftForearm.position.set(-0.21, -0.24, -0.14);
  leftForearm.rotation.set(0.72, 0.38, -0.58);
  group.add(leftForearm);

  const leftGlove = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.044, 0.13, 16), gloveFabricMat);
  leftGlove.position.set(-0.03, -0.015, -0.28);
  leftGlove.rotation.set(-0.1, 0.25, 0.35);
  group.add(leftGlove);

  const leftKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 0.06), gloveArmorMat);
  leftKnuckle.position.set(-0.045, -0.025, -0.28);
  group.add(leftKnuckle);

  // 9. Exact Muzzle Point Anchor (Physical tip of the slanted compensator!)
  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.018, -0.70);
  group.add(muzzlePoint);

  return {
    group,
    muzzlePos: muzzlePoint.position.clone(),
    muzzlePoint,
    magMesh: magGroup,
    boltMesh
  };
}

export function createFirstPersonPistol(): {
  group: THREE.Group;
  muzzlePos: THREE.Vector3;
  muzzlePoint: THREE.Object3D;
  slideMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // 1. Sleek Machined Slide (Rounded top chamfer, smooth high-poly)
  const slideGeo = new THREE.BoxGeometry(0.054, 0.062, 0.32);
  const slideMesh = new THREE.Mesh(slideGeo, gunMetalMat);
  slideMesh.position.set(0, 0.035, -0.06);
  group.add(slideMesh);

  // Rounded top of slide (semi-cylinder eliminating boxiness)
  const slideTopGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.31, 24, 1, false, 0, Math.PI);
  slideTopGeo.rotateZ(Math.PI / 2);
  slideTopGeo.rotateY(Math.PI / 2);
  const slideTop = new THREE.Mesh(slideTopGeo, darkSteelMat);
  slideTop.position.set(0, 0.031, 0);
  slideMesh.add(slideTop);

  // Cocking Serrations (Rear & Front grip ridges)
  for (let i = -3; i <= 3; i++) {
    const rearGroove = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.038, 0.004), darkSteelMat);
    rearGroove.position.set(0, 0, 0.10 + i * 0.012);
    slideMesh.add(rearGroove);
  }

  // Recessed Ejection Port showing Stainless Steel Barrel Chamber
  const chamberCutout = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.028, 0.08), darkSteelMat);
  chamberCutout.position.set(0.024, 0.015, -0.02);
  slideMesh.add(chamberCutout);

  const barrelChamber = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.075, 20), polishedSteelMat);
  barrelChamber.rotateX(Math.PI / 2);
  barrelChamber.position.set(0.005, 0.01, -0.02);
  slideMesh.add(barrelChamber);

  // High-Visibility 3-Dot Tritium Green Tactical Sights
  const frontSightBlade = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.018, 0.018), darkSteelMat);
  frontSightBlade.position.set(0, 0.042, -0.145);
  slideMesh.add(frontSightBlade);

  const frontDot = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.004, 12), tritiumGreenMat);
  frontDot.rotateX(Math.PI / 2);
  frontDot.position.set(0, 0.043, -0.136);
  slideMesh.add(frontDot);

  const rearSightNotch = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.018, 0.018), darkSteelMat);
  rearSightNotch.position.set(0, 0.042, 0.14);
  slideMesh.add(rearSightNotch);

  const rearDotL = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.004, 12), tritiumGreenMat);
  rearDotL.rotateX(Math.PI / 2);
  rearDotL.position.set(-0.008, 0.043, 0.148);
  slideMesh.add(rearDotL);

  const rearDotR = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.004, 12), tritiumGreenMat);
  rearDotR.rotateX(Math.PI / 2);
  rearDotR.position.set(0.008, 0.043, 0.148);
  slideMesh.add(rearDotR);

  // Hollow Muzzle Crown & Rifled Steel Inner Barrel
  const muzzleCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.02, 24), darkSteelMat);
  muzzleCrown.rotateX(Math.PI / 2);
  muzzleCrown.position.set(0, 0.005, -0.165);
  slideMesh.add(muzzleCrown);

  const innerBore = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.03, 16), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  innerBore.rotateX(Math.PI / 2);
  innerBore.position.set(0, 0.005, -0.17);
  slideMesh.add(innerBore);

  // 2. Polymer Ergonomic Frame with Accessory Picatinny Rail
  const frameGeo = new THREE.BoxGeometry(0.05, 0.048, 0.28);
  const frame = new THREE.Mesh(frameGeo, polymerFrameMat);
  frame.position.set(0, -0.01, -0.05);
  group.add(frame);

  // Picatinny rail slots under dust cover
  for (let i = 0; i < 3; i++) {
    const railSlot = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.008, 0.006), darkSteelMat);
    railSlot.position.set(0, -0.028, -0.12 + i * 0.025);
    group.add(railSlot);
  }

  // Smooth Curved Trigger Guard with Front Finger Rest
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.004, 10, 20, Math.PI), darkSteelMat);
  guard.rotation.x = Math.PI / 2;
  guard.position.set(0, -0.042, 0.01);
  group.add(guard);

  // Skeletonized Metal Trigger
  const trigger = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0035, 0.028, 10), polishedSteelMat);
  trigger.rotation.x = 0.32;
  trigger.position.set(0, -0.04, 0.015);
  group.add(trigger);

  // External Skeletonized Combat Hammer
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.035, 0.02), darkSteelMat);
  hammer.position.set(0, 0.032, 0.10);
  hammer.rotation.x = -0.45;
  group.add(hammer);

  // 3. Contoured Ergonomic Grip with Diamond Knurling & Finger Grooves
  const gripGroup = new THREE.Group();
  const gripMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.18, 20), tacticalGripMat);
  gripMesh.scale.set(0.72, 1.0, 1.25);
  gripMesh.position.set(0, -0.11, 0.06);
  gripMesh.rotation.x = -0.28;
  gripGroup.add(gripMesh);

  // Beavertail tang over grip
  const beavertail = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.018, 0.045), polymerFrameMat);
  beavertail.position.set(0, -0.005, 0.105);
  beavertail.rotation.x = 0.35;
  gripGroup.add(beavertail);

  // Magazine Baseplate Bumper
  const magBumper = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.018, 0.075), darkSteelMat);
  magBumper.position.set(0, -0.19, 0.09);
  magBumper.rotation.x = -0.28;
  gripGroup.add(magBumper);
  group.add(gripGroup);

  // 4. Two-Handed Combat Gloved Stance
  const rightHand = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.12, 16), gloveFabricMat);
  rightHand.position.set(0.01, -0.10, 0.07);
  rightHand.rotation.set(-0.25, 0, 0);
  group.add(rightHand);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.44, 20), armSleeveMat);
  rightForearm.position.set(0.08, -0.29, 0.23);
  rightForearm.rotation.set(0.78, -0.20, 0.22);
  group.add(rightForearm);

  // Left Supporting Hand wrapped around right fingers
  const leftHand = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.04, 0.11, 16), gloveFabricMat);
  leftHand.position.set(-0.02, -0.11, 0.065);
  leftHand.rotation.set(-0.25, 0.35, 0.4);
  group.add(leftHand);

  // 5. Muzzle Point Anchor at exact bore opening
  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.038, -0.24);
  group.add(muzzlePoint);

  return {
    group,
    muzzlePos: muzzlePoint.position.clone(),
    muzzlePoint,
    slideMesh
  };
}

export function createFirstPersonKnife(): {
  group: THREE.Group;
  bladeMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // 1. Ribbed Tactical Combat Handle with Ergonomic Finger Grooves
  const handleGroup = new THREE.Group();
  const handleGeo = new THREE.CylinderGeometry(0.022, 0.025, 0.22, 20);
  const handle = new THREE.Mesh(handleGeo, tacticalGripMat);
  handle.position.set(0, -0.07, 0);
  handleGroup.add(handle);

  // Ring ridges for combat grip retention
  for (let i = -3; i <= 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0025, 8, 18), darkSteelMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -0.07 + i * 0.022, 0);
    handleGroup.add(ring);
  }

  // Heavy Steel Pommel with Lanyard Hole
  const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.024, 0.03, 18), darkSteelMat);
  pommel.position.set(0, -0.18, 0);
  handleGroup.add(pommel);
  group.add(handleGroup);

  // 2. Steel Combat Crossguard with Barrel Ring
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.016, 0.036), darkSteelMat);
  guard.position.set(0, 0.04, 0);
  group.add(guard);

  // 3. Tactical M9 Bayonet Blade with Serrated Spine & Fuller Blood Groove
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.036, 0.01);
  bladeShape.lineTo(0.032, 0.28);
  bladeShape.lineTo(0, 0.35); // Sharp tanto/clip point
  bladeShape.lineTo(-0.018, 0.22);
  bladeShape.lineTo(-0.018, 0);
  bladeShape.closePath();

  const extrudeSettings = {
    depth: 0.007,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.003,
    bevelThickness: 0.003
  };
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
  bladeGeo.center();
  const bladeMesh = new THREE.Mesh(bladeGeo, knifeBladeMat);
  bladeMesh.position.set(0, 0.21, 0);
  group.add(bladeMesh);

  // Upper Spine Serrations
  for (let i = 0; i < 6; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.01), darkSteelMat);
    tooth.position.set(-0.018, 0.12 + i * 0.022, 0);
    group.add(tooth);
  }

  // 4. Tactical Gloved Hand Holding Knife
  const hand = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.12, 16), gloveFabricMat);
  hand.position.set(0, -0.07, 0);
  group.add(hand);

  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.44, 20), armSleeveMat);
  forearm.position.set(0.07, -0.27, 0.18);
  forearm.rotation.set(0.62, -0.22, 0.22);
  group.add(forearm);

  return { group, bladeMesh };
}

// ---------------------------------------------------------------------------
// USP-S Tactical Silenced Pistol (Default CS:GO Starter Pistol)
// ---------------------------------------------------------------------------
export function createFirstPersonUSP(): {
  group: THREE.Group;
  muzzlePos: THREE.Vector3;
  muzzlePoint: THREE.Object3D;
  slideMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Matte black tactical slide
  const slideMesh = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.052, 0.26), darkSteelMat);
  slideMesh.position.set(0, 0.032, -0.04);
  group.add(slideMesh);

  // Slide serrations & ejection port
  const port = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.024, 0.065), polishedSteelMat);
  port.position.set(0.018, 0.012, -0.01);
  slideMesh.add(port);

  // Tritium green sights
  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.014), tritiumGreenMat);
  frontSight.position.set(0, 0.032, -0.115);
  slideMesh.add(frontSight);
  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.014, 0.014), darkSteelMat);
  rearSight.position.set(0, 0.032, 0.115);
  slideMesh.add(rearSight);

  // Polymer frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.042, 0.24), polymerFrameMat);
  frame.position.set(0, -0.008, -0.03);
  group.add(frame);

  // Iconic Long Cylindrical Suppressor (Silencer)
  const silencerMat = new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: 0.45, metalness: 0.85 });
  const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.24, 24), silencerMat);
  silencer.rotateX(Math.PI / 2);
  silencer.position.set(0, 0.028, -0.28);
  group.add(silencer);

  // Silencer knurled rings
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 24), gunMetalMat);
    ring.rotateX(Math.PI / 2);
    ring.position.set(0, 0.028, -0.18 - i * 0.08);
    group.add(ring);
  }

  // Grip & trigger guard
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0035, 8, 16, Math.PI), polymerFrameMat);
  guard.rotation.x = Math.PI / 2;
  guard.position.set(0, -0.036, 0.02);
  group.add(guard);

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.16, 16), tacticalGripMat);
  grip.scale.set(0.72, 1.0, 1.2);
  grip.position.set(0, -0.10, 0.06);
  grip.rotation.x = -0.25;
  group.add(grip);

  // Hands & Forearms
  const rightHand = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.11, 16), gloveFabricMat);
  rightHand.position.set(0.01, -0.095, 0.07);
  rightHand.rotation.set(-0.25, 0, 0);
  group.add(rightHand);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.42, 18), armSleeveMat);
  rightForearm.position.set(0.08, -0.28, 0.23);
  rightForearm.rotation.set(0.78, -0.20, 0.22);
  group.add(rightForearm);

  const leftHand = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.038, 0.10, 16), gloveFabricMat);
  leftHand.position.set(-0.02, -0.105, 0.065);
  leftHand.rotation.set(-0.25, 0.35, 0.4);
  group.add(leftHand);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.028, -0.41);
  group.add(muzzlePoint);

  return {
    group,
    muzzlePos: muzzlePoint.position.clone(),
    muzzlePoint,
    slideMesh
  };
}

// ---------------------------------------------------------------------------
// MP9 Tactical Submachine Gun
// ---------------------------------------------------------------------------
export function createFirstPersonMP9(): {
  group: THREE.Group;
  muzzlePos: THREE.Vector3;
  muzzlePoint: THREE.Object3D;
  boltMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  const mp9BodyMat = new THREE.MeshStandardMaterial({ color: 0x24282e, roughness: 0.55, metalness: 0.45 });

  // Compact Upper & Lower Polymer Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.085, 0.34), mp9BodyMat);
  receiver.position.set(0, 0.01, -0.04);
  group.add(receiver);

  // Top Picatinny Rail & Red-Dot Reflex Sight
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.012, 0.32), darkSteelMat);
  topRail.position.set(0, 0.058, -0.04);
  group.add(topRail);

  const opticFrame = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.036, 0.06), darkSteelMat);
  opticFrame.position.set(0, 0.078, 0.01);
  group.add(opticFrame);

  const redDot = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  redDot.position.set(0, 0.082, 0.01);
  group.add(redDot);

  // Barrel Shroud with Cooling Vents
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.18, 20), darkSteelMat);
  shroud.rotateX(Math.PI / 2);
  shroud.position.set(0, 0.015, -0.28);
  group.add(shroud);

  const barrelTip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.08, 16), gunMetalMat);
  barrelTip.rotateX(Math.PI / 2);
  barrelTip.position.set(0, 0.015, -0.39);
  group.add(barrelTip);

  // Bolt Carrier
  const boltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.024, 0.08), polishedSteelMat);
  boltMesh.position.set(0.032, 0.025, -0.02);
  group.add(boltMesh);

  // Extended 30-Round Vertical Magazine inside Pistol Grip
  const gripMag = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.24, 0.058), tacticalGripMat);
  gripMag.position.set(0, -0.13, 0.03);
  gripMag.rotation.x = -0.15;
  group.add(gripMag);

  const magBottom = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.14, 0.042), darkSteelMat);
  magBottom.position.set(0, -0.27, 0.045);
  magBottom.rotation.x = -0.15;
  group.add(magBottom);

  // Forward Tactical Vertical Grip
  const foregrip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.11, 16), tacticalGripMat);
  foregrip.position.set(0, -0.075, -0.17);
  group.add(foregrip);

  // Folding Skeleton Stock
  const stockRod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 12), darkSteelMat);
  stockRod.rotateX(Math.PI / 2);
  stockRod.position.set(0, 0.005, 0.24);
  group.add(stockRod);

  // Hands & Forearms
  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.42, 18), armSleeveMat);
  rightForearm.position.set(0.12, -0.27, 0.24);
  rightForearm.rotation.set(0.82, -0.26, 0.35);
  group.add(rightForearm);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 18), armSleeveMat);
  leftForearm.position.set(-0.18, -0.24, -0.08);
  leftForearm.rotation.set(0.72, 0.35, -0.52);
  group.add(leftForearm);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.015, -0.44);
  group.add(muzzlePoint);

  return {
    group,
    muzzlePos: muzzlePoint.position.clone(),
    muzzlePoint,
    boltMesh
  };
}

// ---------------------------------------------------------------------------
// XM1014 Tactical Auto-Shotgun
// ---------------------------------------------------------------------------
export function createFirstPersonXM1014(): {
  group: THREE.Group;
  muzzlePos: THREE.Vector3;
  muzzlePoint: THREE.Object3D;
  boltMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Heavy Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.09, 0.38), gunMetalMat);
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // Red 12-Gauge Shotgun Shells on Side Saddle
  const shellRedMat = new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.4 });
  for (let i = 0; i < 4; i++) {
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.055, 12), shellRedMat);
    shell.position.set(-0.038, 0.01, -0.08 + i * 0.035);
    group.add(shell);
    const brass = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.014, 12), brassBulletMat);
    brass.position.set(-0.038, -0.018, -0.08 + i * 0.035);
    group.add(brass);
  }

  // Bolt & Charging Handle
  const boltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.028, 0.11), polishedSteelMat);
  boltMesh.position.set(0.033, 0.018, -0.02);
  group.add(boltMesh);

  // Long 12-Gauge Barrel & Under-Barrel Magazine Tube
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.019, 0.56, 24), darkSteelMat);
  barrel.rotateX(Math.PI / 2);
  barrel.position.set(0, 0.026, -0.44);
  group.add(barrel);

  const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.50, 20), gunMetalMat);
  magTube.rotateX(Math.PI / 2);
  magTube.position.set(0, -0.012, -0.41);
  group.add(magTube);

  // Ribbed Polymer Forend Pump/Handguard
  const handguard = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.26, 20), tacticalGripMat);
  handguard.rotateX(Math.PI / 2);
  handguard.position.set(0, -0.008, -0.32);
  group.add(handguard);

  // Ghost Ring Sights
  const rearRing = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 8, 16), darkSteelMat);
  rearRing.position.set(0, 0.056, 0.12);
  group.add(rearRing);

  const frontBlade = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.022, 0.015), tritiumGreenMat);
  frontBlade.position.set(0, 0.05, -0.68);
  group.add(frontBlade);

  // Tactical Buttstock & Grip
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.044, 0.34, 18), polymerFrameMat);
  stock.rotateX(Math.PI / 2);
  stock.scale.set(0.8, 1.7, 1.0);
  stock.position.set(0, -0.04, 0.33);
  stock.rotation.x = -0.12;
  group.add(stock);

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.15, 16), tacticalGripMat);
  grip.position.set(0, -0.12, 0.11);
  grip.rotation.x = -0.3;
  group.add(grip);

  // Hands & Forearms
  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.44, 20), armSleeveMat);
  rightForearm.position.set(0.13, -0.28, 0.26);
  rightForearm.rotation.set(0.82, -0.28, 0.38);
  group.add(rightForearm);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.48, 20), armSleeveMat);
  leftForearm.position.set(-0.21, -0.24, -0.14);
  leftForearm.rotation.set(0.72, 0.38, -0.58);
  group.add(leftForearm);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.026, -0.74);
  group.add(muzzlePoint);

  return {
    group,
    muzzlePos: muzzlePoint.position.clone(),
    muzzlePoint,
    boltMesh
  };
}

// ---------------------------------------------------------------------------
// M4A1-S Silenced Carbine (CT Signature Rifle)
// ---------------------------------------------------------------------------
export function createFirstPersonM4A1S(): {
  group: THREE.Group;
  muzzlePos: THREE.Vector3;
  muzzlePoint: THREE.Object3D;
  boltMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  const m4BodyMat = new THREE.MeshStandardMaterial({ color: 0x1e2229, roughness: 0.42, metalness: 0.78 });
  const m4AccentMat = new THREE.MeshStandardMaterial({ color: 0x2d3542, roughness: 0.5, metalness: 0.65 });

  // Upper & Lower AR-15 Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.092, 0.36), m4BodyMat);
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // Iconic M4 Carry Handle & Rear Peep Sight
  const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.016, 0.22), darkSteelMat);
  handleBar.position.set(0, 0.074, 0.01);
  group.add(handleBar);

  const pillarFront = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.032, 0.028), darkSteelMat);
  pillarFront.position.set(0, 0.056, -0.08);
  group.add(pillarFront);

  const pillarRear = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.032, 0.032), darkSteelMat);
  pillarRear.position.set(0, 0.056, 0.10);
  group.add(pillarRear);

  // Quad-Rail Handguard with Vent Slots
  const handguard = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.28, 16), m4AccentMat);
  handguard.rotateX(Math.PI / 2);
  handguard.position.set(0, 0.012, -0.32);
  group.add(handguard);

  // Triangular A2 Front Sight Post
  const frontTower = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.062, 0.035), darkSteelMat);
  frontTower.position.set(0, 0.048, -0.49);
  frontTower.rotation.x = 0.15;
  group.add(frontTower);

  // Barrel & Iconic Long M4A1-S Carbon Suppressor (Silencer)
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.18, 20), darkSteelMat);
  barrel.rotateX(Math.PI / 2);
  barrel.position.set(0, 0.014, -0.50);
  group.add(barrel);

  const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.26, 24), darkSteelMat);
  suppressor.rotateX(Math.PI / 2);
  suppressor.position.set(0, 0.014, -0.68);
  group.add(suppressor);

  // STANAG 25-Round Metal Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.21, 0.085), m4AccentMat);
  mag.position.set(0, -0.13, -0.06);
  mag.rotation.x = 0.16;
  group.add(mag);

  // Bolt Ejection Port Cover
  const boltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.026, 0.095), polishedSteelMat);
  boltMesh.position.set(0.033, 0.018, -0.01);
  group.add(boltMesh);

  // Collapsible Crane Buttstock & Buffer Tube
  const bufferTube = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.28, 16), darkSteelMat);
  bufferTube.rotateX(Math.PI / 2);
  bufferTube.position.set(0, 0.01, 0.30);
  group.add(bufferTube);

  const craneStock = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.125, 0.18), m4BodyMat);
  craneStock.position.set(0, -0.025, 0.37);
  group.add(craneStock);

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.15, 16), tacticalGripMat);
  grip.position.set(0, -0.12, 0.10);
  grip.rotation.x = -0.3;
  group.add(grip);

  // Hands & Forearms
  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.44, 20), armSleeveMat);
  rightForearm.position.set(0.13, -0.28, 0.26);
  rightForearm.rotation.set(0.82, -0.28, 0.38);
  group.add(rightForearm);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.48, 20), armSleeveMat);
  leftForearm.position.set(-0.21, -0.24, -0.14);
  leftForearm.rotation.set(0.72, 0.38, -0.58);
  group.add(leftForearm);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.014, -0.82);
  group.add(muzzlePoint);

  return {
    group,
    muzzlePos: muzzlePoint.position.clone(),
    muzzlePoint,
    boltMesh
  };
}

// ---------------------------------------------------------------------------
// AWP Arctic Warfare Police Magnum Sniper Rifle
// ---------------------------------------------------------------------------
export function createFirstPersonAWP(): {
  group: THREE.Group;
  muzzlePos: THREE.Vector3;
  muzzlePoint: THREE.Object3D;
  boltMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  // Iconic Olive-Drab Green Polymer Chassis
  const awpGreenMat = new THREE.MeshStandardMaterial({ color: 0x354a2f, roughness: 0.55, metalness: 0.22 });
  const scopeLensMat = new THREE.MeshStandardMaterial({ color: 0x10354f, roughness: 0.08, metalness: 0.95 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.085, 0.52), awpGreenMat);
  chassis.position.set(0, -0.01, -0.06);
  group.add(chassis);

  // Thumbhole Stock with Cheek Rest
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.13, 0.32), awpGreenMat);
  stock.position.set(0, -0.035, 0.34);
  group.add(stock);

  const cheekPad = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.035, 0.16), darkSteelMat);
  cheekPad.position.set(0, 0.035, 0.32);
  group.add(cheekPad);

  // Heavy Upper Steel Receiver & Bolt Action Knob
  const upperRec = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.32, 20), darkSteelMat);
  upperRec.rotateX(Math.PI / 2);
  upperRec.position.set(0, 0.038, 0.02);
  group.add(upperRec);

  const boltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 16), polishedSteelMat);
  boltMesh.rotateX(Math.PI / 2);
  boltMesh.position.set(0.022, 0.038, 0.05);
  group.add(boltMesh);

  const boltKnob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), darkSteelMat);
  boltKnob.position.set(0.032, -0.015, 0.02);
  boltMesh.add(boltKnob);

  // Telescopic Sniper Scope with Dual Mount Rings & Objective Bell
  const scopeGroup = new THREE.Group();
  scopeGroup.position.set(0, 0.095, 0.0);

  const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 24), darkSteelMat);
  scopeTube.rotateX(Math.PI / 2);
  scopeGroup.add(scopeTube);

  const frontBell = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.018, 0.10, 24), darkSteelMat);
  frontBell.rotateX(Math.PI / 2);
  frontBell.position.set(0, 0, -0.19);
  scopeGroup.add(frontBell);

  const frontLens = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.006, 24), scopeLensMat);
  frontLens.rotateX(Math.PI / 2);
  frontLens.position.set(0, 0, -0.24);
  scopeGroup.add(frontLens);

  const rearEyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.018, 0.07, 24), darkSteelMat);
  rearEyepiece.rotateX(Math.PI / 2);
  rearEyepiece.position.set(0, 0, 0.18);
  scopeGroup.add(rearEyepiece);

  const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.045, 0.024), darkSteelMat);
  mount1.position.set(0, -0.03, -0.08);
  scopeGroup.add(mount1);

  const mount2 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.045, 0.024), darkSteelMat);
  mount2.position.set(0, -0.03, 0.08);
  scopeGroup.add(mount2);

  // Elevation & Windage Turrets
  const topTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.024, 16), darkSteelMat);
  topTurret.position.set(0, 0.024, 0);
  scopeGroup.add(topTurret);

  group.add(scopeGroup);

  // Long Free-Floating Fluted Sniper Barrel & Heavy Muzzle Brake
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.019, 0.68, 24), darkSteelMat);
  barrel.rotateX(Math.PI / 2);
  barrel.position.set(0, 0.032, -0.52);
  group.add(barrel);

  const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.038, 0.085), darkSteelMat);
  muzzleBrake.position.set(0, 0.032, -0.88);
  group.add(muzzleBrake);

  // Folding Tactical Bipod under Forend
  const bipodL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 10), darkSteelMat);
  bipodL.rotateX(Math.PI / 2);
  bipodL.position.set(-0.025, -0.058, -0.24);
  group.add(bipodL);

  const bipodR = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 10), darkSteelMat);
  bipodR.rotateX(Math.PI / 2);
  bipodR.position.set(0.025, -0.058, -0.24);
  group.add(bipodR);

  // Large .338 Lapua Box Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.12, 0.13), darkSteelMat);
  mag.position.set(0, -0.09, -0.02);
  group.add(mag);

  // Hands & Forearms
  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.44, 20), armSleeveMat);
  rightForearm.position.set(0.13, -0.28, 0.26);
  rightForearm.rotation.set(0.82, -0.28, 0.38);
  group.add(rightForearm);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.48, 20), armSleeveMat);
  leftForearm.position.set(-0.21, -0.24, -0.14);
  leftForearm.rotation.set(0.72, 0.38, -0.58);
  group.add(leftForearm);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.032, -0.93);
  group.add(muzzlePoint);

  return {
    group,
    muzzlePos: muzzlePoint.position.clone(),
    muzzlePoint,
    boltMesh
  };
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
  const m4Mesh = createMiniM4();
  const awpMesh = createMiniAWP();
  const smgMesh = createMiniSMG();
  const pistolMesh = createMiniPistol();
  const knifeMesh = createMiniKnife();
  const heMesh = createMiniGrenade('he');
  const smokeMesh = createMiniGrenade('smoke');

  weaponHolder.add(akMesh);
  weaponHolder.add(m4Mesh);
  weaponHolder.add(awpMesh);
  weaponHolder.add(smgMesh);
  weaponHolder.add(pistolMesh);
  weaponHolder.add(knifeMesh);
  weaponHolder.add(heMesh);
  weaponHolder.add(smokeMesh);

  const updateWeapon = (type: WeaponType) => {
    akMesh.visible = type === 'ak47';
    m4Mesh.visible = type === 'm4a1s';
    awpMesh.visible = type === 'awp';
    smgMesh.visible = type === 'mp9' || type === 'xm1014';
    pistolMesh.visible = type === 'pistol' || type === 'usp';
    knifeMesh.visible = type === 'knife';
    heMesh.visible = type === 'hegrenade';
    smokeMesh.visible = type === 'smokegrenade';
  };
  updateWeapon('usp');

  // Overhead Tag (Canvas Sprite showing Name & Health bar colored by Team)
  const tagCanvas = document.createElement('canvas');
  tagCanvas.width = 256;
  tagCanvas.height = 80;
  const tagCtx = tagCanvas.getContext('2d')!;
  const tagTexture = new THREE.CanvasTexture(tagCanvas);

  const drawTag = (hp: number) => {
    tagCtx.clearRect(0, 0, 256, 80);

    const barX = 28;
    const barY = 44;
    const barW = 200;
    const barH = 18;
    const hpClamped = Math.max(0, Math.min(100, hp));
    const hpWidth = Math.max(0, Math.min(barW, (hpClamped / 100) * barW));

    // Outer subtle dark badge background
    tagCtx.fillStyle = isRed ? 'rgba(25, 8, 8, 0.78)' : 'rgba(8, 18, 32, 0.78)';
    tagCtx.fillRect(16, 6, 224, 66);
    tagCtx.strokeStyle = isRed ? 'rgba(239, 68, 68, 0.45)' : 'rgba(59, 130, 246, 0.45)';
    tagCtx.lineWidth = 1;
    tagCtx.strokeRect(16, 6, 224, 66);

    // Name text with Team color
    tagCtx.font = 'bold 22px monospace';
    tagCtx.textAlign = 'center';
    tagCtx.textBaseline = 'middle';
    tagCtx.fillStyle = isRed ? '#ff5c4d' : '#60a5fa';
    tagCtx.fillText(name, 128, 25);

    // HP background slot (dark with team tint)
    tagCtx.fillStyle = isRed ? 'rgba(40, 10, 10, 0.9)' : 'rgba(10, 25, 45, 0.9)';
    tagCtx.fillRect(barX, barY, barW, barH);

    // HP Fill Bar (Strictly colored according to Team: Red Team = Red hues, Blue Team = Blue hues)
    if (hpWidth > 0) {
      const grad = tagCtx.createLinearGradient(barX, barY, barX + hpWidth, barY);
      if (isRed) {
        if (hpClamped > 50) {
          grad.addColorStop(0, '#dc2626');
          grad.addColorStop(1, '#ff6b6b');
        } else if (hpClamped > 25) {
          grad.addColorStop(0, '#b91c1c');
          grad.addColorStop(1, '#ef4444');
        } else {
          grad.addColorStop(0, '#7f1d1d');
          grad.addColorStop(1, '#dc2626');
        }
      } else {
        if (hpClamped > 50) {
          grad.addColorStop(0, '#2563eb');
          grad.addColorStop(1, '#60a5fa');
        } else if (hpClamped > 25) {
          grad.addColorStop(0, '#1d4ed8');
          grad.addColorStop(1, '#38bdf8');
        } else {
          grad.addColorStop(0, '#1e3a8a');
          grad.addColorStop(1, '#2563eb');
        }
      }
      tagCtx.fillStyle = grad;
      tagCtx.fillRect(barX, barY, hpWidth, barH);
    }

    // HP border with Team Color accent
    tagCtx.strokeStyle = isRed ? '#ef4444' : '#3b82f6';
    tagCtx.lineWidth = 1.5;
    tagCtx.strokeRect(barX, barY, barW, barH);

    // HP Text overlay inside the bar for crystal clear readability
    tagCtx.font = 'bold 11px monospace';
    tagCtx.textAlign = 'center';
    tagCtx.textBaseline = 'middle';
    tagCtx.fillStyle = '#ffffff';
    tagCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    tagCtx.shadowBlur = 3;
    tagCtx.fillText(`${Math.round(hpClamped)} HP`, 128, barY + barH / 2);
    tagCtx.shadowBlur = 0;

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
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.22), akWoodMat);
  stock.position.set(0, -0.03, 0.26);
  g.add(stock);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.08), gunMetalMat);
  mag.position.set(0, -0.1, -0.06);
  mag.rotation.x = 0.25;
  g.add(mag);
  g.scale.set(0.9, 0.9, 0.9);
  return g;
}

function createMiniM4(): THREE.Group {
  const g = new THREE.Group();
  const rec = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.085, 0.36), darkSteelMat);
  g.add(rec);
  const silencer = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.38, 8), darkSteelMat);
  silencer.rotateX(Math.PI / 2);
  silencer.position.set(0, 0.015, -0.34);
  g.add(silencer);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.22), darkSteelMat);
  stock.position.set(0, -0.02, 0.26);
  g.add(stock);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.075), gunMetalMat);
  mag.position.set(0, -0.1, -0.05);
  g.add(mag);
  g.scale.set(0.9, 0.9, 0.9);
  return g;
}

function createMiniAWP(): THREE.Group {
  const g = new THREE.Group();
  const awpMat = new THREE.MeshStandardMaterial({ color: 0x354a2f, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.48), awpMat);
  g.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.48, 8), darkSteelMat);
  barrel.rotateX(Math.PI / 2);
  barrel.position.set(0, 0.02, -0.44);
  g.add(barrel);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 8), darkSteelMat);
  scope.rotateX(Math.PI / 2);
  scope.position.set(0, 0.075, -0.02);
  g.add(scope);
  return g;
}

function createMiniSMG(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.075, 0.26), darkSteelMat);
  g.add(body);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.045), gunMetalMat);
  mag.position.set(0, -0.1, 0.02);
  g.add(mag);
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

function createMiniGrenade(type: 'he' | 'smoke'): THREE.Group {
  const g = new THREE.Group();
  if (type === 'he') {
    const heMat = new THREE.MeshStandardMaterial({ color: 0x3d4a2b, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), heMat);
    g.add(body);
    const topPin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), darkSteelMat);
    topPin.position.set(0, 0.04, 0);
    g.add(topPin);
  } else {
    const smokeMat = new THREE.MeshStandardMaterial({ color: 0x8a9299, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 12), smokeMat);
    g.add(body);
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 8), darkSteelMat);
    topCap.position.set(0, 0.055, 0);
    g.add(topCap);
  }
  return g;
}

// ---------------------------------------------------------------------------
// First Person HE Grenade (Olive Drab Segmented Fragmentation Grenade)
// ---------------------------------------------------------------------------
export function createFirstPersonHEGrenade(): {
  group: THREE.Group;
  grenadeBody: THREE.Group;
  pinRing: THREE.Mesh;
} {
  const group = new THREE.Group();
  const grenadeBody = new THREE.Group();

  const heGreenMat = new THREE.MeshStandardMaterial({
    color: 0x3a4b2c,
    roughness: 0.55,
    metalness: 0.2
  });

  // Egg/oval fragmentation body
  const bodyGeo = new THREE.SphereGeometry(0.052, 20, 20);
  bodyGeo.scale(1, 1.25, 1);
  const mainSphere = new THREE.Mesh(bodyGeo, heGreenMat);
  mainSphere.castShadow = true;
  grenadeBody.add(mainSphere);

  // Serration grooves
  for (let i = -2; i <= 2; i++) {
    const groove = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.003, 8, 20), darkSteelMat);
    groove.rotation.x = Math.PI / 2;
    groove.position.y = i * 0.022;
    grenadeBody.add(groove);
  }

  // Steel neck & fuse mechanism
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.038, 16), darkSteelMat);
  neck.position.y = 0.075;
  grenadeBody.add(neck);

  // Safety lever (spoon) curving along the body
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.11, 0.006), darkSteelMat);
  lever.position.set(0, 0.038, 0.048);
  lever.rotation.x = 0.12;
  grenadeBody.add(lever);

  // Pull Ring & Split Pin
  const pinRing = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 8, 16), polishedSteelMat);
  pinRing.rotation.y = Math.PI / 2;
  pinRing.position.set(-0.026, 0.082, 0.01);
  grenadeBody.add(pinRing);

  // Position grenade in center of hand
  grenadeBody.position.set(0.18, -0.15, -0.32);
  group.add(grenadeBody);

  // Gloved hand holding grenade
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.09, 0.08), gloveFabricMat);
  rightHand.position.set(0.18, -0.18, -0.31);
  group.add(rightHand);

  // Forearm extending down
  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.44, 20), armSleeveMat);
  forearm.position.set(0.24, -0.32, -0.18);
  forearm.rotation.set(0.7, -0.25, 0.2);
  group.add(forearm);

  return { group, grenadeBody, pinRing };
}

// ---------------------------------------------------------------------------
// First Person Smoke Grenade (Metal Canister with emission vent holes)
// ---------------------------------------------------------------------------
export function createFirstPersonSmokeGrenade(): {
  group: THREE.Group;
  canisterBody: THREE.Group;
  pinRing: THREE.Mesh;
} {
  const group = new THREE.Group();
  const canisterBody = new THREE.Group();

  const smokeGreyMat = new THREE.MeshStandardMaterial({
    color: 0x939ba3,
    roughness: 0.45,
    metalness: 0.35
  });

  const whiteStripeMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.6
  });

  // Cylindrical canister body
  const canGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 24);
  const canister = new THREE.Mesh(canGeo, smokeGreyMat);
  canisterBody.add(canister);

  // White identification band
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.035, 24), whiteStripeMat);
  band.position.y = 0.02;
  canisterBody.add(band);

  // Top cap with vent holes
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.045, 0.025, 20), darkSteelMat);
  topCap.position.y = 0.09;
  canisterBody.add(topCap);

  // Safety lever
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.006), darkSteelMat);
  lever.position.set(0, 0.045, 0.045);
  canisterBody.add(lever);

  // Pull Ring
  const pinRing = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 8, 16), polishedSteelMat);
  pinRing.rotation.y = Math.PI / 2;
  pinRing.position.set(-0.028, 0.095, 0.01);
  canisterBody.add(pinRing);

  canisterBody.position.set(0.18, -0.15, -0.32);
  group.add(canisterBody);

  // Gloved hand
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.09, 0.08), gloveFabricMat);
  rightHand.position.set(0.18, -0.18, -0.31);
  group.add(rightHand);

  // Forearm
  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.44, 20), armSleeveMat);
  forearm.position.set(0.24, -0.32, -0.18);
  forearm.rotation.set(0.7, -0.25, 0.2);
  group.add(forearm);

  return { group, canisterBody, pinRing };
}

// ---------------------------------------------------------------------------
// World 3D Grenade Mesh (Physics Entity thrown in world space)
// ---------------------------------------------------------------------------
export function createWorldGrenadeMesh(type: 'he' | 'smoke'): THREE.Group {
  const g = new THREE.Group();
  if (type === 'he') {
    const heMat = new THREE.MeshStandardMaterial({
      color: 0x3d4e2d,
      roughness: 0.5,
      metalness: 0.25
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), heMat);
    body.scale.set(1, 1.25, 1);
    body.castShadow = true;
    g.add(body);

    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.05, 10), darkSteelMat);
    fuse.position.y = 0.11;
    fuse.castShadow = true;
    g.add(fuse);

    const spoon = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.14, 0.008), darkSteelMat);
    spoon.position.set(0, 0.05, 0.07);
    g.add(spoon);
  } else {
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0x8a9299,
      roughness: 0.45,
      metalness: 0.35
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 16), smokeMat);
    body.castShadow = true;
    g.add(body);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    band.position.y = 0.02;
    g.add(band);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.035, 16), darkSteelMat);
    cap.position.y = 0.115;
    g.add(cap);
  }

  return g;
}
