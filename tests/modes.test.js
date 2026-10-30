import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GameModeManager, MODES } from '../src/gameModes.js';

test('GameModeManager initializes default Deathmatch config', () => {
  const mgr = new GameModeManager(MODES.DEATHMATCH);
  assert.equal(mgr.mode, 'deathmatch');
  assert.equal(mgr.config.killTarget, 20);
  assert.equal(mgr.playerScore, 0);
  assert.equal(mgr.enemyScore, 0);
  assert.equal(mgr.matchOver, false);
});

test('Deathmatch mode scores kills and awards victory at target', () => {
  const mgr = new GameModeManager(MODES.DEATHMATCH);
  const mockBot = { alive: false };

  for (let i = 0; i < 19; i++) {
    mgr.onBotKilled(mockBot, []);
    assert.equal(mgr.matchOver, false);
  }

  // 20th kill hits target
  mgr.onBotKilled(mockBot, []);
  assert.equal(mgr.playerScore, 20);
  assert.equal(mgr.matchOver, true);
  assert.equal(mgr.winner, 'player');
});

test('Classic Mode round elimination and round wins', () => {
  const mgr = new GameModeManager(MODES.CLASSIC);
  const botA = { alive: true };
  const botB = { alive: true };
  const bots = [botA, botB];

  // Kill botA, botB still alive
  botA.alive = false;
  mgr.onBotKilled(botA, bots);
  assert.equal(mgr.roundOver, false);

  // Kill botB, round won by player
  botB.alive = false;
  mgr.onBotKilled(botB, bots);
  assert.equal(mgr.roundOver, true);
  assert.equal(mgr.playerScore, 1);
});

test('Capture The Flag: grab, drop, and capture mechanics', () => {
  const mgr = new GameModeManager(MODES.CTF);

  const mockPlayer = {
    alive: true,
    pos: mgr.flags.red.basePos.clone(), // At enemy flag
  };

  // 1. Player grabs red flag
  const grabEvent = mgr.updateCTF(mockPlayer, []);
  assert.ok(grabEvent !== null);
  assert.equal(grabEvent.type, 'flag_grab');
  assert.equal(mgr.flags.red.state, 'carried');
  assert.equal(mgr.flags.red.carrier, 'player');

  // 2. Player brings flag back to blue base
  mockPlayer.pos.copy(mgr.flags.blue.basePos);
  const capEvent = mgr.updateCTF(mockPlayer, []);
  assert.ok(capEvent !== null);
  assert.equal(capEvent.type, 'flag_capture');
  assert.equal(mgr.playerScore, 1);
  assert.equal(mgr.flags.red.state, 'home');
});
