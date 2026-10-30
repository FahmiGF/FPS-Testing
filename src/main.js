import * as THREE from 'three';
import { VoxelWorld, buildArena, raycastVoxels, BLOCK_TYPES, PLACEABLE } from './voxelWorld.js';
import { Player } from './player.js';
import { Bot, Tracers } from './bots.js';
import { Particles, Sfx } from './effects.js';

/* ------------------------------------------------------------------ */
/* DOM                                                                 */
/* ------------------------------------------------------------------ */

const $ = (id) => document.getElementById(id);
const canvas = $('c');
const overlay = $('overlay');
const playButton = $('play');
const hitmarkerEl = $('hitmarker');
const vignetteEl = $('vignette');
const killfeedEl = $('killfeed');
const hpNumEl = $('hpnum');
const hpFillEl = $('hpfill');
const ammoEl = $('ammo');
const wnameEl = $('wname');
const reloadingEl = $('reloading');
const killsEl = $('kills');
const deathsEl = $('deaths');
const blockNameEl = $('blockname');
const fpsEl = $('fps');

const deadBanner = document.createElement('div');
deadBanner.style.cssText = `
  position:fixed; left:50%; top:42%; transform:translate(-50%,-50%);
  text-align:center; z-index:8; pointer-events:none; opacity:0; transition:opacity .15s;
  font-family:"Segoe UI",Roboto,sans-serif;`;
deadBanner.innerHTML = `
  <div style="font-size:38px;font-weight:800;letter-spacing:.22em;color:#ff5b48;text-shadow:0 4px 30px rgba(255,60,40,.45)">ELIMINATED</div>
  <div id="respawnText" style="margin-top:8px;font-size:12px;letter-spacing:.24em;color:#9aa7b4;text-transform:uppercase"></div>`;
document.body.appendChild(deadBanner);
const respawnTextEl = $('respawnText');

/* ------------------------------------------------------------------ */
/* Renderer / scene                                                    */
/* ------------------------------------------------------------------ */

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9c4dc);
scene.fog = new THREE.Fog(0xa9c4dc, 62, 150);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 240);
camera.rotation.order = 'YXZ';
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xc3daf5, 0x6b6a63, 1.15);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff8ec, 2.0);
sun.position.set(46, 62, 26);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -48;
sun.shadow.camera.right = 48;
sun.shadow.camera.top = 48;
sun.shadow.camera.bottom = -48;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 170;
sun.shadow.bias = -0.0009;
sun.shadow.normalBias = 0.035;
sun.shadow.camera.updateProjectionMatrix();
scene.add(sun);
scene.add(sun.target);
sun.target.position.set(32, 0, 32);

/* ------------------------------------------------------------------ */
/* World                                                               */
/* ------------------------------------------------------------------ */

const world = new VoxelWorld(64, 20, 64);
buildArena(world);
world.rebuild();
scene.add(world.mesh);

const player = new Player(world, camera);
player.syncCamera(0.016, false);

const tracers = new Tracers(scene);
const particles = new Particles(scene, 700);
const sfx = new Sfx();

const BOT_PALETTES = [
  { body: 0x3f6d8a, head: 0xd8a067, legs: 0x2c3b46 },
  { body: 0x8a5a3f, head: 0xd8a067, legs: 0x3a2b22 },
  { body: 0x5a6f3f, head: 0xd8a067, legs: 0x2f3a24 },
  { body: 0x7a3f5a, head: 0xd8a067, legs: 0x3a2430 },
  { body: 0x4a4a63, head: 0xd8a067, legs: 0x2b2b38 },
];

const botSpawns = [
  new THREE.Vector3(13.5, 1, 22.5),
  new THREE.Vector3(50.5, 1, 41.5),
  new THREE.Vector3(38.5, 1, 20.5),
  new THREE.Vector3(18.5, 1, 14.5),
  new THREE.Vector3(45.5, 1, 51.5),
];

