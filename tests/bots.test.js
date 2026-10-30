import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { VoxelWorld, raycastVoxels } from '../src/voxelWorld.js';
import { Bot, Tracers } from '../src/bots.js';
import { Player } from '../src/player.js';

test('Bot initializes with 100 HP, active state, and spawn point', () => {
  const scene = new THREE.Scene();
  const world = new VoxelWorld(16, 16, 16);
  const tracers = new Tracers(scene);
  const spawn = new THREE.Vector3(5, 1, 5);
  const palette = { body: 0x3f6d8a, head: 0xd8a067, legs: 0x2c3b46 };

  const bot = new Bot(scene, world, spawn, palette, tracers);
  assert.equal(bot.hp, 100);
  assert.equal(bot.alive, true);
  assert.equal(bot.pos.x, 5);
  assert.equal(bot.pos.y, 1);
  assert.equal(bot.pos.z, 5);
});

test('Bot takeDamage and elimination mechanics', () => {
  const scene = new THREE.Scene();
  const world = new VoxelWorld(16, 16, 16);
  const tracers = new Tracers(scene);
  const bot = new Bot(scene, world, new THREE.Vector3(5, 1, 5), { body: 0, head: 0, legs: 0 }, tracers);

  const killedFirst = bot.takeDamage(40);
  assert.equal(killedFirst, false);
  assert.equal(bot.hp, 60);
  assert.equal(bot.alive, true);

  const killedSecond = bot.takeDamage(60);
  assert.equal(killedSecond, true);
  assert.equal(bot.hp, 0);
  assert.equal(bot.alive, false);
  assert.equal(bot.group.visible, false);
  assert.ok(bot.respawnTimer > 0);
});

test('Bot respawn restores visibility, health, and spawn location', () => {
  const scene = new THREE.Scene();
  const world = new VoxelWorld(16, 16, 16);
  const tracers = new Tracers(scene);
  const spawn = new THREE.Vector3(8, 1, 8);
  const bot = new Bot(scene, world, spawn, { body: 0, head: 0, legs: 0 }, tracers);

  bot.takeDamage(100);
  assert.equal(bot.alive, false);

  bot.respawn();
  assert.equal(bot.alive, true);
  assert.equal(bot.hp, 100);
  assert.equal(bot.group.visible, true);
  assert.equal(bot.pos.x, 8);
  assert.equal(bot.pos.z, 8);
});

test('Bot line of sight is obstructed by destructible voxel walls', () => {
  const scene = new THREE.Scene();
  const world = new VoxelWorld(32, 16, 32);
  const tracers = new Tracers(scene);
  const bot = new Bot(scene, world, new THREE.Vector3(5, 1, 5), { body: 0, head: 0, legs: 0 }, tracers);

  const camera = new THREE.PerspectiveCamera();
  const player = new Player(world, camera);
  player.pos.set(5, 1, 15);

  const botEye = bot.eyePosition;
  const playerEye = player.eyePosition;
  const dir = playerEye.clone().sub(botEye).normalize();
  const dist = playerEye.distanceTo(botEye);

  // Clear line of sight in open field
  const clearHit = raycastVoxels(world, botEye, dir, dist - 0.2);
  assert.equal(clearHit, null, 'Clear path should have no obstacle hit');

  // Place a voxel cover wall between Bot and Player
  world.set(5, 1, 10, 1);
  world.set(5, 2, 10, 1);

  const obstructedHit = raycastVoxels(world, botEye, dir, dist - 0.2);
  assert.ok(obstructedHit !== null, 'Voxel wall must block line of sight');
  assert.equal(obstructedHit.x, 5);
  assert.equal(obstructedHit.z, 10);
});
