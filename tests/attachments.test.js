import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTACHMENTS,
  ATTACHMENT_SLOTS,
  AttachmentManager,
  DEFAULT_LOADOUT,
  SLOT_LABELS,
  defaultLoadoutFor,
  getAttachment,
  resolveWeaponStats,
} from '../src/attachments.js';
import { WEAPON_DEFS, WEAPON_ORDER } from '../src/weapons.js';

test('Attachment catalogue covers every slot with a default entry', () => {
  for (const slot of ATTACHMENT_SLOTS) {
    assert.ok(ATTACHMENTS[slot], `Missing slot ${slot}`);
    const ids = Object.keys(ATTACHMENTS[slot]);
    assert.ok(ids.length >= 3, `Slot ${slot} needs choices`);
    assert.ok(SLOT_LABELS[slot]);
    for (const id of ids) {
      const att = ATTACHMENTS[slot][id];
      assert.equal(att.id, id);
      assert.equal(typeof att.name, 'string');
      assert.equal(typeof att.desc, 'string');
    }
  }
  // Every loadout slot has a "neutral" default.
  assert.equal(DEFAULT_LOADOUT.optic, 'none');
  assert.equal(DEFAULT_LOADOUT.magazine, 'standard');
});

test('resolveWeaponStats applies multiplicative modifiers without mutating base defs', () => {
  const base = WEAPON_DEFS.rifle;
  const baseSpread = base.spread;
  const baseMag = base.magSize;

  const stats = resolveWeaponStats('rifle', {
    optic: 'acog',
    muzzle: 'compensator',
    underbarrel: 'vertical',
    magazine: 'extended',
    laser: 'laser',
  });

  assert.ok(stats.spread < baseSpread, 'Spread should tighten with optic/grip/laser');
  assert.ok(stats.recoil < base.recoil, 'Recoil should drop with compensator + grip');
  assert.ok(stats.magSize > baseMag, 'Extended mag should raise capacity');
  assert.ok(stats.reloadTime > base.reloadTime, 'Extended mag slows reload');
  assert.ok(stats.zoom > 1, 'ACOG must zoom in');
  assert.equal(stats.scoped, false, 'ACOG is not a black-out scope');
  assert.equal(stats.applied.length, 5, 'All five attachments applied');

  // Base definitions stay pristine
  assert.equal(WEAPON_DEFS.rifle.spread, baseSpread);
  assert.equal(WEAPON_DEFS.rifle.magSize, baseMag);
});

test('Sniper scope flags scoped rendering and extreme zoom', () => {
  const stats = resolveWeaponStats('sniper', { ...DEFAULT_LOADOUT, optic: 'scope' });
  assert.equal(stats.scoped, true);
  assert.ok(stats.zoom >= 4);
  assert.ok(stats.adsSpeedMult < 1, 'Scope should slow ADS');
});

test('Weapon slots are respected: shotgun cannot mount a magazine upgrade', () => {
  const mgr = new AttachmentManager(WEAPON_ORDER);
  assert.equal(mgr.isSlotAllowed('shotgun', 'magazine'), false);
  assert.equal(mgr.equip('shotgun', 'magazine', 'drum'), false);

  const loadout = mgr.getLoadout('shotgun');
  assert.equal(loadout.magazine, 'standard');

  // But it can take an optic and underbarrel
  assert.equal(mgr.equip('shotgun', 'optic', 'reddot'), true);
  assert.equal(mgr.equip('shotgun', 'underbarrel', 'vertical'), true);
});

test('AttachmentManager equips, cycles, rejects invalid input, and summarises', () => {
  const mgr = new AttachmentManager(WEAPON_ORDER);

  assert.equal(mgr.equip('rifle', 'optic', 'reddot'), true);
  assert.equal(mgr.getLoadout('rifle').optic, 'reddot');

  // Same attachment twice = no change
  assert.equal(mgr.equip('rifle', 'optic', 'reddot'), false);

  // Unknown ids are rejected
  assert.equal(mgr.equip('rifle', 'optic', 'plasma_cannon'), false);
  assert.equal(mgr.equip('nope', 'optic', 'reddot'), false);

  // Cycling wraps around
  const start = mgr.getLoadout('rifle').optic;
  const next = mgr.cycle('rifle', 'optic', 1);
  assert.notEqual(next, start);
  assert.equal(getAttachment('optic', next).id, next);

  const summary = mgr.summaryFor('rifle');
  assert.ok(summary.includes(getAttachment('optic', next).name));

  const stats = mgr.statsFor('rifle');
  assert.ok(stats.spread <= WEAPON_DEFS.rifle.spread);
});

test('defaultLoadoutFor strips unsupported slots for every weapon', () => {
  for (const id of WEAPON_ORDER) {
    const loadout = defaultLoadoutFor(id);
    for (const slot of ATTACHMENT_SLOTS) {
      if (!WEAPON_DEFS[id].slots.includes(slot)) {
        assert.equal(
          loadout[slot],
          slot === 'magazine' ? 'standard' : 'none',
          `${id}/${slot} should be neutral`
        );
      }
    }
  }
});

test('resolveWeaponStats returns null for unknown weapon', () => {
  assert.equal(resolveWeaponStats('railgun'), null);
});