const bots = botSpawns.map((spawn, i) => new Bot(scene, world, spawn, BOT_PALETTES[i], tracers));

/* ------------------------------------------------------------------ */
/* Viewmodel                                                           */
/* ------------------------------------------------------------------ */

function buildGun(compact) {
  const group = new THREE.Group();
  const dark = new THREE.MeshLambertMaterial({ color: 0x363d46 });
  const mid = new THREE.MeshLambertMaterial({ color: 0x5b6672 });
  const wood = new THREE.MeshLambertMaterial({ color: 0x8a6034 });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc9945f });

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.09, compact ? 0.26 : 0.4), dark);
  receiver.position.set(0, 0, compact ? -0.08 : -0.12);
  group.add(receiver);

  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, compact ? 0.16 : 0.5), mid);
  barrel.position.set(0, 0.018, compact ? -0.28 : -0.55);
  group.add(barrel);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.13, 0.058), dark);
  grip.position.set(0, -0.085, 0.04);
  grip.rotation.x = -0.3;
  group.add(grip);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.075), mid);
  mag.position.set(0, -0.115, -0.05);
  mag.rotation.x = 0.26;
  group.add(mag);

  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.07, 0.085), skin);
  hand.position.set(0.004, -0.075, 0.045);
  hand.rotation.x = -0.3;
  group.add(hand);

  const frontHand = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.062, 0.1), skin);
  frontHand.position.set(-0.005, -0.055, compact ? -0.2 : -0.34);
  group.add(frontHand);

  if (!compact) {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.052, 0.12), wood);
    stock.position.set(0, -0.004, 0.1);
    group.add(stock);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.026, 0.018), mid);
    sight.position.set(0, 0.058, -0.2);
    group.add(sight);
  }

  const flash = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  flash.position.set(0, 0.018, compact ? -0.38 : -0.82);
  flash.visible = false;
  group.add(flash);
  group.userData.flash = flash;

  return group;
}

const rifleGun = buildGun(false);
const pistolGun = buildGun(true);
rifleGun.position.set(0.19, -0.18, -0.5);
rifleGun.scale.setScalar(0.66);
pistolGun.position.set(0.18, -0.17, -0.44);
pistolGun.scale.setScalar(0.64);
camera.add(rifleGun, pistolGun);
pistolGun.visible = false;

const gunLight = new THREE.PointLight(0xfff3e0, 2.2, 2.2, 2);
gunLight.position.set(0.25, 0.05, 0.1);
camera.add(gunLight);

const muzzleLight = new THREE.PointLight(0xffc880, 0, 7, 2);
muzzleLight.position.set(0.2, -0.1, -0.7);
camera.add(muzzleLight);

/* ------------------------------------------------------------------ */
/* Weapons                                                             */
/* ------------------------------------------------------------------ */

