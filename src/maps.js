import * as THREE from 'three';
import { fill, clear, mulberry32, buildArena as buildDefaultCompound } from './voxelWorld.js';

// Block ID shortcuts:
// 1: Stone, 2: Crate, 3: Sand, 4: Metal, 5: Brick, 6: Grass,
// 7: Snow, 8: Ice, 9: Magma, 10: Basalt, 11: Water, 12: Wood, 13: Concrete, 14: Foliage

export const MAP_CONFIGS = {
  compound: {
    id: 'compound',
    name: 'Dust Compound',
    theme: 'Desert Military',
    description: 'Tactical desert compound with tight corridors, sniper angles, and balanced bomb sites.',
    skyColor: 0xa9c4dc,
    fogColor: 0xa9c4dc,
    fogNear: 60,
    fogFar: 145,
    sunColor: 0xfff8ec,
    sunIntensity: 2.0,
    hemiSky: 0xc3daf5,
    hemiGround: 0x6b6a63,
    playerSpawn: new THREE.Vector3(32.5, 1, 58.5),
    botSpawns: [
      new THREE.Vector3(13.5, 1, 22.5),
      new THREE.Vector3(50.5, 1, 41.5),
      new THREE.Vector3(38.5, 1, 20.5),
      new THREE.Vector3(18.5, 1, 14.5),
      new THREE.Vector3(45.5, 1, 51.5),
    ],
    blueBase: new THREE.Vector3(32.5, 1, 56.5),
    redBase: new THREE.Vector3(32.5, 1, 8.5),
    build(world) {
      buildDefaultCompound(world);
    },
  },

  winter: {
    id: 'winter',
    name: 'Frostbite Outpost',
    theme: 'Arctic Snow & Ice',
    description: 'Sub-zero frozen battlefield featuring a central slippery ice lake, log watchtowers, and pine cover.',
    skyColor: 0xd8e6f3,
    fogColor: 0xd8e6f3,
    fogNear: 45,
    fogFar: 130,
    sunColor: 0xf0f7ff,
    sunIntensity: 2.2,
    hemiSky: 0xd4e7fa,
    hemiGround: 0x8ea2b5,
    playerSpawn: new THREE.Vector3(32.5, 1, 58.5),
    botSpawns: [
      new THREE.Vector3(14.5, 1, 18.5),
      new THREE.Vector3(48.5, 1, 38.5),
      new THREE.Vector3(32.5, 1, 16.5),
      new THREE.Vector3(16.5, 1, 35.5),
      new THREE.Vector3(47.5, 1, 18.5),
    ],
    blueBase: new THREE.Vector3(32.5, 1, 56.5),
    redBase: new THREE.Vector3(32.5, 1, 10.5),
    build(world) {
      const rand = mulberry32(404);
      const S = world.sx;

      // Ground: Snow layer
      fill(world, 0, 0, 0, S - 1, 0, S - 1, 7);

      // Center frozen ice lake
      fill(world, 20, 0, 20, 43, 0, 43, 8);

      // Perimeter ice/snow fortress walls
      fill(world, 0, 1, 0, S - 1, 5, 0, 8);
      fill(world, 0, 1, S - 1, S - 1, 5, S - 1, 8);
      fill(world, 0, 1, 0, 0, 5, S - 1, 8);
      fill(world, S - 1, 1, 0, S - 1, 5, S - 1, 8);

      // Wooden Outpost Towers
      const towers = [[12, 12], [51, 12], [12, 51], [51, 51]];
      for (const [tx, tz] of towers) {
        // Legs & platform
        fill(world, tx, 1, tz, tx + 1, 4, tz + 1, 12);
        fill(world, tx - 1, 3, tz - 1, tx + 2, 3, tz + 2, 12);
        // Battlements
        fill(world, tx - 1, 4, tz - 1, tx + 2, 4, tz - 1, 7);
        fill(world, tx - 1, 4, tz + 2, tx + 2, 4, tz + 2, 7);
      }

      // Mid ice barricades & snow mounds
      fill(world, 24, 1, 28, 28, 2, 28, 8);
      fill(world, 35, 1, 35, 39, 2, 35, 8);
      fill(world, 20, 1, 40, 26, 2, 41, 7);
      fill(world, 38, 1, 22, 44, 2, 23, 7);

      // Pine Trees (Wood trunk + Foliage/Snow crown)
      for (let i = 0; i < 22; i++) {
        const px = 6 + Math.floor(rand() * 52);
        const pz = 6 + Math.floor(rand() * 52);
        if (px >= 18 && px <= 45 && pz >= 18 && pz <= 45) continue; // Keep lake clear
        fill(world, px, 1, pz, px, 3, pz, 12); // Trunk
        fill(world, px - 1, 3, pz - 1, px + 1, 3, pz + 1, 14); // Leaves
        fill(world, px, 4, pz, px, 4, pz, 7); // Snow tip
      }

      // Clear player & base zones
      clear(world, 28, 1, 54, 36, 4, 62);
      clear(world, 28, 1, 6, 36, 4, 14);
      world.dirty = true;
    },
  },

  lava: {
    id: 'lava',
    name: 'Inferno Chasm',
    theme: 'Volcanic Caldera',
    description: 'Hazardous volcanic chasm split by boiling magma streams, connected by narrow basalt and metal skybridges.',
    skyColor: 0x2e0f0b,
    fogColor: 0x3d140e,
    fogNear: 35,
    fogFar: 110,
    sunColor: 0xff4b1f,
    sunIntensity: 2.6,
    hemiSky: 0xff6633,
    hemiGround: 0x1a0a07,
    playerSpawn: new THREE.Vector3(32.5, 1, 58.5),
    botSpawns: [
      new THREE.Vector3(14.5, 1, 15.5),
      new THREE.Vector3(50.5, 1, 18.5),
      new THREE.Vector3(32.5, 1, 24.5),
      new THREE.Vector3(18.5, 1, 44.5),
      new THREE.Vector3(46.5, 1, 46.5),
    ],
    blueBase: new THREE.Vector3(32.5, 1, 56.5),
    redBase: new THREE.Vector3(32.5, 1, 8.5),
    build(world) {
      const rand = mulberry32(666);
      const S = world.sx;

      // Ground: Dark Basalt Rock
      fill(world, 0, 0, 0, S - 1, 0, S - 1, 10);

      // Magma River slicing diagonally across center (z: 28 to 35)
      fill(world, 0, 0, 29, S - 1, 0, 34, 9);

      // Perimeter Obsidian & Basalt crags
      fill(world, 0, 1, 0, S - 1, 6, 0, 10);
      fill(world, 0, 1, S - 1, S - 1, 6, S - 1, 10);
      fill(world, 0, 1, 0, 0, 6, S - 1, 10);
      fill(world, S - 1, 1, 0, S - 1, 6, S - 1, 10);

      // 3 Reinforced Metal Bridges crossing the magma river
      const bridges = [12, 31, 50];
      for (const bx of bridges) {
        fill(world, bx, 1, 28, bx + 3, 1, 35, 4); // Metal deck
        // Handrails
        fill(world, bx, 2, 28, bx, 2, 35, 4);
        fill(world, bx + 3, 2, 28, bx + 3, 2, 35, 4);
      }

      // Volcano Spire Pillars & Magma Fountains
      const spires = [[18, 16], [45, 16], [18, 48], [45, 48], [32, 18], [32, 45]];
      for (const [sx, sz] of spires) {
        fill(world, sx - 1, 1, sz - 1, sx + 1, 3, sz + 1, 10);
        fill(world, sx, 1, sz, sx, 4, sz, 9); // Glowing core
      }

      // Scorched Craters & Dark cover boulders
      for (let i = 0; i < 26; i++) {
        const cx = 5 + Math.floor(rand() * 54);
        const cz = 5 + Math.floor(rand() * 54);
        if (cz >= 27 && cz <= 36) continue; // Keep bridges clear
        fill(world, cx, 1, cz, cx + 1, 1 + Math.floor(rand() * 2), cz + 1, 10);
        if (rand() < 0.3) fill(world, cx, 1, cz, cx, 1, cz, 9);
      }

      // Clear bases
      clear(world, 28, 1, 54, 36, 4, 62);
      clear(world, 28, 1, 5, 36, 4, 13);
      world.dirty = true;
    },
  },

  beach: {
    id: 'beach',
    name: 'Coral Atoll',
    theme: 'Tropical Island',
    description: 'Sun-drenched tropical coastline with turquoise lagoons, palm trees, and wooden beachside bunkers.',
    skyColor: 0x6ac2eb,
    fogColor: 0x76cefa,
    fogNear: 65,
    fogFar: 155,
    sunColor: 0xfff3c4,
    sunIntensity: 2.1,
    hemiSky: 0x90e0ef,
    hemiGround: 0xdda15e,
    playerSpawn: new THREE.Vector3(32.5, 1, 58.5),
    botSpawns: [
      new THREE.Vector3(12.5, 1, 16.5),
      new THREE.Vector3(51.5, 1, 22.5),
      new THREE.Vector3(32.5, 1, 20.5),
      new THREE.Vector3(15.5, 1, 40.5),
      new THREE.Vector3(48.5, 1, 48.5),
    ],
    blueBase: new THREE.Vector3(32.5, 1, 56.5),
    redBase: new THREE.Vector3(32.5, 1, 9.5),
    build(world) {
      const rand = mulberry32(888);
      const S = world.sx;

      // Ground: Golden Sand
      fill(world, 0, 0, 0, S - 1, 0, S - 1, 3);

      // Water Lagoons
      fill(world, 0, 0, 0, 15, 0, 24, 11);
      fill(world, 48, 0, 39, S - 1, 0, S - 1, 11);
      fill(world, 22, 0, 28, 42, 0, 35, 11);

      // Sand Dune Perimeter Walls
      fill(world, 0, 1, 0, S - 1, 4, 0, 3);
      fill(world, 0, 1, S - 1, S - 1, 4, S - 1, 3);
      fill(world, 0, 1, 0, 0, 4, S - 1, 3);
      fill(world, S - 1, 1, 0, S - 1, 4, S - 1, 3);

      // Wooden Boardwalk Pier across central lagoon
      fill(world, 30, 1, 26, 34, 1, 37, 12);
      // Tiki Huts & Wooden Bunkers
      fill(world, 14, 1, 32, 19, 3, 37, 12);
      fill(world, 45, 1, 25, 50, 3, 30, 12);

      // Palm Trees (Wood Trunk + Foliage fronds)
      for (let i = 0; i < 28; i++) {
        const px = 6 + Math.floor(rand() * 52);
        const pz = 6 + Math.floor(rand() * 52);
        fill(world, px, 1, pz, px, 4, pz, 12); // Slender trunk
        fill(world, px - 1, 4, pz, px + 1, 4, pz, 14); // Cross fronds
        fill(world, px, 4, pz - 1, px, 4, pz + 1, 14);
      }

      // Crates on docks
      fill(world, 31, 2, 29, 32, 2, 30, 2);
      fill(world, 33, 2, 33, 34, 2, 34, 2);

      // Clear bases
      clear(world, 28, 1, 54, 36, 4, 62);
      clear(world, 28, 1, 6, 36, 4, 14);
      world.dirty = true;
    },
  },

  castle: {
    id: 'castle',
    name: 'Stonehold Keep',
    theme: 'Medieval Fortress',
    description: 'Grand stone castle with crenellated ramparts, four bastion keeps, cobblestone pathways, and archway gatehouses.',
    skyColor: 0x8a929b,
    fogColor: 0x858e98,
    fogNear: 50,
    fogFar: 135,
    sunColor: 0xffeedb,
    sunIntensity: 1.85,
    hemiSky: 0xbac3cf,
    hemiGround: 0x5a6068,
    playerSpawn: new THREE.Vector3(32.5, 1, 58.5),
    botSpawns: [
      new THREE.Vector3(12.5, 1, 14.5),
      new THREE.Vector3(51.5, 1, 14.5),
      new THREE.Vector3(32.5, 1, 22.5),
      new THREE.Vector3(18.5, 1, 36.5),
      new THREE.Vector3(45.5, 1, 36.5),
    ],
    blueBase: new THREE.Vector3(32.5, 1, 56.5),
    redBase: new THREE.Vector3(32.5, 1, 9.5),
    build(world) {
      const S = world.sx;

      // Ground: Cobblestone & courtyard flagstones
      fill(world, 0, 0, 0, S - 1, 0, S - 1, 1);

      // Castle Outer Curtains with battlements
      fill(world, 0, 1, 0, S - 1, 5, 0, 5);
      fill(world, 0, 1, S - 1, S - 1, 5, S - 1, 5);
      fill(world, 0, 1, 0, 0, 5, S - 1, 5);
      fill(world, S - 1, 1, 0, S - 1, 5, S - 1, 5);

      // Four Mighty Corner Bastion Keeps
      const keeps = [[4, 4], [52, 4], [4, 52], [52, 52]];
      for (const [kx, kz] of keeps) {
        fill(world, kx, 1, kz, kx + 7, 6, kz + 7, 1); // Thick walls
        fill(world, kx + 1, 1, kz + 1, kx + 6, 5, kz + 6, 0); // Hollow interior
        // Crenellations on top
        for (let ox = 0; ox <= 7; ox += 2) {
          world.set(kx + ox, 7, kz, 5);
          world.set(kx + ox, 7, kz + 7, 5);
        }
      }

      // Central Gatehouse Barrier across z: 32 with 2 archways
      fill(world, 10, 1, 31, 53, 4, 33, 1);
      // Carve 2 large arched gates
      clear(world, 20, 1, 31, 24, 3, 33);
      clear(world, 39, 1, 31, 43, 3, 33);

      // Courtyard barricades & wooden siege weapon crates
      fill(world, 29, 1, 24, 35, 2, 25, 12);
      fill(world, 29, 1, 39, 35, 2, 40, 12);
      fill(world, 16, 1, 20, 18, 2, 22, 2);
      fill(world, 45, 1, 42, 47, 2, 44, 2);

      // Clear bases
      clear(world, 28, 1, 54, 36, 4, 62);
      clear(world, 28, 1, 6, 36, 4, 14);
      world.dirty = true;
    },
  },

  modern_warfare: {
    id: 'modern_warfare',
    name: 'Urban Warzone',
    theme: 'Contemporary Warfare',
    description: 'Ravaged modern metropolitan crossroads with asphalt streets, reinforced concrete bunkers, and sniper office balconies.',
    skyColor: 0x677174,
    fogColor: 0x5e686b,
    fogNear: 40,
    fogFar: 125,
    sunColor: 0xe8ecf0,
    sunIntensity: 1.95,
    hemiSky: 0x8a999d,
    hemiGround: 0x3f4648,
    playerSpawn: new THREE.Vector3(32.5, 1, 58.5),
    botSpawns: [
      new THREE.Vector3(12.5, 1, 16.5),
      new THREE.Vector3(51.5, 1, 20.5),
      new THREE.Vector3(32.5, 1, 18.5),
      new THREE.Vector3(16.5, 1, 42.5),
      new THREE.Vector3(48.5, 1, 44.5),
    ],
    blueBase: new THREE.Vector3(32.5, 1, 56.5),
    redBase: new THREE.Vector3(32.5, 1, 8.5),
    build(world) {
      const S = world.sx;

      // Ground: Asphalt concrete roadway
      fill(world, 0, 0, 0, S - 1, 0, S - 1, 13);

      // Sidewalk concrete curbs
      fill(world, 0, 0, 0, 16, 0, S - 1, 1);
      fill(world, 47, 0, 0, S - 1, 0, S - 1, 1);

      // Perimeter city building facade
      fill(world, 0, 1, 0, S - 1, 6, 0, 13);
      fill(world, 0, 1, S - 1, S - 1, 6, S - 1, 13);
      fill(world, 0, 1, 0, 0, 6, S - 1, 13);
      fill(world, S - 1, 1, 0, S - 1, 6, S - 1, 13);

      // Office Building A (Left Wing, 2 Floors with sniper window)
      fill(world, 5, 1, 22, 17, 5, 38, 5);
      clear(world, 7, 1, 24, 15, 4, 36); // Interior room
      clear(world, 17, 2, 28, 17, 3, 32); // Sniper window

      // Office Building B (Right Wing, 2 Floors with sniper window)
      fill(world, 46, 1, 24, 58, 5, 40, 5);
      clear(world, 48, 1, 26, 56, 4, 38);
      clear(world, 46, 2, 30, 46, 3, 34);

      // Concrete Jersey Highway Barricades in crossroad
      fill(world, 24, 1, 30, 29, 1, 30, 13);
      fill(world, 34, 1, 34, 39, 1, 34, 13);

      // Military Sandbag Checkpoints
      fill(world, 25, 1, 44, 31, 1, 45, 3);
      fill(world, 33, 1, 20, 39, 1, 21, 3);

      // Metal Shipping Containers & APC Cover
      fill(world, 22, 1, 15, 25, 2, 22, 4);
      fill(world, 38, 1, 42, 41, 2, 49, 4);

      // Clear bases
      clear(world, 28, 1, 54, 36, 4, 62);
      clear(world, 28, 1, 5, 36, 4, 13);
      world.dirty = true;
    },
  },
};
