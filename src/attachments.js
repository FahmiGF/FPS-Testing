import { WEAPON_DEFS } from './weapons.js';

/**
 * Attachment system.
 *
 * Each attachment contributes multiplicative modifiers. A loadout stores one
 * attachment id per slot. `resolveWeaponStats` folds the loadout into a copy of
 * the base weapon stats so the rest of the game only reads final numbers.
 */

export const ATTACHMENT_SLOTS = ['optic', 'muzzle', 'underbarrel', 'magazine', 'laser'];

export const SLOT_LABELS = {
  optic: 'Optic',
  muzzle: 'Muzzle',
  underbarrel: 'Underbarrel',
  magazine: 'Magazine',
  laser: 'Laser',
};

export const ATTACHMENTS = {
  optic: {
    none: {
      id: 'none', name: 'Iron Sights', zoom: 1.0, spreadMult: 1.0, adsSpeedMult: 1.0,
      desc: 'Default iron sights. Fast target acquisition.',
    },
    reddot: {
      id: 'reddot', name: 'Red Dot', zoom: 1.25, spreadMult: 0.9, adsSpeedMult: 1.0,
      desc: 'Clean red dot reticle. -10% spread while aiming.',
    },
    holo: {
      id: 'holo', name: 'Holo Sight', zoom: 1.45, spreadMult: 0.85, adsSpeedMult: 0.95,
      desc: 'Holographic reticle for mid-range duels. -15% spread.',
    },
    acog: {
      id: 'acog', name: 'ACOG 2.5x', zoom: 2.5, spreadMult: 0.8, adsSpeedMult: 0.85,
      desc: 'Magnified optic for long lanes. -20% spread, slower ADS.',
    },
    scope: {
      id: 'scope', name: 'Sniper Scope 5x', zoom: 5.0, spreadMult: 0.7, adsSpeedMult: 0.7,
      scoped: true,
      desc: 'Full black-out sniper scope. Massive zoom, slow to raise.',
    },
  },
  muzzle: {
    none: { id: 'none', name: 'None', spreadMult: 1.0, recoilMult: 1.0, noiseMult: 1.0, desc: 'Bare muzzle.' },
    suppressor: {
      id: 'suppressor', name: 'Suppressor', spreadMult: 0.92, recoilMult: 0.9, noiseMult: 0.25,
      desc: 'Hides muzzle flash and quietens shots. -8% spread, -10% recoil.',
    },
    compensator: {
      id: 'compensator', name: 'Compensator', spreadMult: 1.04, recoilMult: 0.75, noiseMult: 1.1,
      desc: 'Vents gas sideways. -25% vertical recoil, slightly wider cone.',
    },
    brake: {
      id: 'brake', name: 'Muzzle Brake', spreadMult: 1.08, recoilMult: 0.66, noiseMult: 1.25,
      desc: 'Best recoil control, loudest report.',
    },
  },
  underbarrel: {
    none: { id: 'none', name: 'None', spreadMult: 1.0, recoilMult: 1.0, adsSpeedMult: 1.0, desc: 'Bare handguard.' },
    vertical: {
      id: 'vertical', name: 'Vertical Grip', spreadMult: 0.97, recoilMult: 0.82, adsSpeedMult: 1.0,
      desc: 'Pulls the muzzle down. -18% recoil.',
    },
    angled: {
      id: 'angled', name: 'Angled Grip', spreadMult: 0.86, recoilMult: 0.95, adsSpeedMult: 1.1,
      desc: 'Faster target transitions. -14% spread, quicker ADS.',
    },
    bipod: {
      id: 'bipod', name: 'Bipod', spreadMult: 0.95, recoilMult: 0.66, adsSpeedMult: 0.8,
      desc: 'Heavy recoil taming, sluggish handling.',
    },
  },
  magazine: {
    standard: { id: 'standard', name: 'Standard Mag', magMult: 1.0, reloadMult: 1.0, desc: 'Factory magazine.' },
    extended: {
      id: 'extended', name: 'Extended Mag', magMult: 1.5, reloadMult: 1.18,
      desc: '+50% capacity, slightly slower reload.',
    },
    drum: {
      id: 'drum', name: 'Drum Mag', magMult: 2.2, reloadMult: 1.45,
      desc: '+120% capacity, much slower reload.',
    },
  },
  laser: {
    none: { id: 'none', name: 'None', spreadMult: 1.0, desc: 'No laser module.' },
    laser: {
      id: 'laser', name: 'Laser Sight', spreadMult: 0.82,
      desc: 'Visible beam, -18% hip-fire spread.',
    },
    ir: {
      id: 'ir', name: 'IR Laser', spreadMult: 0.88,
      desc: 'Low-profile infrared laser, -12% spread.',
    },
  },
};

