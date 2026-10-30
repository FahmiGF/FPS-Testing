import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { VoxelWorld, buildArena, raycastVoxels } from '../src/voxelWorld.js';
import { Player } from '../src/player.js';
import { Bot, Tracers } from '../src/bots.js';
import { WEAPON_CONFIGS, rayAABB, damageFalloff } from './weapons.test.js';

test('Full Headless Gameplay Simulation: movement, combat, voxel destruction & rebuild', () => {
  const scene = new THREE.Scene();
  const world = new VoxelWorld(64, 20, 64);
  buildArena(world);

  const camera = new THREE.PerspectiveCamera();
  const player = new Player(world, camera);
  const tracers = new Tracers(scene);

  const bots = [
    new Bot(scene, world, new THREE.Vector3(32.5, 1, 40.5), { body: 0x3f6d8a, head: 0xd8a067, legs: 0x2c3b46 }, tracers),
    new Bot(scene, world, new THREE.Vector3(20.5, 1, 20.5), { body: 0x8a5a3f, head: 0xd8a067, legs: 0x3a2b22 }, tracers),
  ];

  // 1. Simulation loop: 60 frames of player movement
  const dt = 1 / 60;
  for (let frame = 0; frame < 60; frame++) {
    player.update(dt, { forward: 1, strafe: 0, sprint: false, crouch: false, jump: false });
    for (const bot of bots) bot.update(dt, player);
    tracers.update(dt);
  }

  assert.ok(player.pos.z < 58.5, 'Player moved forward along -Z axis');
  assert.equal(player.alive, true);

  // 2. Destructible Cover: Shoot block
  // Place a 2-block high cover in front of player
  const blockX = Math.floor(player.pos.x);
  const blockZ = Math.floor(player.pos.z) - 3;
  world.set(blockX, 1, blockZ, 2); // Crate base
  world.set(blockX, 2, blockZ, 2); // Crate top
  assert.equal(world.isSolid(blockX, 2, blockZ), true);

  // Fire hitscan horizontally at eye level (y ~ 2.62) into top block
  const origin = player.eyePosition;
  const dir = new THREE.Vector3(0, 0, -1);
  const hit = raycastVoxels(world, origin, dir, 10);
  assert.ok(hit !== null, 'Hitscan should strike placed block');
  assert.equal(hit.x, blockX);
  assert.equal(hit.y, 2);
  assert.equal(hit.z, blockZ);

  // Break block
  world.set(hit.x, hit.y, hit.z, 0);
  assert.equal(world.isSolid(blockX, 2, blockZ), false, 'Voxel cover destroyed by weapon shot');

  // 3. Build Cover: Place block back
  world.set(blockX, 2, blockZ, 1); // Rebuild with stone
  assert.equal(world.isSolid(blockX, 2, blockZ), true, 'Voxel cover rebuilt');

  // 4. Combat: Shoot bot
  const targetBot = bots[0];
  const weapon = WEAPON_CONFIGS.rifle;
  const dist = player.eyePosition.distanceTo(targetBot.eyePosition);
  const dmg = Math.round(weapon.dmg * damageFalloff(weapon, dist));

  const killed = targetBot.takeDamage(dmg);
  assert.equal(killed, false);
  assert.equal(targetBot.hp, 100 - dmg);

  // Eliminate bot with fatal headshot
  const headshotDmg = Math.round(weapon.dmg * weapon.headMult);
  const fatalKill = targetBot.takeDamage(headshotDmg * 2);
  assert.equal(fatalKill, true);
  assert.equal(targetBot.alive, false);
  assert.equal(targetBot.hp, 0);
});
