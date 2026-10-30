import test from 'node:test';
import assert from 'node:assert/strict';
import { VoxelWorld } from '../src/voxelWorld.js';
import { MAP_CONFIGS } from '../src/maps.js';

test('MAP_CONFIGS defines all required maps with full atmospheric & tactical parameters', () => {
  const expectedMaps = ['compound', 'winter', 'lava', 'beach', 'castle', 'modern_warfare'];
  for (const id of expectedMaps) {
    const map = MAP_CONFIGS[id];
    assert.ok(map, `Map ${id} should exist`);
    assert.equal(typeof map.name, 'string');
    assert.equal(typeof map.theme, 'string');
    assert.equal(typeof map.skyColor, 'number');
    assert.equal(typeof map.fogColor, 'number');
    assert.ok(map.sunIntensity > 0);
    assert.ok(map.playerSpawn !== undefined);
    assert.equal(map.botSpawns.length, 5);
    assert.ok(map.blueBase !== undefined);
    assert.ok(map.redBase !== undefined);
    assert.equal(typeof map.build, 'function');
  }
});

test('Every map builds successfully into VoxelWorld with clear spawn points', () => {
  const world = new VoxelWorld(64, 20, 64);

  for (const [id, map] of Object.entries(MAP_CONFIGS)) {
    world.clearAll();
    assert.equal(world.solidCount, 0);

    map.build(world);
    assert.ok(world.solidCount > 2000, `Map ${id} must populate arena geometry (got ${world.solidCount})`);

    // Verify player spawn position is clear of obstacles
    const px = Math.floor(map.playerSpawn.x);
    const py = Math.floor(map.playerSpawn.y);
    const pz = Math.floor(map.playerSpawn.z);
    assert.equal(
      world.isSolid(px, py, pz),
      false,
      `Player spawn at (${px}, ${py}, ${pz}) in map ${id} must not be obstructed`
    );
  }
});
