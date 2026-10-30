import * as THREE from 'three';

export const AIR = 0;

export const BLOCK_TYPES = [
  null,
  { name: 'Stone', color: 0x9b9c96 },
  { name: 'Crate', color: 0xb1793f },
  { name: 'Sand', color: 0xd6c284 },
  { name: 'Metal', color: 0x5c707c },
  { name: 'Brick', color: 0xa6564c },
  { name: 'Grass', color: 0x6f9a54 },
  { name: 'Snow', color: 0xf2f6fa },
  { name: 'Ice', color: 0x88d4f2 },
  { name: 'Magma', color: 0xe03a10 },
  { name: 'Basalt', color: 0x27272b },
  { name: 'Water', color: 0x1f78c8 },
  { name: 'Wood', color: 0x7a5230 },
  { name: 'Concrete', color: 0x6d727a },
  { name: 'Foliage', color: 0x2e6b34 },
];

export const PLACEABLE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13];

const EPS = 1e-4;

function hash3(x, y, z) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (z | 0) * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export class VoxelWorld {
  constructor(sx, sy, sz) {
    this.sx = sx;
    this.sy = sy;
    this.sz = sz;
    this.data = new Uint8Array(sx * sy * sz);
    this.dirty = true;
    this.solidCount = 0;

    this.colors = BLOCK_TYPES.map((t) => (t ? new THREE.Color(t.color) : null));

    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshLambertMaterial();
    this.capacity = sx * sy * sz;
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.capacity);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this._m4 = new THREE.Matrix4();
    this._c = new THREE.Color();
  }

  index(x, y, z) {
    return (y * this.sz + z) * this.sx + x;
  }

  inBounds(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz;
  }

  get(x, y, z) {
    if (!this.inBounds(x, y, z)) return AIR;
    return this.data[this.index(x, y, z)];
  }

  isSolid(x, y, z) {
    if (y < 0) return true;
    if (!this.inBounds(x, y, z)) return false;
    return this.data[this.index(x, y, z)] !== AIR;
  }

  set(x, y, z, type) {
    if (!this.inBounds(x, y, z)) return false;
    const i = this.index(x, y, z);
    const prev = this.data[i];
    if (prev === type) return false;
    this.data[i] = type;
    this.solidCount += type === AIR ? -1 : prev === AIR ? 1 : 0;
    this.dirty = true;
    return true;
  }

  clearAll() {
    this.data.fill(AIR);
    this.solidCount = 0;
    this.dirty = true;
  }

  rebuild() {
    const { mesh, data, sx, sy, sz } = this;
    const m4 = this._m4;
    const color = this._c;
    let n = 0;

    for (let y = 0; y < sy; y++) {
      for (let z = 0; z < sz; z++) {
        const row = (y * sz + z) * sx;
        for (let x = 0; x < sx; x++) {
          const type = data[row + x];
          if (type === AIR) continue;

          m4.makeTranslation(x + 0.5, y + 0.5, z + 0.5);
          mesh.setMatrixAt(n, m4);

          const base = this.colors[type] || this.colors[1];
          const jitter = 0.9 + hash3(x, y, z) * 0.18;
          color.copy(base).multiplyScalar(jitter);
          mesh.setColorAt(n, color);
          n++;
        }
      }
    }

    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.dirty = false;
  }

  update() {
    if (this.dirty) this.rebuild();
  }
}

export function fill(world, x0, y0, z0, x1, y1, z1, type) {
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        world.set(x, y, z, type);
      }
    }
  }
}

