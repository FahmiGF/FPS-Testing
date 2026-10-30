import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { VoxelWorld } from '../src/voxelWorld.js';
import { Player } from '../src/player.js';

test('Player initializes with full health and default state', () => {
  const world = new VoxelWorld(16, 16, 16);
  const camera = new THREE.PerspectiveCamera();
  const player = new Player(world, camera);

  assert.equal(player.hp, 100);
  assert.equal(player.alive, true);
  assert.equal(player.deaths, 0);
  assert.equal(player.height, 1.8);
  assert.equal(player.eye, 1.62);
  assert.equal(player.crouching, false);
});

test('Player takeDamage reduces HP and applies camera shake', () => {
  const world = new VoxelWorld(16, 16, 16);
  const camera = new THREE.PerspectiveCamera();
  const player = new Player(world, camera);

  const died = player.takeDamage(35);
  assert.equal(died, false);
  assert.equal(player.hp, 65);
  assert.equal(player.alive, true);
  assert.ok(player.shake > 0, 'Camera shake should trigger on taking damage');
});

test('Player lethal damage triggers death and respawn countdown', () => {
  const world = new VoxelWorld(16, 16, 16);
  const camera = new THREE.PerspectiveCamera();
  const player = new Player(world, camera);

  const died = player.takeDamage(120);
  assert.equal(died, true);
  assert.equal(player.hp, 0);
  assert.equal(player.alive, false);
  assert.equal(player.deaths, 1);
  assert.ok(player.respawnTimer > 0, 'Respawn timer should be initiated');

  // Fast forward respawn timer
  player.update(2.5, { forward: 0, strafe: 0, sprint: false, crouch: false, jump: false });
  assert.equal(player.alive, true, 'Player should auto-respawn once timer elapses');
  assert.equal(player.hp, 100);
});

test('Player look clamps pitch to avoid screen flipping', () => {
  const world = new VoxelWorld(16, 16, 16);
  const camera = new THREE.PerspectiveCamera();
  const player = new Player(world, camera);

  // Large upward look
  player.look(0, -1000, 0.01);
  assert.ok(player.pitch <= Math.PI / 2);

  // Large downward look
  player.look(0, 1000, 0.01);
  assert.ok(player.pitch >= -Math.PI / 2);
});

test('Player movement and crouch physics update', () => {
  const world = new VoxelWorld(16, 16, 16);
  // Place floor under player
  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      world.set(x, 0, z, 1);
    }
  }
  const camera = new THREE.PerspectiveCamera();
  const player = new Player(world, camera);
  player.pos.set(8, 1, 8);

  const input = { forward: 1, strafe: 0, sprint: false, crouch: true, jump: false };
  player.update(0.1, input);

  assert.equal(player.crouching, true);
  assert.ok(player.height < 1.8, 'Height should lower when crouching');
  assert.ok(player.eye < 1.62, 'Eye position should lower when crouching');
});
