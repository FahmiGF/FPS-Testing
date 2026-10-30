import * as THREE from 'three';

export const EVENT_TYPES = {
  SUPPLY_DROP: 'SUPPLY_DROP',
  LOW_GRAVITY: 'LOW_GRAVITY',
  METEOR_STRIKE: 'METEOR_STRIKE',
  DOUBLE_DAMAGE: 'DOUBLE_DAMAGE',
  RAPID_FIRE: 'RAPID_FIRE',
};

export const EVENT_DEFS = {
  SUPPLY_DROP: {
    id: 'SUPPLY_DROP',
    title: '📦 SUPPLY DROP INBOUND!',
    desc: 'Medical & ammo supply crate dropped in the arena! Collect it for full health and ammo.',
    duration: 25,
  },
  LOW_GRAVITY: {
    id: 'LOW_GRAVITY',
    title: '🌙 LOW GRAVITY ENGAGED!',
    desc: 'Moon gravity enabled! Jump higher and glide across voxel cover.',
    duration: 18,
  },
  METEOR_STRIKE: {
    id: 'METEOR_STRIKE',
    title: '☄️ VOXEL METEOR SHOWER!',
    desc: 'Meteorites bombardment crashing down! Watch your cover crumble!',
    duration: 12,
  },
  DOUBLE_DAMAGE: {
    id: 'DOUBLE_DAMAGE',
    title: '⚡ DOUBLE DAMAGE ACTIVE!',
    desc: 'All weapons deal 200% lethal damage! Make every shot count.',
    duration: 15,
  },
  RAPID_FIRE: {
    id: 'RAPID_FIRE',
    title: '🔥 RAPID FIRE OVERDRIVE!',
    desc: 'Hyper-rate of fire with infinite ammunition magazine!',
    duration: 10,
  },
};

export class EventManager {
  constructor(world, scene, particles, sfx) {
    this.world = world;
    this.scene = scene;
    this.particles = particles;
    this.sfx = sfx;

    this.timer = 35; // First event after 35s
    this.interval = 45; // Every 45s thereafter
    this.activeEvent = null;
    this.durationRemaining = 0;

    // Supply crate entity
    this.supplyCrate = null;
    this.supplyPos = new THREE.Vector3();

    // Meteor state
    this.meteorQueue = [];
  }

  triggerRandomEvent() {
    const list = Object.keys(EVENT_DEFS);
    const id = list[Math.floor(Math.random() * list.length)];
    return this.startEvent(id);
  }

  startEvent(eventId) {
    const def = EVENT_DEFS[eventId];
    if (!def) return null;

    this.activeEvent = def;
    this.durationRemaining = def.duration;

    if (eventId === EVENT_TYPES.SUPPLY_DROP) {
      this.spawnSupplyDrop();
    } else if (eventId === EVENT_TYPES.METEOR_STRIKE) {
      this.spawnMeteors();
    }

    return def;
  }

  spawnSupplyDrop() {
    if (this.supplyCrate && this.scene) {
      this.scene.remove(this.supplyCrate);
    }

    const rx = 10 + Math.floor(Math.random() * 44);
    const rz = 10 + Math.floor(Math.random() * 44);
    this.supplyPos.set(rx + 0.5, 1.0, rz + 0.5);

    if (this.scene) {
      const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const mat = new THREE.MeshLambertMaterial({ color: 0x00e1d9, emissive: 0x004442 });
      this.supplyCrate = new THREE.Mesh(geo, mat);
      this.supplyCrate.position.copy(this.supplyPos);
      this.supplyCrate.castShadow = true;
      this.scene.add(this.supplyCrate);
    }
  }

  spawnMeteors() {
    this.meteorQueue = [];
    for (let i = 0; i < 6; i++) {
      this.meteorQueue.push({
        delay: i * 1.5,
        targetX: 8 + Math.floor(Math.random() * 48),
        targetZ: 8 + Math.floor(Math.random() * 48),
        hit: false,
      });
    }
  }

  update(dt, player, botsList) {
    const notifications = [];

    // Periodic event scheduler
    if (!this.activeEvent) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = this.interval;
        const ev = this.triggerRandomEvent();
        if (ev) notifications.push({ type: 'start', event: ev });
      }
    } else {
      this.durationRemaining -= dt;
      if (this.durationRemaining <= 0) {
        const ended = this.activeEvent;
        this.activeEvent = null;
        this.clearEventEffects();
        notifications.push({ type: 'end', event: ended });
      }
    }

    // Active event updates
    if (this.activeEvent) {
      if (this.activeEvent.id === EVENT_TYPES.SUPPLY_DROP && this.supplyCrate) {
        // Spin crate
        if (this.supplyCrate.rotation) {
          this.supplyCrate.rotation.y += dt * 1.8;
        }

        // Player pickup
        if (player.alive && player.pos.distanceTo(this.supplyPos) < 2.0) {
          player.hp = Math.min(100, player.hp + 50);
          if (this.scene) this.scene.remove(this.supplyCrate);
          this.supplyCrate = null;
          notifications.push({
            type: 'supply_collected',
            message: 'SUPPLY DROP COLLECTED! +50 HP & AMMO RESTOCKED!',
          });
        }
      }

      if (this.activeEvent.id === EVENT_TYPES.METEOR_STRIKE) {
        for (const m of this.meteorQueue) {
          if (!m.hit) {
            m.delay -= dt;
            if (m.delay <= 0) {
              m.hit = true;
              this.impactMeteor(m.targetX, m.targetZ);
              notifications.push({
                type: 'meteor_impact',
                message: `Meteor impacted near (${m.targetX}, ${m.targetZ})!`,
              });
            }
          }
        }
      }
    }

    return notifications;
  }

  impactMeteor(cx, cz) {
    if (!this.world) return;
    // Explode 3x3x3 blocks around impact
    for (let dy = 1; dy <= 3; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          this.world.set(cx + dx, dy, cz + dz, 0);
        }
      }
    }
    if (this.particles) {
      this.particles.burst(new THREE.Vector3(cx, 1.5, cz), new THREE.Vector3(0, 1, 0), 0xff4500, 24, 6.0);
    }
  }

  clearEventEffects() {
    if (this.supplyCrate && this.scene) {
      this.scene.remove(this.supplyCrate);
      this.supplyCrate = null;
    }
    this.meteorQueue = [];
  }

  isGravityReduced() {
    return Boolean(this.activeEvent && this.activeEvent.id === EVENT_TYPES.LOW_GRAVITY);
  }

  isDoubleDamage() {
    return Boolean(this.activeEvent && this.activeEvent.id === EVENT_TYPES.DOUBLE_DAMAGE);
  }

  isRapidFire() {
    return Boolean(this.activeEvent && this.activeEvent.id === EVENT_TYPES.RAPID_FIRE);
  }
}