export function clear(world, x0, y0, z0, x1, y1, z1) {
  fill(world, x0, y0, z0, x1, y1, z1, AIR);
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildArena(world) {
  const rand = mulberry32(1337);
  const S = world.sx; // 64

  // Ground: stone with grass patches on the open lanes.
  fill(world, 0, 0, 0, S - 1, 0, S - 1, 1);
  for (let x = 0; x < S; x += 4) {
    for (let z = 0; z < S; z += 4) {
      if (rand() < 0.35) fill(world, x, 0, z, Math.min(x + 2, S - 1), 0, Math.min(z + 2, S - 1), 6);
    }
  }

  // Perimeter.
  fill(world, 0, 1, 0, S - 1, 5, 0, 5);
  fill(world, 0, 1, S - 1, S - 1, 5, S - 1, 5);
  fill(world, 0, 1, 0, 0, 5, S - 1, 5);
  fill(world, S - 1, 1, 0, S - 1, 5, S - 1, 5);

  // Mid wall with three doorways.
  const doorways = [[10, 13], [30, 33], [50, 53]];
  for (let x = 6; x <= 57; x++) {
    if (doorways.some(([a, b]) => x >= a && x <= b)) continue;
    fill(world, x, 1, 32, x, 4, 32, 5);
  }

  // Site A: small block building (site B mirrored).
  buildSite(world, 8, 8, 1);
  buildSite(world, 56, 56, -1);

  // Mid cover: stacked crates.
  fill(world, 26, 1, 27, 29, 2, 28, 2);
  fill(world, 35, 1, 27, 36, 1, 28, 2);

  // Sandbag line in front of each spawn approach.
  fill(world, 23, 1, 39, 31, 1, 39, 3);
  fill(world, 33, 1, 24, 41, 1, 24, 3);

  // Metal pillars: better cover, also breakable.
  for (const [px, pz] of [[20, 20], [43, 43], [20, 43], [43, 20]]) {
    fill(world, px, 1, pz, px, 4, pz, 4);
  }

  // Scattered crates in the open field (deterministic).
  let placed = 0;
  for (let i = 0; i < 40 && placed < 14; i++) {
    const x = 4 + Math.floor(rand() * 55);
    const z = 4 + Math.floor(rand() * 55);
    const w = 1 + Math.floor(rand() * 2);
    const h = 1 + Math.floor(rand() * 2);
    let free = true;
    for (let dz = 0; dz <= w && free; dz++) {
      for (let dx = 0; dx <= w && free; dx++) {
        if (world.isSolid(x + dx, 1, z + dz)) free = false;
      }
    }
    if (!free) continue;
    fill(world, x, 1, z, x + w, h, z + w, 2);
    placed++;
  }

  // Guarantee clear spawn areas.
  clear(world, 29, 1, 55, 35, 3, 61);
  world.dirty = true;
}

function buildSite(world, originX, originZ, dir) {
  const flipX = (dx) => originX + dx * dir;
  const flipZ = (dz) => originZ + dz * dir;

  // Back wall + side walls, height 3, with an open front.
  for (let d = 0; d <= 8; d++) {
    world.set(flipX(d), 1, flipZ(0), 5);
    world.set(flipX(d), 2, flipZ(0), 5);
    world.set(flipX(d), 3, flipZ(0), 5);
  }
  for (let d = 0; d <= 3; d++) {
    world.set(flipX(0), 1, flipZ(d), 5);
    world.set(flipX(0), 2, flipZ(d), 5);
    world.set(flipX(8), 1, flipZ(d), 5);
    world.set(flipX(8), 2, flipZ(d), 5);
  }

  // Roof.
  for (let dz = 0; dz <= 3; dz++) {
    for (let dx = 0; dx <= 8; dx++) {
      world.set(flipX(dx), 4, flipZ(dz), 4);
    }
  }

  // Crates inside.
  world.set(flipX(2), 1, flipZ(2), 2);
  world.set(flipX(3), 1, flipZ(2), 2);
  world.set(flipX(2), 2, flipZ(2), 2);
  world.set(flipX(6), 1, flipZ(1), 2);
  world.set(flipX(6), 2, flipZ(1), 2);
}

// Amanatides & Woo voxel traversal. Returns the first solid voxel + face normal.
export function raycastVoxels(world, origin, dir, maxDist = 100) {
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = Math.sign(dir.x);
  const stepY = Math.sign(dir.y);
  const stepZ = Math.sign(dir.z);

  const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;

  let tMaxX = stepX > 0 ? (x + 1 - origin.x) / dir.x : stepX < 0 ? (origin.x - x) / -dir.x : Infinity;
  let tMaxY = stepY > 0 ? (y + 1 - origin.y) / dir.y : stepY < 0 ? (origin.y - y) / -dir.y : Infinity;
  let tMaxZ = stepZ > 0 ? (z + 1 - origin.z) / dir.z : stepZ < 0 ? (origin.z - z) / -dir.z : Infinity;

  if (world.isSolid(x, y, z)) {
    return { t: 0, x, y, z, nx: 0, ny: 1, nz: 0, type: world.get(x, y, z) };
  }

  for (let i = 0; i < 1024; i++) {
    let t;
    let nx = 0;
    let ny = 0;
    let nz = 0;

    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX;
      t = tMaxX;
      tMaxX += tDeltaX;
      nx = -stepX;
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      t = tMaxY;
      tMaxY += tDeltaY;
      ny = -stepY;
    } else {
      z += stepZ;
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      nz = -stepZ;
    }

    if (t > maxDist) return null;
    if (world.isSolid(x, y, z)) {
      return { t, x, y, z, nx, ny, nz, type: world.get(x, y, z) };
    }
  }
  return null;
}

// Returns the AABB of a voxel, useful for placement collision checks.
export function voxelBox(x, y, z) {
  return {
    minX: x,
    minY: y,
    minZ: z,
    maxX: x + 1,
    maxY: y + 1,
    maxZ: z + 1,
  };
}

export { EPS };
