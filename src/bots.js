import * as THREE from 'three';
import { raycastVoxels } from './voxelWorld.js';

const BOT_HP = 100;
const RESPAWN_TIME = 4;

export class Tracers {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  spawn(from, to, color = 0xffd27a) {
    const geometry = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    this.scene.add(line);
    this.items.push({ line, life: 0.09, max: 0.09 });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.life -= dt;
      if (item.life <= 0) {
        this.scene.remove(item.line);
        item.line.geometry.dispose();
        item.line.material.dispose();
        this.items.splice(i, 1);
      } else {
        item.line.material.opacity = 0.85 * (item.life / item.max);
      }
    }
  }
}

export class Bot {
  constructor(scene, world, spawn, palette, tracers) {
    this.scene = scene;
    this.world = world;
    this.tracers = tracers;
    this.spawn = spawn.clone();
    this.palette = palette;

    this.pos = spawn.clone();
    this.hp = BOT_HP;
    this.alive = true;
    this.respawnTimer = 0;
    this.fireTimer = 0.8 + Math.random();
    this.strafe = Math.random() < 0.5 ? 1 : -1;
    this.strafePhase = Math.random() * Math.PI * 2;
    this.muzzleTimer = 0;

    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: palette.body });
    const headMat = new THREE.MeshLambertMaterial({ color: palette.head });
    const legMat = new THREE.MeshLambertMaterial({ color: palette.legs });
    this.materials = [bodyMat, headMat, legMat];

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.15, 0.42), bodyMat);
    body.position.y = 0.95;
    body.castShadow = true;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), headMat);
    head.position.y = 1.74;
    head.castShadow = true;

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, 0.26), legMat);
    legL.position.set(-0.17, 0.31, 0);
    legL.castShadow = true;

    const legR = legL.clone();
    legR.position.x = 0.17;

    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.7), headMat);
    gun.position.set(0.26, 1.2, 0.42);
    gun.castShadow = true;
    this.gun = gun;

    const muzzle = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.16, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xffd88a, transparent: true, opacity: 0 })
    );
    muzzle.position.set(0.26, 1.2, 0.8);
    this.muzzle = muzzle;

    this.group.add(body, head, legL, legR, gun, muzzle);
    this.group.position.copy(this.pos);
    scene.add(this.group);
  }

  get eyePosition() {
    return new THREE.Vector3(this.pos.x, this.pos.y + 1.68, this.pos.z);
  }

  get hitbox() {
    return {
      minX: this.pos.x - 0.34,
      maxX: this.pos.x + 0.34,
      minY: this.pos.y + 0.14,
      maxY: this.pos.y + 1.95,
      minZ: this.pos.z - 0.29,
      maxZ: this.pos.z + 0.29,
    };
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp -= amount;
    this.hitFlash = 0.12;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.respawnTimer = RESPAWN_TIME;
      this.group.visible = false;
      return true;
    }
    return false;
  }

  respawn() {
    this.pos.copy(this.spawn);
    this.hp = BOT_HP;
    this.alive = true;
    this.group.visible = true;
    this.group.position.copy(this.pos);
    this.fireTimer = 0.6 + Math.random();
  }

  blocked(x, z) {
    const h = 1.4;
    for (let dy = 0; dy < 2; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (this.world.isSolid(Math.floor(x + dx * 0.3), Math.floor(this.pos.y + 0.2 + dy * 0.7), Math.floor(z + dz * 0.3))) {
            return true;
          }
        }
      }
    }
    return false;
  }

  update(dt, player) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return;
    }

    const eye = this.eyePosition;
    const playerEye = player.eyePosition;
    const toPlayer = playerEye.clone().sub(eye);
    const dist = toPlayer.length();
    const dir = toPlayer.clone().normalize();

    let los = false;
    if (player.alive && dist < 45) {
      const hit = raycastVoxels(this.world, eye, dir, dist - 0.2);
      los = hit === null;
    }

    if (los) {
      this.group.lookAt(player.pos.x, this.group.position.y, player.pos.z);
      this.strafePhase += dt * 1.6;
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      const nextX = this.pos.x + perp.x * this.strafe * 1.5 * dt + Math.sin(this.strafePhase) * 0.004;
      const nextZ = this.pos.z + perp.z * this.strafe * 1.5 * dt;
      if (!this.blocked(nextX, this.pos.z)) this.pos.x = nextX;
      else this.strafe *= -1;
      if (!this.blocked(this.pos.x, nextZ)) this.pos.z = nextZ;
      else this.strafe *= -1;

      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && dist > 3) {
        this.fireTimer = 0.9 + Math.random() * 0.8;
        this.shoot(player, dist);
      }
    } else {
      this.fireTimer = Math.min(this.fireTimer, 0.9);
    }

    this.muzzleTimer = Math.max(0, this.muzzleTimer - dt);
    this.muzzle.material.opacity = this.muzzleTimer > 0 ? 0.9 : 0;

    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      this.group.position.x = this.pos.x + (Math.random() - 0.5) * 0.05;
    } else {
      this.group.position.x = this.pos.x;
    }
    this.group.position.z = this.pos.z;
    this.group.position.y = this.pos.y;
  }

  shoot(player, dist) {
    const from = this.eyePosition;
    const to = player.eyePosition;

    const hitChance = Math.max(0.22, 0.92 - dist * 0.014);
    const hit = Math.random() < hitChance;

    const target = to.clone();
    if (!hit) {
      target.x += (Math.random() - 0.5) * 1.4;
      target.y += (Math.random() - 0.5) * 0.9;
      target.z += (Math.random() - 0.5) * 1.4;
    }

    this.tracers.spawn(from, target, 0xffb861);
    this.muzzleTimer = 0.06;

    if (hit) {
      player.takeDamage(7 + Math.random() * 6);
    }
  }
}
