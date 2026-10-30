import test from 'node:test';
import assert from 'node:assert/strict';

export const WEAPON_CONFIGS = {
  rifle: {
    name: 'AK-47', dmg: 30, headMult: 2.2, rpm: 600, magSize: 30, reloadTime: 2.1,
    spread: 0.0055, bloomPerShot: 0.0032, maxBloom: 0.05, recoil: 0.015, heavy: false,
    auto: true, range: 95, falloffStart: 22, falloffEnd: 70, minMult: 0.55, ammo: 30,
  },
  pistol: {
    name: 'DEAGLE', dmg: 55, headMult: 2.6, rpm: 280, magSize: 7, reloadTime: 1.8,
    spread: 0.0032, bloomPerShot: 0.012, maxBloom: 0.06, recoil: 0.034, heavy: true,
    auto: false, range: 80, falloffStart: 18, falloffEnd: 55, minMult: 0.5, ammo: 7,
  },
};

export function damageFalloff(weapon, distance) {
  if (distance <= weapon.falloffStart) return 1;
  if (distance >= weapon.falloffEnd) return weapon.minMult;
  const t = (distance - weapon.falloffStart) / (weapon.falloffEnd - weapon.falloffStart);
  return 1 - t * (1 - weapon.minMult);
}

export function rayAABB(origin, dir, box) {
  let tmin = 0;
  let tmax = Infinity;
  const axes = ['x', 'y', 'z'];
  for (const axis of axes) {
    const o = origin[axis];
    const d = dir[axis];
    const min = box['min' + axis.toUpperCase()];
    const max = box['max' + axis.toUpperCase()];
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return null;
      continue;
    }
    let t1 = (min - o) / d;
    let t2 = (max - o) / d;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (tmax < 0) return null;
  return tmin > 0 ? tmin : tmax;
}

test('Weapon configurations match design specs', () => {
  const { rifle, pistol } = WEAPON_CONFIGS;
  assert.equal(rifle.magSize, 30);
  assert.equal(rifle.dmg, 30);
  assert.equal(rifle.auto, true);

  assert.equal(pistol.magSize, 7);
  assert.equal(pistol.dmg, 55);
  assert.equal(pistol.auto, false);
});

test('Damage falloff calculates accurately across distances', () => {
  const rifle = WEAPON_CONFIGS.rifle;

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
