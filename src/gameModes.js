import * as THREE from 'three';

export const MODES = {
  CLASSIC: 'classic',
  DEATHMATCH: 'deathmatch',
  CTF: 'ctf',
};

export const MODE_CONFIGS = {
  classic: {
    name: 'Classic Tactical',
    description: 'Round-based elimination. Eliminate all enemy bots to win the round. No respawn until next round!',
    roundsToWin: 3,
    maxRounds: 5,
    allowRespawn: false,
  },
  deathmatch: {
    name: 'Deathmatch',
    description: 'Fast-paced free-for-all action. First to reach 20 kills wins the match!',
    killTarget: 20,
    allowRespawn: true,
    respawnDelay: 2.0,
  },
  ctf: {
    name: 'Capture The Flag',
    description: 'Steal the enemy Red Flag and return it to your Blue Base. First team to 3 captures wins!',
    capturesToWin: 3,
    allowRespawn: true,
    respawnDelay: 3.0,
  },
};

export class GameModeManager {
  constructor(mode = MODES.DEATHMATCH) {
    this.mode = mode;
    this.config = MODE_CONFIGS[mode];

    // Scores
    this.playerScore = 0;
    this.enemyScore = 0;
    this.round = 1;
    this.roundOver = false;
    this.matchOver = false;
    this.winner = null;

    // CTF specifics
    this.flags = {
      blue: {
        basePos: new THREE.Vector3(32.5, 1, 56.5),
        pos: new THREE.Vector3(32.5, 1, 56.5),
        state: 'home', // 'home' | 'carried' | 'dropped'
        carrier: null, // 'player' | bot instance
      },
      red: {
        basePos: new THREE.Vector3(32.5, 1, 8.5),
        pos: new THREE.Vector3(32.5, 1, 8.5),
        state: 'home',
        carrier: null,
      },
    };
  }

  setMode(mode) {
    if (!MODE_CONFIGS[mode]) return;
    this.mode = mode;
    this.config = MODE_CONFIGS[mode];
    this.reset();
  }

  reset() {
    this.playerScore = 0;
    this.enemyScore = 0;
    this.round = 1;
    this.roundOver = false;
    this.matchOver = false;
    this.winner = null;
    this.resetFlags();
  }

  resetFlags() {
    this.flags.blue.pos.copy(this.flags.blue.basePos);
    this.flags.blue.state = 'home';
    this.flags.blue.carrier = null;

    this.flags.red.pos.copy(this.flags.red.basePos);
    this.flags.red.state = 'home';
    this.flags.red.carrier = null;
  }

  onBotKilled(bot, botsList) {
    if (this.matchOver) return;

    if (this.mode === MODES.DEATHMATCH) {
      this.playerScore++;
      if (this.playerScore >= this.config.killTarget) {
        this.matchOver = true;
        this.winner = 'player';
      }
    } else if (this.mode === MODES.CLASSIC) {
      // Check if all bots are dead in current round
      const aliveBots = botsList.filter((b) => b.alive && b !== bot).length;
      if (aliveBots === 0) {
        this.playerScore++;
        this.roundOver = true;
        if (this.playerScore >= this.config.roundsToWin) {
          this.matchOver = true;
          this.winner = 'player';
        }
      }
    } else if (this.mode === MODES.CTF) {
      // If bot was carrying blue flag, drop it
      if (this.flags.blue.carrier === bot) {
        this.flags.blue.state = 'dropped';
        this.flags.blue.carrier = null;
        this.flags.blue.pos.copy(bot.pos);
      }
    }
  }

  onPlayerKilled(botsList) {
    if (this.matchOver) return;

    if (this.mode === MODES.DEATHMATCH) {
      this.enemyScore++;
      if (this.enemyScore >= this.config.killTarget) {
        this.matchOver = true;
        this.winner = 'enemy';
      }
    } else if (this.mode === MODES.CLASSIC) {
      this.enemyScore++;
      this.roundOver = true;
      if (this.enemyScore >= this.config.roundsToWin) {
        this.matchOver = true;
        this.winner = 'enemy';
      }
    } else if (this.mode === MODES.CTF) {
      // If player was carrying red flag, drop it
      if (this.flags.red.carrier === 'player') {
        this.flags.red.state = 'dropped';
        this.flags.red.carrier = null;
      }
    }
  }

