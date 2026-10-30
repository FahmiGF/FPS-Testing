import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { VoxelWorld } from '../src/voxelWorld.js';
import { Bot, BOT_LEVELS, Tracers } from '../src/bots.js';

test('Bot Level scaling and attributes', () => {
  const scene = new THREE.Scene();
  const world = new VoxelWorld(16, 16, 16);
  const tracers = new Tracers(scene);

  const recruit = new Bot(scene, world, new THREE.Vector3(2, 1, 2), { body: 0, head: 0, legs: 0 }, tracers, 1);
  const nightmare = new Bot(scene, world, new THREE.Vector3(4, 1, 4), { body: 0, head: 0, legs: 0 }, tracers, 4);

  assert.equal(recruit.level, 1);
  assert.equal(recruit.hp, 80);
  assert.equal(recruit.levelConfig.name, 'Recruit');

  assert.equal(nightmare.level, 4);
  assert.equal(nightmare.hp, 220);
  assert.equal(nightmare.levelConfig.name, 'Nightmare');
  assert.ok(nightmare.levelConfig.accuracy > recruit.levelConfig.accuracy);
  assert.ok(nightmare.levelConfig.strafeSpeed > recruit.levelConfig.strafeSpeed);
});

test('Bot setLevel dynamically adjusts stats and health pool', () => {
  const scene = new THREE.Scene();
  const world = new VoxelWorld(16, 16, 16);
  const tracers = new Tracers(scene);
  const bot = new Bot(scene, world, new THREE.Vector3(0, 1, 0), { body: 0, head: 0, legs: 0 }, tracers, 2);

  assert.equal(bot.hp, 100);

  bot.setLevel(3); // Promote to Elite
  assert.equal(bot.level, 3);
  assert.equal(bot.hp, 135);
  assert.equal(bot.maxHp, 135);
});
