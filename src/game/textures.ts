import * as THREE from 'three';

// Procedural pixel-art texture generator for authentic 90s CS 1.6 retro aesthetic
class TextureManager {
  private textures: Map<string, THREE.CanvasTexture> = new Map();

  private createPixelCanvas(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    draw(ctx);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestMipmapLinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  // Dust II Sandstone Wall
  public getSandstoneWall(): THREE.CanvasTexture {
    const key = 'sandstone_wall';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(128, 128, (ctx) => {
      // Base sandstone color
      ctx.fillStyle = '#bfa175';
      ctx.fillRect(0, 0, 128, 128);

      // Noise grain
      for (let x = 0; x < 128; x += 2) {
        for (let y = 0; y < 128; y += 2) {
          const rand = Math.random();
          if (rand > 0.6) {
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.fillRect(x, y, 2, 2);
          } else if (rand < 0.25) {
            ctx.fillStyle = 'rgba(255,255,255,0.09)';
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }

      // Brick horizontal mortar lines
      ctx.fillStyle = '#6a553a';
      for (let y = 0; y < 128; y += 32) {
        ctx.fillRect(0, y, 128, 3);
        // Highlight line
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, y + 3, 128, 1);
        ctx.fillStyle = '#6a553a';
      }

      // Vertical brick seams alternating
      for (let row = 0; row < 4; row++) {
        const y = row * 32;
        const offset = (row % 2) * 32;
        for (let x = offset; x < 128; x += 64) {
          ctx.fillStyle = '#5c4830';
          ctx.fillRect(x, y, 3, 32);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(x + 3, y, 1, 32);
        }
      }

      // Weathered cracks
      ctx.strokeStyle = '#4a3622';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20, 15);
      ctx.lineTo(35, 28);
      ctx.lineTo(42, 26);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(85, 75);
      ctx.lineTo(95, 88);
      ctx.lineTo(110, 92);
      ctx.stroke();
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.set(key, texture);
    return texture;
  }

  // Wooden Supply Crate with metal brackets
  public getWoodCrate(): THREE.CanvasTexture {
    const key = 'wood_crate';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(128, 128, (ctx) => {
      // Wood plank base
      ctx.fillStyle = '#7a5229';
      ctx.fillRect(0, 0, 128, 128);

      // Horizontal wood planks
      for (let y = 0; y < 128; y += 16) {
        ctx.fillStyle = y % 32 === 0 ? '#63401d' : '#855b30';
        ctx.fillRect(0, y, 128, 15);
        ctx.fillStyle = '#40270e';
        ctx.fillRect(0, y + 15, 128, 1);
      }

      // Wood grain lines
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        const w = 15 + Math.random() * 30;
        ctx.fillRect(x, y, w, 1);
      }

      // Wooden cross brace (CS classic X)
      ctx.strokeStyle = '#573719';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(114, 114);
      ctx.moveTo(114, 14);
      ctx.lineTo(14, 114);
      ctx.stroke();

      ctx.strokeStyle = '#8c6032';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(114, 114);
      ctx.moveTo(114, 14);
      ctx.lineTo(14, 114);
      ctx.stroke();

      // Metal reinforced border & corners
      ctx.fillStyle = '#2b2c2e';
      ctx.fillRect(0, 0, 128, 12);
      ctx.fillRect(0, 116, 128, 12);
      ctx.fillRect(0, 0, 12, 128);
      ctx.fillRect(116, 0, 12, 128);

      // Metal bolts in corners
      ctx.fillStyle = '#8f9399';
      const boltCoords = [
        [6, 6], [122, 6], [6, 122], [122, 122],
        [64, 6], [64, 122], [6, 64], [122, 64]
      ];
      boltCoords.forEach(([bx, by]) => {
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Stencil Font "[SITE A]" or "[TACTICAL]"
      ctx.fillStyle = 'rgba(200, 160, 40, 0.7)';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRATE 44', 64, 70);
    });

    this.textures.set(key, texture);
    return texture;
  }

  // Metal Hazard Container
  public getMetalContainer(): THREE.CanvasTexture {
    const key = 'metal_container';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(128, 128, (ctx) => {
      // Dark army olive green
      ctx.fillStyle = '#394634';
      ctx.fillRect(0, 0, 128, 128);

      // Vertical corrugated ribs
      for (let x = 0; x < 128; x += 16) {
        ctx.fillStyle = '#283224';
        ctx.fillRect(x, 0, 6, 128);
        ctx.fillStyle = '#4c5c46';
        ctx.fillRect(x + 6, 0, 4, 128);
        ctx.fillStyle = '#394634';
        ctx.fillRect(x + 10, 0, 6, 128);
      }

      // Yellow-black warning hazard stripe on top
      for (let x = -20; x < 150; x += 20) {
        ctx.fillStyle = '#e5b124';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 10, 0);
        ctx.lineTo(x, 20);
        ctx.lineTo(x - 10, 20);
        ctx.fill();

        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(x + 10, 0);
        ctx.lineTo(x + 20, 0);
        ctx.lineTo(x + 10, 20);
        ctx.lineTo(x, 20);
        ctx.fill();
      }

      // Rust patches
      ctx.fillStyle = 'rgba(140, 50, 20, 0.4)';
      ctx.fillRect(20, 80, 25, 30);
      ctx.fillRect(75, 40, 30, 20);
    });

    this.textures.set(key, texture);
    return texture;
  }

  // Ground Sand & Stone Floor
  public getFloorTexture(): THREE.CanvasTexture {
    const key = 'floor';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(128, 128, (ctx) => {
      // Warm sandy dust ground
      ctx.fillStyle = '#9e8460';
      ctx.fillRect(0, 0, 128, 128);

      // Large stone tiles
      ctx.strokeStyle = '#6e5a40';
      ctx.lineWidth = 2;
      for (let y = 0; y < 128; y += 32) {
        ctx.strokeRect(0, y, 64, 32);
        ctx.strokeRect(64, y, 64, 32);
      }

      // Grit & pebbles
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        const s = Math.random() > 0.8 ? 2 : 1;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
        ctx.fillRect(x, y, s, s);
      }
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.set(key, texture);
    return texture;
  }

  // Metal Grating for elevated catwalk
  public getMetalGrating(): THREE.CanvasTexture {
    const key = 'metal_grating';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(64, 64, (ctx) => {
      ctx.fillStyle = '#22252a';
      ctx.fillRect(0, 0, 64, 64);

      // Diamond or grid holes
      ctx.fillStyle = '#0a0a0d';
      for (let x = 0; x < 64; x += 8) {
        for (let y = 0; y < 64; y += 8) {
          ctx.fillRect(x + 2, y + 2, 4, 4);
        }
      }

      ctx.strokeStyle = '#4e5461';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 64; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 64);
        ctx.stroke();
      }
      for (let y = 0; y <= 64; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(64, y);
        ctx.stroke();
      }
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.set(key, texture);
    return texture;
  }

  // Skybox Cube / Dome Background
  public createSkyDome(): THREE.Mesh {
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 horizonColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize( vWorldPosition + offset ).y;
        vec3 col = mix( horizonColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) );
        if (h < 0.0) {
          col = mix( horizonColor, bottomColor, -h * 2.0 );
        }
        gl_FragColor = vec4( col, 1.0 );
      }
    `;

    const uniforms = {
      topColor: { value: new THREE.Color(0x3a6088) },      // CS Classic blue sky
      horizonColor: { value: new THREE.Color(0xd2b78b) },  // Warm desert haze
      bottomColor: { value: new THREE.Color(0x735c3f) },   // Ground reflection
      offset: { value: 20 },
      exponent: { value: 0.6 }
    };

    const skyGeo = new THREE.SphereGeometry(400, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.BackSide,
      depthWrite: false
    });

    return new THREE.Mesh(skyGeo, skyMat);
  }

  // High-fidelity Russian birch/walnut wood texture with grain
  public getAkWoodTexture(): THREE.CanvasTexture {
    const key = 'ak_wood';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(256, 128, (ctx) => {
      // Warm amber-brown wood base
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(0, 0, 256, 128);

      // Fine directional wood grain
      for (let y = 0; y < 128; y++) {
        const tone = Math.sin(y * 0.12) * 20 + Math.cos(y * 0.05) * 15;
        const r = Math.min(255, Math.max(0, 139 + tone + (Math.random() - 0.5) * 15));
        const g = Math.min(255, Math.max(0, 69 + tone * 0.6 + (Math.random() - 0.5) * 10));
        const b = Math.min(255, Math.max(0, 19 + tone * 0.3));
        ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        ctx.fillRect(0, y, 256, 1);
      }

      // Wavy growth rings
      ctx.strokeStyle = 'rgba(60, 25, 5, 0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const yStart = i * 22 + 5;
        ctx.beginPath();
        ctx.moveTo(0, yStart);
        ctx.bezierCurveTo(80, yStart + 8, 160, yStart - 6, 256, yStart + 4);
        ctx.stroke();
      }

      // Specular lacquer coat sheen
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0, 'rgba(255, 220, 180, 0.15)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.08)');
      grad.addColorStop(1, 'rgba(255, 200, 150, 0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.set(key, texture);
    return texture;
  }

  // Blued military gunmetal with subtle brushed steel finish
  public getGunMetalTexture(): THREE.CanvasTexture {
    const key = 'gun_metal';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(128, 128, (ctx) => {
      ctx.fillStyle = '#22252a';
      ctx.fillRect(0, 0, 128, 128);

      // Fine brushed metallic streaks
      for (let y = 0; y < 128; y += 1) {
        const rand = (Math.random() - 0.5) * 16;
        const v = Math.min(255, Math.max(0, 36 + rand));
        ctx.fillStyle = `rgb(${Math.round(v)}, ${Math.round(v + 3)}, ${Math.round(v + 6)})`;
        ctx.fillRect(0, y, 128, 1);
      }

      // Subtle edge bevel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(0, 0, 128, 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 126, 128, 2);
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.set(key, texture);
    return texture;
  }

  // Tactical checkered diamond knurling for grips
  public getTacticalGripTexture(): THREE.CanvasTexture {
    const key = 'tactical_grip';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(64, 64, (ctx) => {
      ctx.fillStyle = '#18191c';
      ctx.fillRect(0, 0, 64, 64);

      // Diamond checkered mesh
      ctx.strokeStyle = '#2d3036';
      ctx.lineWidth = 1;
      for (let i = -64; i < 128; i += 6) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 64, 64);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(i, 64);
        ctx.lineTo(i + 64, 0);
        ctx.stroke();
      }
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.set(key, texture);
    return texture;
  }

  // Russian Laminate Amber/Birch Wood for AK-47 stock and handguards
  public getRussianLaminateWoodTexture(): THREE.CanvasTexture {
    const key = 'ak_laminate_wood';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(128, 128, (ctx) => {
      // Warm amber / mahogany base
      ctx.fillStyle = '#682a0e';
      ctx.fillRect(0, 0, 128, 128);

      // Laminate alternating ply layers
      for (let y = 0; y < 128; y += 4) {
        ctx.fillStyle = (y % 8 === 0) ? '#4a1b08' : '#7b3412';
        ctx.fillRect(0, y, 128, 3);
      }

      // Wavy organic wood grain lines
      for (let i = 0; i < 28; i++) {
        ctx.strokeStyle = 'rgba(30, 10, 3, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const startY = Math.random() * 128;
        ctx.moveTo(0, startY);
        ctx.bezierCurveTo(40, startY + (Math.random() - 0.5) * 16, 85, startY + (Math.random() - 0.5) * 16, 128, startY + (Math.random() - 0.5) * 8);
        ctx.stroke();
      }

      // Gloss varnish highlight sheen
      ctx.fillStyle = 'rgba(255, 210, 160, 0.08)';
      ctx.fillRect(0, 0, 128, 6);
      ctx.fillRect(0, 60, 128, 4);
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.set(key, texture);
    return texture;
  }

  // Tactical combat glove Kevlar fabric
  public getGloveTexture(): THREE.CanvasTexture {
    const key = 'tactical_glove';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(64, 64, (ctx) => {
      ctx.fillStyle = '#282b28';
      ctx.fillRect(0, 0, 64, 64);

      // Weave pattern
      ctx.fillStyle = '#202220';
      for (let x = 0; x < 64; x += 4) {
        for (let y = 0; y < 64; y += 4) {
          if ((x + y) % 8 === 0) {
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
    });

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textures.set(key, texture);
    return texture;
  }

  // High-energy muzzle flash particle sprite
  public getMuzzleFlashSprite(): THREE.CanvasTexture {
    const key = 'muzzle_flash';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(128, 128, (ctx) => {
      ctx.clearRect(0, 0, 128, 128);

      // Soft fiery outer corona
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.15, '#fff688');
      grad.addColorStop(0.35, '#ff9911');
      grad.addColorStop(0.65, '#e63900');
      grad.addColorStop(1, 'rgba(230, 40, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 62, 0, Math.PI * 2);
      ctx.fill();

      // Brilliant 4-directional sharp flash spikes
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
      angles.forEach((angle, idx) => {
        const length = idx < 4 ? 60 : 42;
        const width = idx < 4 ? 6 : 4;
        ctx.save();
        ctx.translate(64, 64);
        ctx.rotate(angle);
        ctx.fillStyle = idx < 4 ? '#ffffff' : '#ffe177';
        ctx.beginPath();
        ctx.moveTo(-width, 0);
        ctx.lineTo(0, length);
        ctx.lineTo(width, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Pure white blinding inner core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(64, 64, 12, 0, Math.PI * 2);
      ctx.fill();
    });

    this.textures.set(key, texture);
    return texture;
  }

  // Bullet Hole Decal
  public getBulletHoleTexture(): THREE.CanvasTexture {
    const key = 'bullet_hole';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(32, 32, (ctx) => {
      ctx.clearRect(0, 0, 32, 32);
      // Dark center cavity
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(16, 16, 6, 0, Math.PI * 2);
      ctx.fill();

      // Gray impact rim
      ctx.strokeStyle = '#4a443a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Radiating cracks
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.moveTo(16 + Math.cos(a) * 6, 16 + Math.sin(a) * 6);
        ctx.lineTo(16 + Math.cos(a) * 14, 16 + Math.sin(a) * 14);
        ctx.stroke();
      }
    });

    this.textures.set(key, texture);
    return texture;
  }

  // Knife Slash Scratch Decal
  public getKnifeSlashTexture(): THREE.CanvasTexture {
    const key = 'knife_slash';
    if (this.textures.has(key)) return this.textures.get(key)!;

    const texture = this.createPixelCanvas(64, 64, (ctx) => {
      ctx.clearRect(0, 0, 64, 64);

      // Deep dark cut trench
      ctx.strokeStyle = '#0d0d0f';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(8, 56);
      ctx.quadraticCurveTo(34, 30, 56, 8);
      ctx.stroke();

      // Chipped wall border
      ctx.strokeStyle = '#635340';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, 54);
      ctx.quadraticCurveTo(36, 28, 54, 10);
      ctx.stroke();

      // Sharp metallic shine inside slash
      ctx.strokeStyle = '#c8d1db';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(18, 46);
      ctx.quadraticCurveTo(32, 32, 46, 18);
      ctx.stroke();
    });

    this.textures.set(key, texture);
    return texture;
  }
}

export const textures = new TextureManager();
