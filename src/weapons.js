/**
 * Weapon definitions for VOXEL STRIKE.
 * Every weapon lists which attachment slots it supports.
 */

export const WEAPON_DEFS = {
  rifle: {
    id: 'rifle',
    name: 'AK-47',
    class: 'Rifle',
    dmg: 30, headMult: 2.2, rpm: 600, magSize: 30, reloadTime: 2.1,
    spread: 0.0055, bloomPerShot: 0.0032, maxBloom: 0.05, recoil: 0.015, heavy: false,
    auto: true, range: 95, falloffStart: 22, falloffEnd: 70, minMult: 0.55, ammo: 30,
    pellets: 1,
    model: 'rifle',
    slots: ['optic', 'muzzle', 'underbarrel', 'magazine', 'laser'],
  },
  carbine: {
    id: 'carbine',
    name: 'M4A1',
    class: 'Carbine',
    dmg: 26, headMult: 2.1, rpm: 750, magSize: 30, reloadTime: 1.95,
    spread: 0.0042, bloomPerShot: 0.0026, maxBloom: 0.042, recoil: 0.0115, heavy: false,
    auto: true, range: 88, falloffStart: 24, falloffEnd: 68, minMult: 0.6, ammo: 30,
    pellets: 1,
    model: 'carbine',
    slots: ['optic', 'muzzle', 'underbarrel', 'magazine', 'laser'],
  },
  smg: {
    id: 'smg',
    name: 'MP5',
    class: 'SMG',
    dmg: 20, headMult: 1.9, rpm: 900, magSize: 30, reloadTime: 1.7,
    spread: 0.0072, bloomPerShot: 0.0028, maxBloom: 0.055, recoil: 0.009, heavy: false,
    auto: true, range: 60, falloffStart: 12, falloffEnd: 42, minMult: 0.42, ammo: 30,
    pellets: 1,
    model: 'smg',
    slots: ['optic', 'muzzle', 'magazine', 'laser'],
  },
  shotgun: {
    id: 'shotgun',
    name: 'SPAS-12',
    class: 'Shotgun',
    dmg: 13, headMult: 1.6, rpm: 90, magSize: 8, reloadTime: 2.8,
    spread: 0.045, bloomPerShot: 0.004, maxBloom: 0.06, recoil: 0.055, heavy: true,
    auto: false, range: 26, falloffStart: 5, falloffEnd: 22, minMult: 0.15, ammo: 8,
    pellets: 9,
    model: 'shotgun',
    slots: ['optic', 'underbarrel', 'laser'],
  },
  sniper: {
    id: 'sniper',
    name: 'AWP',
    class: 'Sniper',
    dmg: 118, headMult: 2.6, rpm: 42, magSize: 5, reloadTime: 3.1,
    spread: 0.0009, bloomPerShot: 0.02, maxBloom: 0.08, recoil: 0.075, heavy: true,
    auto: false, range: 190, falloffStart: 60, falloffEnd: 160, minMult: 0.85, ammo: 5,
    pellets: 1,
    model: 'sniper',
    slots: ['optic', 'muzzle', 'magazine', 'underbarrel'],
  },
  lmg: {
    id: 'lmg',
    name: 'M249',
    class: 'LMG',
    dmg: 31, headMult: 2.0, rpm: 700, magSize: 100, reloadTime: 4.4,
    spread: 0.0088, bloomPerShot: 0.0022, maxBloom: 0.05, recoil: 0.017, heavy: true,
    auto: true, range: 110, falloffStart: 26, falloffEnd: 80, minMult: 0.55, ammo: 100,
    pellets: 1,
    model: 'lmg',
    slots: ['optic', 'muzzle', 'underbarrel', 'laser'],
  },
  pistol: {
    id: 'pistol',
    name: 'DEAGLE',
    class: 'Pistol',
    dmg: 55, headMult: 2.6, rpm: 280, magSize: 7, reloadTime: 1.8,
    spread: 0.0032, bloomPerShot: 0.012, maxBloom: 0.06, recoil: 0.034, heavy: true,
    auto: false, range: 80, falloffStart: 18, falloffEnd: 55, minMult: 0.5, ammo: 7,
    pellets: 1,
    model: 'pistol',
    slots: ['optic', 'muzzle', 'magazine', 'laser'],
  },
};

export const WEAPON_ORDER = ['rifle', 'carbine', 'smg', 'shotgun', 'sniper', 'lmg', 'pistol'];

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
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (tmax < 0) return null;
  return tmin > 0 ? tmin : tmax;
}
