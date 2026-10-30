import * as THREE from 'three';

export class Particles {
  constructor(scene, max = 600) {
    this.max = max;
    this.parts = [];
    this.positions = new Float32Array(max * 3);
    this.colors = new Float32Array(max * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setDrawRange(0, 0);

    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.geometry = geometry;
  }

  burst(point, normal, colorHex, count = 8, power = 2.4) {
    const color = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      if (this.parts.length >= this.max) this.parts.shift();
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * power + normal.x * power * 0.6,
        Math.random() * power * 0.8 + normal.y * power * 0.6,
        (Math.random() - 0.5) * power + normal.z * power * 0.6
      );
      const life = 0.25 + Math.random() * 0.45;
      this.parts.push({ p: point.clone(), v, life, max: life, color: color.clone() });
    }
  }

  update(dt) {
    let n = 0;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const part = this.parts[i];
      part.life -= dt;
      if (part.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      part.v.y -= 9 * dt;
      part.p.addScaledVector(part.v, dt);
    }

    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      const fade = part.life / part.max;
      this.positions[n * 3] = part.p.x;
      this.positions[n * 3 + 1] = part.p.y;
      this.positions[n * 3 + 2] = part.p.z;
      this.colors[n * 3] = part.color.r * fade;
      this.colors[n * 3 + 1] = part.color.g * fade;
      this.colors[n * 3 + 2] = part.color.b * fade;
      n++;
    }

    this.geometry.setDrawRange(0, n);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}

export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.buffer = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.3;
    this.master.connect(this.ctx.destination);
  }

  noise() {
    if (this.buffer) return this.buffer;
    const rate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, rate, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.buffer = buffer;
    return buffer;
  }

  noiseHit(freq, endFreq, dur, gain, type = 'lowpass') {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise();

    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(70, endFreq), now + dur);
    filter.Q.value = 0.8;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  thump(freq, dur, gain) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  shot(heavy = false) {
    this.init();
    this.noiseHit(heavy ? 2600 : 3400, 260, heavy ? 0.16 : 0.11, heavy ? 0.55 : 0.4);
    this.thump(heavy ? 90 : 120, 0.09, heavy ? 0.5 : 0.32);
  }

  blockBreak() {
    this.init();
    this.noiseHit(1800, 220, 0.16, 0.32);
    this.thump(70, 0.1, 0.28);
  }

  place() {
    this.init();
    this.noiseHit(420, 180, 0.08, 0.22);
    this.thump(110, 0.07, 0.22);
  }

  hitmarker(kill = false) {
    this.init();
    if (kill) {
      this.noiseHit(1400, 600, 0.1, 0.4, 'bandpass');
      this.thump(180, 0.12, 0.3);
    } else {
      this.noiseHit(2200, 1600, 0.05, 0.25, 'bandpass');
    }
  }

  hurt() {
    this.init();
    this.noiseHit(600, 140, 0.2, 0.3);
  }

  empty() {
    this.init();
    this.noiseHit(900, 700, 0.04, 0.12, 'bandpass');
  }

  reload() {
    this.init();
    this.noiseHit(1200, 500, 0.06, 0.18, 'bandpass');
    setTimeout(() => this.noiseHit(700, 400, 0.05, 0.16, 'bandpass'), 180);
  }
}