export const DEFAULT_LOADOUT = {
  optic: 'none',
  muzzle: 'none',
  underbarrel: 'none',
  magazine: 'standard',
  laser: 'none',
};

export function defaultLoadoutFor(weaponId) {
  const weapon = WEAPON_DEFS[weaponId];
  const loadout = { ...DEFAULT_LOADOUT };
  if (!weapon) return loadout;
  // Slots the weapon does not support are forced to their "none"/"standard" entry.
  for (const slot of ATTACHMENT_SLOTS) {
    if (!weapon.slots.includes(slot)) {
      loadout[slot] = slot === 'magazine' ? 'standard' : 'none';
    }
  }
  return loadout;
}

export function getAttachment(slot, id) {
  const group = ATTACHMENTS[slot];
  if (!group) return null;
  return group[id] || null;
}

/**
 * Fold a loadout into weapon stats. Returns a NEW object; never mutates defs.
 */
export function resolveWeaponStats(weaponId, loadout = DEFAULT_LOADOUT) {
  const base = WEAPON_DEFS[weaponId];
  if (!base) return null;

  let spreadMult = 1;
  let recoilMult = 1;
  let magMult = 1;
  let reloadMult = 1;
  let zoom = 1;
  let adsSpeedMult = 1;
  let noiseMult = 1;
  let scoped = false;
  const applied = [];

  for (const slot of ATTACHMENT_SLOTS) {
    if (!base.slots.includes(slot)) continue;
    const att = getAttachment(slot, loadout[slot]);
    if (!att || att.id === 'none' || (slot === 'magazine' && att.id === 'standard')) continue;

    spreadMult *= att.spreadMult ?? 1;
    recoilMult *= att.recoilMult ?? 1;
    magMult *= att.magMult ?? 1;
    reloadMult *= att.reloadMult ?? 1;
    adsSpeedMult *= att.adsSpeedMult ?? 1;
    noiseMult *= att.noiseMult ?? 1;
    zoom *= att.zoom ?? 1;
    if (att.scoped) scoped = true;
    applied.push({ slot, ...att });
  }

  return {
    ...base,
    magSize: Math.max(1, Math.round(base.magSize * magMult)),
    reloadTime: +(base.reloadTime * reloadMult).toFixed(3),
    spread: base.spread * spreadMult,
    recoil: base.recoil * recoilMult,
    bloomPerShot: base.bloomPerShot * (recoilMult * 0.5 + 0.5),
    zoom,
    scoped,
    adsSpeedMult,
    noiseMult,
    applied,
    loadout: { ...loadout },
  };
}

/**
 * Holds the per-weapon loadout and validates slot/attachment combinations.
 */
export class AttachmentManager {
  constructor(weaponIds) {
    this.loadouts = {};
    for (const id of weaponIds) this.loadouts[id] = defaultLoadoutFor(id);
    this.version = 0;
  }

  getLoadout(weaponId) {
    return { ...(this.loadouts[weaponId] || DEFAULT_LOADOUT) };
  }

  isSlotAllowed(weaponId, slot) {
    const weapon = WEAPON_DEFS[weaponId];
    return Boolean(weapon && weapon.slots.includes(slot));
  }

  equip(weaponId, slot, attachmentId) {
    if (!this.loadouts[weaponId]) return false;
    if (!this.isSlotAllowed(weaponId, slot)) return false;
    const att = getAttachment(slot, attachmentId);
    if (!att) return false;
    if (this.loadouts[weaponId][slot] === attachmentId) return false;

    this.loadouts[weaponId][slot] = attachmentId;
    this.version++;
    return true;
  }

  cycle(weaponId, slot, direction = 1) {
    if (!this.isSlotAllowed(weaponId, slot)) return null;
    const ids = Object.keys(ATTACHMENTS[slot]);
    const current = this.loadouts[weaponId][slot];
    const index = Math.max(0, ids.indexOf(current));
    const next = (index + direction + ids.length) % ids.length;
    this.loadouts[weaponId][slot] = ids[next];
    this.version++;
    return ids[next];
  }

  statsFor(weaponId) {
    return resolveWeaponStats(weaponId, this.loadouts[weaponId]);
  }

  summaryFor(weaponId) {
    const loadout = this.getLoadout(weaponId);
    const weapon = WEAPON_DEFS[weaponId];
    if (!weapon) return '';
    return weapon.slots
      .map((slot) => getAttachment(slot, loadout[slot]))
      .filter((att) => att && att.id !== 'none' && att.id !== 'standard')
      .map((att) => att.name)
      .join(' · ');
  }
}
