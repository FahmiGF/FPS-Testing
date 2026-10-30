import * as THREE from 'three';

const GRAVITY = 26;
const JUMP_SPEED = 8.1;
const STAND_HEIGHT = 1.8;
const CROUCH_HEIGHT = 1.2;
const HALF_WIDTH = 0.3;
const EPS = 1e-4;

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function overlaps(world, px, py, pz, half, height) {
  const x0 = Math.floor(px - half + EPS);
  const x1 = Math.floor(px + half - EPS);
  const y0 = Math.floor(py + EPS);
  const y1 = Math.floor(py + height - EPS);
  const z0 = Math.floor(pz - half + EPS);
  const z1 = Math.floor(pz + half - EPS);

  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        if (world.isSolid(x, y, z)) return true;
      }
    }
  }
  return false;
}

export class Player {
  constructor(world, camera) {
    this.world = world;
    this.camera = camera;

    this.pos = new THREE.Vector3(32.5, 1, 58.5);
    this.spawn = this.pos.clone();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;

    this.height = STAND_HEIGHT;
    this.eye = 1.62;
    this.crouching = false;
    this.onGround = false;
    this.walkPhase = 0;
    this.bobOffset = 0;

    this.hp = 100;
    this.alive = true;
    this.respawnTimer = 0;
    this.deaths = 0;

    this.recoilPitch = 0;
    this.recoilYaw = 0;
    this.shake = 0;
    this.landKick = 0;

    this.jumpQueued = false;
    this._fov = 70;
  }

  look(dx, dy, sensitivity) {
    if (!this.alive) return;
    this.yaw -= dx * sensitivity;
    this.pitch -= dy * sensitivity;
    const limit = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
  }

  addRecoil(pitchKick, yawKick) {
    this.recoilPitch += pitchKick;
    this.recoilYaw += (Math.random() - 0.5) * yawKick;
  }

  addShake(amount) {
    this.shake = Math.min(1.2, this.shake + amount);
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp -= amount;
    this.addShake(0.22);
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.deaths++;
      this.respawnTimer = 2.2;
      return true;
    }
    return false;
  }

  respawn() {
    this.pos.copy(this.spawn);
    this.vel.set(0, 0, 0);
    this.hp = 100;
    this.alive = true;
    this.yaw = 0;
    this.pitch = 0;
    this.recoilPitch = 0;
    this.recoilYaw = 0;
    this.height = STAND_HEIGHT;
    this.crouching = false;
  }

  canUncrouch() {
    return !overlaps(this.world, this.pos.x, this.pos.y, this.pos.z, HALF_WIDTH, STAND_HEIGHT);
  }

  update(dt, input) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      this.syncCamera(dt, false);
      return;
    }

    const wantCrouch = input.crouch;
    if (wantCrouch && !this.crouching) {
      this.crouching = true;
    } else if (!wantCrouch && this.crouching && this.canUncrouch()) {
      this.crouching = false;
    }
    const targetHeight = this.crouching ? CROUCH_HEIGHT : STAND_HEIGHT;
    this.height = damp(this.height, targetHeight, 18, dt);

    const speed = this.crouching ? 2.3 : input.sprint ? 7.2 : 5.0;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const wish = new THREE.Vector3();
    if (input.forward) wish.add(forward);
    if (input.back) wish.sub(forward);
    if (input.right) wish.add(right);
    if (input.left) wish.sub(right);
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);

    const accel = this.onGround ? 16 : 4.5;
    this.vel.x = damp(this.vel.x, wish.x, accel, dt);
    this.vel.z = damp(this.vel.z, wish.z, accel, dt);

    if (this.jumpQueued && this.onGround) {
      this.vel.y = JUMP_SPEED;
      this.onGround = false;
    }
    this.jumpQueued = false;

    this.vel.y -= GRAVITY * dt;
    if (this.vel.y < -60) this.vel.y = -60;

    // Axis-separated movement: revert the axis that collides, which gives wall sliding.
    const stepX = this.vel.x * dt;
    const stepZ = this.vel.z * dt;
    const stepY = this.vel.y * dt;

    this.pos.x += stepX;
    if (overlaps(this.world, this.pos.x, this.pos.y, this.pos.z, HALF_WIDTH, this.height)) {
      this.pos.x -= stepX;
      this.vel.x = 0;
    }

    this.pos.z += stepZ;
    if (overlaps(this.world, this.pos.x, this.pos.y, this.pos.z, HALF_WIDTH, this.height)) {
      this.pos.z -= stepZ;
      this.vel.z = 0;
    }

    const wasGrounded = this.onGround;
    const fallSpeed = this.vel.y;
    this.onGround = false;
    this.pos.y += stepY;
    if (overlaps(this.world, this.pos.x, this.pos.y, this.pos.z, HALF_WIDTH, this.height)) {
      this.pos.y -= stepY;
      if (this.vel.y <= 0) {
        this.onGround = true;
        if (!wasGrounded && fallSpeed < -8) this.landKick = Math.min(0.12, -fallSpeed * 0.008);
      }
      this.vel.y = 0;
    }

    // Walking bob + sprint FOV.
    const horizontalSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround && horizontalSpeed > 0.6) {
      this.walkPhase += dt * (7 + horizontalSpeed * 0.9);
      this.bobOffset = Math.sin(this.walkPhase) * Math.min(horizontalSpeed, 8) * 0.006;
    } else {
      this.bobOffset = damp(this.bobOffset, 0, 8, dt);
    }

    this.recoilPitch = damp(this.recoilPitch, 0, 7, dt);
    this.recoilYaw = damp(this.recoilYaw, 0, 7, dt);
    this.shake = damp(this.shake, 0, 9, dt);
    this.landKick = damp(this.landKick, 0, 10, dt);

    this.syncCamera(dt, true);
  }

  syncCamera(dt, shake) {
    const eyeHeight = this.crouching ? 1.02 : 1.62;
    this.eye = damp(this.eye, eyeHeight, 16, dt);

    const s = shake ? this.shake : 0;
    const sx = (Math.random() - 0.5) * s * 0.035;
    const sy = (Math.random() - 0.5) * s * 0.035;

    this.camera.position.set(this.pos.x, this.pos.y + this.eye + this.bobOffset - this.landKick, this.pos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw + this.recoilYaw + sx;
    this.camera.rotation.x = this.pitch + this.recoilPitch + sy;

    const targetFov = 70;
    if (Math.abs(this._fov - targetFov) > 0.01) {
      this._fov = damp(this._fov, targetFov, 10, dt);
      this.camera.fov = this._fov;
      this.camera.updateProjectionMatrix();
    }
  }

  get eyePosition() {
    return new THREE.Vector3(this.pos.x, this.pos.y + this.eye, this.pos.z);
  }

  collidesWithBox(minX, minY, minZ, maxX, maxY, maxZ) {
    return (
      this.pos.x + HALF_WIDTH > minX &&
      this.pos.x - HALF_WIDTH < maxX &&
      this.pos.y + this.height > minY &&
      this.pos.y < maxY &&
      this.pos.z + HALF_WIDTH > minZ &&
      this.pos.z - HALF_WIDTH < maxZ
    );
  }
}