  startNextRound(player, botsList) {
    if (this.matchOver) return;
    this.round++;
    this.roundOver = false;
    player.respawn();
    for (const b of botsList) {
      b.respawn();
    }
    this.resetFlags();
  }

  updateCTF(player, botsList) {
    if (this.mode !== MODES.CTF || this.matchOver) return null;

    const eventResult = {
      type: null,
      message: null,
    };

    // 1. Player flag interaction
    if (player.alive) {
      // Player grabs Red Flag (enemy flag)
      if (this.flags.red.state !== 'carried') {
        const distToRed = player.pos.distanceTo(this.flags.red.pos);
        if (distToRed < 2.0) {
          this.flags.red.state = 'carried';
          this.flags.red.carrier = 'player';
          eventResult.type = 'flag_grab';
          eventResult.message = 'YOU TOOK THE ENEMY FLAG! RETURN IT TO BLUE BASE!';
        }
      }

      // Player returns Red Flag to Blue Base for capture!
      if (this.flags.red.carrier === 'player') {
        this.flags.red.pos.copy(player.pos).add(new THREE.Vector3(0, 1.2, 0));
        const distToBlueBase = player.pos.distanceTo(this.flags.blue.basePos);
        // Only capture if Blue Flag is safe at home
        if (distToBlueBase < 2.5 && this.flags.blue.state === 'home') {
          this.playerScore++;
          this.resetFlags();
          eventResult.type = 'flag_capture';
          eventResult.message = `BLUE TEAM CAPTURED THE FLAG! (${this.playerScore}/${this.config.capturesToWin})`;
          if (this.playerScore >= this.config.capturesToWin) {
            this.matchOver = true;
            this.winner = 'player';
          }
        }
      }

      // Player recovers dropped Blue Flag
      if (this.flags.blue.state === 'dropped') {
        if (player.pos.distanceTo(this.flags.blue.pos) < 2.0) {
          this.flags.blue.state = 'home';
          this.flags.blue.pos.copy(this.flags.blue.basePos);
          this.flags.blue.carrier = null;
          eventResult.type = 'flag_return';
          eventResult.message = 'BLUE FLAG RECOVERED & RETURNED TO BASE!';
        }
      }
    }

    // 2. Bots flag interaction
    for (const bot of botsList) {
      if (!bot.alive) continue;

      // Bot grabs Blue Flag
      if (this.flags.blue.state !== 'carried') {
        const distToBlue = bot.pos.distanceTo(this.flags.blue.pos);
        if (distToBlue < 2.0) {
          this.flags.blue.state = 'carried';
          this.flags.blue.carrier = bot;
          eventResult.type = 'flag_stolen';
          eventResult.message = 'ENEMY TOOK YOUR BLUE FLAG! INTERCEPT THEM!';
        }
      }

      // Bot returns Blue Flag to Red Base
      if (this.flags.blue.carrier === bot) {
        this.flags.blue.pos.copy(bot.pos).add(new THREE.Vector3(0, 1.2, 0));
        const distToRedBase = bot.pos.distanceTo(this.flags.red.basePos);
        if (distToRedBase < 2.5 && this.flags.red.state === 'home') {
          this.enemyScore++;
          this.resetFlags();
          eventResult.type = 'enemy_flag_capture';
          eventResult.message = `RED TEAM CAPTURED YOUR FLAG! (${this.enemyScore}/${this.config.capturesToWin})`;
          if (this.enemyScore >= this.config.capturesToWin) {
            this.matchOver = true;
            this.winner = 'enemy';
          }
        }
      }

      // Bot recovers dropped Red Flag
      if (this.flags.red.state === 'dropped') {
        if (bot.pos.distanceTo(this.flags.red.pos) < 2.0) {
          this.flags.red.state = 'home';
          this.flags.red.pos.copy(this.flags.red.basePos);
          this.flags.red.carrier = null;
          eventResult.type = 'flag_return';
          eventResult.message = 'RED FLAG RETURNED BY ENEMY!';
        }
      }
    }

    return eventResult.type ? eventResult : null;
  }
}