const WEAPONS = {
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

let slot = 'rifle';
let bloom = 0;
let fireTimer = 0;
let reloadTimer = 0;
let placeTimer = 0;
let gunKick = 0;
let muzzleTimer = 0;
let blockIndex = 0;
let kills = 0;

const input = { forward: false, back: false, left: false, right: false, sprint: false, crouch: false };
let playing = false;
let firing = false;
let damageFlash = 0;
let hitTimer = 0;
let hitKill = false;

const basePositions = {
  rifle: rifleGun.position.clone(),
  pistol: pistolGun.position.clone(),
};

function currentWeapon() {
  return WEAPONS[slot];
}

function activeGun() {
  return slot === 'rifle' ? rifleGun : pistolGun;
}

function damageFalloff(weapon, distance) {
  if (distance <= weapon.falloffStart) return 1;
  if (distance >= weapon.falloffEnd) return weapon.minMult;
  const t = (distance - weapon.falloffStart) / (weapon.falloffEnd - weapon.falloffStart);
  return 1 - t * (1 - weapon.minMult);
}

function rayAABB(origin, dir, box) {
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

function showHitmarker(kill) {
  hitTimer = kill ? 0.17 : 0.09;
  hitKill = kill;
  hitmarkerEl.classList.toggle('kill', kill);
  hitmarkerEl.style.opacity = '1';
}

function addKillfeed(headshot) {
  const entry = document.createElement('div');
  entry.innerHTML = `YOU <b>âœ•</b> BOT${headshot ? ' <span style="color:#ff8a6b">HEADSHOT</span>' : ''}`;
  killfeedEl.appendChild(entry);
  setTimeout(() => entry.remove(), 3200);
  while (killfeedEl.children.length > 5) killfeedEl.firstChild.remove();
}

function breakBlock(hit) {
  if (hit.y <= 0) return;
  world.set(hit.x, hit.y, hit.z, 0);
}

function startReload() {
  const weapon = currentWeapon();
  if (reloadTimer > 0 || weapon.ammo >= weapon.magSize || !player.alive) return;
  reloadTimer = weapon.reloadTime;
  sfx.reload();
}

function fire() {
  const weapon = currentWeapon();
  if (!player.alive || reloadTimer > 0 || fireTimer > 0) return;
  if (weapon.ammo <= 0) {
    sfx.empty();
    fireTimer = 0.3;
    startReload();
    return;
  }

  weapon.ammo--;
  fireTimer = 60 / weapon.rpm;
  sfx.shot(weapon.heavy);

  const origin = player.eyePosition;
  const rotation = camera.rotation;
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation);
  const right = new THREE.Vector3(1, 0, 0).applyEuler(rotation);
  const up = new THREE.Vector3(0, 1, 0).applyEuler(rotation);

  const moveFactor = Math.min(0.022, Math.hypot(player.vel.x, player.vel.z) * 0.0024 + (player.onGround ? 0 : 0.014));
  const spread = weapon.spread + bloom + moveFactor;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.tan(spread) * Math.sqrt(Math.random());
  const dir = forward
    .clone()
    .addScaledVector(right, Math.cos(angle) * radius)
    .addScaledVector(up, Math.sin(angle) * radius)
    .normalize();

  let bestBot = null;
  for (const bot of bots) {
    if (!bot.alive) continue;
    const t = rayAABB(origin, dir, bot.hitbox);
    if (t !== null && t <= weapon.range && (!bestBot || t < bestBot.t)) bestBot = { t, bot };
  }

  const voxelHit = raycastVoxels(world, origin, dir, weapon.range);

  if (bestBot && (!voxelHit || bestBot.t < voxelHit.t)) {
    const point = origin.clone().addScaledVector(dir, bestBot.t);
    const headshot = point.y > bestBot.bot.pos.y + 1.5;
    const dmg = weapon.dmg * damageFalloff(weapon, bestBot.t) * (headshot ? weapon.headMult : 1);
    const killed = bestBot.bot.takeDamage(dmg);

    particles.burst(point, dir.clone().negate(), 0xc23a2c, 9, 3);
    showHitmarker(killed);
    sfx.hitmarker(killed);
    if (killed) {
      kills++;
      addKillfeed(headshot);
    }
  } else if (voxelHit) {
    const point = origin.clone().addScaledVector(dir, Math.max(0, voxelHit.t - 0.02));
    const normal = new THREE.Vector3(voxelHit.nx, voxelHit.ny, voxelHit.nz);
    const color = BLOCK_TYPES[voxelHit.type] ? BLOCK_TYPES[voxelHit.type].color : 0x9aa3ad;
    breakBlock(voxelHit);
    particles.burst(point, normal, color, 10, 2.8);
    sfx.blockBreak();
  }

  bloom = Math.min(weapon.maxBloom, bloom + weapon.bloomPerShot);
  player.addRecoil(weapon.recoil, weapon.recoil * 0.55);
  gunKick = 1;
  muzzleTimer = 0.05;
  const gun = activeGun();
  gun.userData.flash.rotation.z = Math.random() * Math.PI;
  gun.userData.flash.scale.setScalar(0.8 + Math.random() * 0.5);
  muzzleLight.intensity = weapon.heavy ? 9 : 6;
}

function placeBlock() {
  if (!player.alive || placeTimer > 0) return;
  placeTimer = 0.14;

  const origin = player.eyePosition;
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
  const hit = raycastVoxels(world, origin, dir, 7);
  if (!hit) return;

  const x = hit.x + hit.nx;
  const y = hit.y + hit.ny;
  const z = hit.z + hit.nz;

  if (!world.inBounds(x, y, z) || world.isSolid(x, y, z)) return;
  if (player.collidesWithBox(x, y, z, x + 1, y + 1, z + 1)) return;

  world.set(x, y, z, PLACEABLE[blockIndex]);
  sfx.place();
}

function switchWeapon(next) {
  if (next === slot) return;
  slot = next;
  reloadTimer = 0;
  bloom = 0;
  fireTimer = 0.25;
  rifleGun.visible = slot === 'rifle';
  pistolGun.visible = slot === 'pistol';
  wnameEl.textContent = currentWeapon().name;
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

document.addEventListener('contextmenu', (e) => e.preventDefault());

playButton.addEventListener('click', () => {
  sfx.init();
  canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  playing = locked;
  overlay.classList.toggle('hidden', locked);
  if (!locked) {
    firing = false;
    playButton.textContent = 'Resume';
    document.querySelector('.eyebrow').textContent = 'Paused';
    document.querySelector('.question').style.display = 'none';
    $('status').textContent = 'Progress is not saved â€” this is a prototype.';
  }
});

document.addEventListener('mousemove', (e) => {
  if (!playing) return;
  player.look(e.movementX, e.movementY, 0.0022);
});

document.addEventListener('mousedown', (e) => {
  if (!playing) return;
  if (e.button === 0) {
    firing = true;
    fire();
  } else if (e.button === 2) {
    placeBlock();
  }
});

document.addEventListener('mouseup', (e) => {
  if (e.button === 0) firing = false;
});

document.addEventListener('keydown', (e) => {
  if (!playing) return;
  switch (e.code) {
    case 'KeyW': input.forward = true; break;
    case 'KeyS': input.back = true; break;
    case 'KeyA': input.left = true; break;
    case 'KeyD': input.right = true; break;
    case 'ShiftLeft': case 'ShiftRight': input.sprint = true; break;
    case 'ControlLeft': case 'ControlRight': input.crouch = true; break;
    case 'Space':
      player.jumpQueued = true;
      e.preventDefault();
      break;
    case 'KeyR': startReload(); break;
    case 'Digit1': switchWeapon('rifle'); break;
    case 'Digit2': switchWeapon('pistol'); break;
    case 'KeyQ':
      blockIndex = (blockIndex + 1) % PLACEABLE.length;
      blockNameEl.textContent = BLOCK_TYPES[PLACEABLE[blockIndex]].name;
      break;
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': input.forward = false; break;
    case 'KeyS': input.back = false; break;
    case 'KeyA': input.left = false; break;
    case 'KeyD': input.right = false; break;
    case 'ShiftLeft': case 'ShiftRight': input.sprint = false; break;
    case 'ControlLeft': case 'ControlRight': input.crouch = false; break;
  }
});

window.addEventListener('blur', () => {
  input.forward = input.back = input.left = input.right = false;
  input.sprint = input.crouch = false;
  firing = false;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ------------------------------------------------------------------ */
/* HUD                                                                 */
/* ------------------------------------------------------------------ */

function updateHud(dt) {
  const weapon = currentWeapon();

  hpNumEl.textContent = Math.max(0, Math.ceil(player.hp));
  hpFillEl.style.width = `${Math.max(0, player.hp)}%`;
  hpFillEl.classList.toggle('low', player.hp <= 35);

  const ammo = Math.max(0, weapon.ammo);
  ammoEl.innerHTML = `${ammo}<small>/${weapon.magSize}</small>`;
  wnameEl.textContent = weapon.name;
  reloadingEl.textContent = reloadTimer > 0 ? 'RELOADING' : ammo === 0 ? 'PRESS R' : '';

  killsEl.textContent = kills;
  deathsEl.textContent = player.deaths;

  if (hitTimer > 0) {
    hitTimer -= dt;
    if (hitTimer <= 0) hitmarkerEl.style.opacity = '0';
  }

  damageFlash = Math.max(0, damageFlash - dt * 2.6);
  vignetteEl.style.opacity = damageFlash.toFixed(3);

  if (!player.alive) {
    deadBanner.style.opacity = '1';
    respawnTextEl.textContent = `Respawning in ${Math.max(0, player.respawnTimer).toFixed(1)}s`;
  } else {
    deadBanner.style.opacity = '0';
  }
}

let fpsFrames = 0;
let fpsStart = performance.now();

/* ------------------------------------------------------------------ */
/* Loop                                                                */
/* ------------------------------------------------------------------ */

let lastHp = player.hp;
let last = performance.now();

function simulate(dt) {
  fireTimer = Math.max(0, fireTimer - dt);
  placeTimer = Math.max(0, placeTimer - dt);

  if (reloadTimer > 0) {
    reloadTimer -= dt;
    if (reloadTimer <= 0) {
      reloadTimer = 0;
      currentWeapon().ammo = currentWeapon().magSize;
    }
  }

  player.update(dt, input);

  if (firing && currentWeapon().auto) fire();

  bloom = Math.max(0, bloom - dt * 0.06);
  if (!firing) bloom = Math.max(0, bloom - dt * 0.12);

  if (player.pos.y < -8) player.takeDamage(9999);

  for (const bot of bots) bot.update(dt, player);

  if (player.hp < lastHp) {
    damageFlash = Math.min(1, damageFlash + 0.55);
    sfx.hurt();
  }
  lastHp = player.hp;

  // viewmodel recoil + sway
  gunKick = Math.max(0, gunKick - dt * 9);
  const gun = activeGun();
  const base = basePositions[slot];
  const hitRecoil = gunKick * gunKick;
  gun.position.set(
    base.x - hitRecoil * 0.012,
    base.y + Math.sin(player.walkPhase) * 0.006 - hitRecoil * 0.01,
    base.z + hitRecoil * 0.075
  );
  gun.rotation.set(-hitRecoil * 0.16, 0.12, Math.sin(player.walkPhase * 0.5) * 0.01);

  if (muzzleTimer > 0) {
    muzzleTimer -= dt;
    const flash = gun.userData.flash;
    flash.visible = true;
    muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * 220);
    if (muzzleTimer <= 0) {
      flash.visible = false;
      muzzleLight.intensity = 0;
    }
  }

  tracers.update(dt);
  particles.update(dt);
  world.update();
}

renderer.setAnimationLoop(() => {
  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;

  if (playing) simulate(dt);

  updateHud(dt);

  fpsFrames++;
  const fpsElapsed = now - fpsStart;
  if (fpsElapsed >= 500) {
    fpsEl.textContent = `${Math.round((fpsFrames * 1000) / fpsElapsed)} FPS`;
    fpsFrames = 0;
    fpsStart = now;
  }

  renderer.render(scene, camera);
});

world.update();

// Debug hooks for automated smoke tests.
window.__vs = {
  player,
  world,
  bots,
  camera,
  input,
  fire,
  placeBlock,
  switchWeapon,
  setPlaying(value) {
    playing = value;
  },
  step(dt = 1 / 60, count = 1) {
    for (let i = 0; i < count; i++) simulate(dt);
  },
  get state() {
    return {
      playing,
      kills,
      hp: player.hp,
      alive: player.alive,
      ammo: currentWeapon().ammo,
      blocks: world.solidCount,
      bots: bots.map((b) => ({ hp: b.hp, alive: b.alive, x: b.pos.x, y: b.pos.y, z: b.pos.z })),
      cam: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    };
  },
};

