import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { VoxelWorld } from '../src/voxelWorld.js';
import { EventManager, EVENT_TYPES } from '../src/events.js';

test('EventManager triggers event and tracks duration', () => {
  const world = new VoxelWorld(16, 16, 16);
  const mgr = new EventManager(world, null, null, null);

  const event = mgr.startEvent(EVENT_TYPES.DOUBLE_DAMAGE);
  assert.equal(event.id, EVENT_TYPES.DOUBLE_DAMAGE);
  assert.equal(mgr.isDoubleDamage(), true);
  assert.equal(mgr.durationRemaining, 15);

  // Advance time past duration
  const mockPlayer = { alive: true, pos: new THREE.Vector3(), hp: 100 };
  const notifications = mgr.update(16, mockPlayer, []);

  assert.equal(mgr.activeEvent, null);
  assert.equal(mgr.isDoubleDamage(), false);
  assert.equal(notifications.some((n) => n.type === 'end'), true);
});

test('Supply Drop gives health to damaged player', () => {
  const world = new VoxelWorld(16, 16, 16);
  const mgr = new EventManager(world, null, null, null);

  mgr.startEvent(EVENT_TYPES.SUPPLY_DROP);
  assert.ok(mgr.supplyPos !== null);

  const mockPlayer = {
    alive: true,
    pos: mgr.supplyPos.clone(),
    hp: 40,
  };

  mgr.supplyCrate = {}; // Mock active crate
  const notes = mgr.update(0.1, mockPlayer, []);

  assert.equal(mockPlayer.hp, 90, 'HP should increase by 50');
  assert.equal(notes.some((n) => n.type === 'supply_collected'), true);
});

test('Meteor strike destroys voxel blocks in radius', () => {
  const world = new VoxelWorld(16, 16, 16);
  // Fill target area
  for (let y = 1; y <= 3; y++) {
    world.set(5, y, 5, 1);
  }
  assert.equal(world.isSolid(5, 2, 5), true);

  const mgr = new EventManager(world, null, null, null);
  mgr.impactMeteor(5, 5);

  assert.equal(world.isSolid(5, 2, 5), false, 'Voxel at impact must be destroyed');
});
