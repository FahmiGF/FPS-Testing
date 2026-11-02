import test from 'node:test';
import assert from 'node:assert/strict';
import { WEAPON_DEFS, WEAPON_ORDER, damageFalloff, rayAABB } from '../src/weapons.js';

export const WEAPON_CONFIGS = WEAPON_DEFS;

test('Weapon configurations match design specs', () => {
  const { rifle, pistol } = WEAPON_DEFS;
  assert.equal(rifle.magSize, 30);
  assert.equal(rifle.dmg, 30);
  assert.equal(rifle.auto, true);

  assert.equal(pistol.magSize, 7);
  assert.equal(pistol.dmg, 55);
  assert.equal(pistol.auto, false);
});

test('All weapons expose complete stats and sane values', () => {
  assert.ok(WEAPON_ORDER.length >= 7, 'Expected at least 7 weapons');
  for (const id of WEAPON_ORDER) {
    const w = WEAPON_DEFS[id];
    assert.ok(w, `Missing weapon ${id}`);
    assert.equal(w.id, id);
    assert.equal(typeof w.name, 'string');
    assert.ok(w.dmg > 0);
    assert.ok(w.rpm > 0);
    assert.ok(w.magSize > 0);
    assert.ok(w.reloadTime > 0);
    assert.ok(w.range > 0);
    assert.ok(Array.isArray(w.slots) && w.slots.length > 0);
    assert.ok(w.pellets >= 1);
    assert.notEqual(w.model, undefined);
  }
});

test('Shotgun fires multiple pellets, other guns a single bullet', () => {
  assert.ok(WEAPON_DEFS.shotgun.pellets > 1);
  assert.equal(WEAPON_DEFS.rifle.pellets, 1);
  assert.equal(WEAPON_DEFS.sniper.pellets, 1);
});

test('Damage falloff calculates accurately across distances', () => {
  const rifle = WEAPON_DEFS.rifle;

  // Point blank (distance <= 22) -> 100% damage
  assert.equal(damageFalloff(rifle, 10), 1);
  assert.equal(damageFalloff(rifle, 22), 1);

  // Beyond falloff end (>= 70) -> minMult (55%)
  assert.equal(damageFalloff(rifle, 70), rifle.minMult);
  assert.equal(damageFalloff(rifle, 100), rifle.minMult);

  // Mid-range interpolation
  const mid = damageFalloff(rifle, 46);
  assert.ok(mid > rifle.minMult && mid < 1.0);
});

test('rayAABB intersects bounding box correctly', () => {
  const box = {
    minX: 10, maxX: 12,
    minY: 0, maxY: 2,
    minZ: 10, maxZ: 12,
  };
  const origin = { x: 11, y: 1, z: 0 };
  const dir = { x: 0, y: 0, z: 1 };

  const hit = rayAABB(origin, dir, box);
  assert.ok(hit !== null);
  assert.equal(hit, 10, 'Distance to entry face should be 10');

  // Ray pointing in reverse misses
  const reverseDir = { x: 0, y: 0, z: -1 };
  assert.equal(rayAABB(origin, reverseDir, box), null);
});
