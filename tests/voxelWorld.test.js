import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { VoxelWorld, buildArena, raycastVoxels, AIR, BLOCK_TYPES } from '../src/voxelWorld.js';

test('VoxelWorld initialization and grid bounds', () => {
  const world = new VoxelWorld(32, 16, 32);
  assert.equal(world.sx, 32);
  assert.equal(world.sy, 16);
  assert.equal(world.sz, 32);
  assert.equal(world.solidCount, 0);
  assert.equal(world.isSolid(0, 0, 0), false);
  assert.equal(world.isSolid(0, -1, 0), true, 'Below Y=0 is always considered solid bottom barrier');
  assert.equal(world.isSolid(100, 5, 100), false, 'Out of bounds is not solid');
});

test('VoxelWorld set, get, and destructible cover mechanics', () => {
  const world = new VoxelWorld(16, 16, 16);

  // Place stone (type 1)
  const placed = world.set(5, 5, 5, 1);
  assert.equal(placed, true);
  assert.equal(world.get(5, 5, 5), 1);
  assert.equal(world.isSolid(5, 5, 5), true);
  assert.equal(world.solidCount, 1);
  assert.equal(world.dirty, true);

  // Destructible: Break stone (set to AIR)
  const destroyed = world.set(5, 5, 5, AIR);
  assert.equal(destroyed, true);
  assert.equal(world.get(5, 5, 5), AIR);
  assert.equal(world.isSolid(5, 5, 5), false);
  assert.equal(world.solidCount, 0);

  // Boundary check safety
  assert.equal(world.set(-1, 5, 5, 1), false);
  assert.equal(world.set(20, 5, 5, 1), false);
});

test('buildArena populates arena floors, walls, and cover', () => {
  const world = new VoxelWorld(64, 20, 64);
  buildArena(world);

  assert.ok(world.solidCount > 4000, `Expected solid voxels, got ${world.solidCount}`);
  assert.equal(world.isSolid(10, 0, 10), true, 'Floor should be solid');
  // Outer perimeter wall at x=0
  assert.equal(world.isSolid(0, 1, 10), true, 'Perimeter wall should be solid');
  // Spawn area at (32, 1, 58) must be clear
  assert.equal(world.isSolid(32, 1, 58), false, 'Spawn zone must be clear of obstacles');
});

test('raycastVoxels detects hit distance, voxel coordinates, and face normals', () => {
  const world = new VoxelWorld(16, 16, 16);
  world.set(5, 2, 5, 1); // Place target block

  const origin = new THREE.Vector3(5.5, 2.5, 1.5);
  const dir = new THREE.Vector3(0, 0, 1); // Shoot straight towards Z=5

  const hit = raycastVoxels(world, origin, dir, 20);
  assert.ok(hit !== null, 'Raycast should hit target block');
  assert.equal(hit.x, 5);
  assert.equal(hit.y, 2);
  assert.equal(hit.z, 5);
  assert.equal(hit.nz, -1, 'Hit normal should face incoming ray (-Z)');
});

test('raycastVoxels returns null when ray misses', () => {
  const world = new VoxelWorld(16, 16, 16);
  world.set(5, 2, 5, 1);

  const origin = new THREE.Vector3(1, 1, 1);
  const dir = new THREE.Vector3(0, 1, 0); // Straight up in empty space

  const hit = raycastVoxels(world, origin, dir, 10);
  assert.equal(hit, null, 'Raycast into open air must return null');
});
