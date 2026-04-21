/**
 * Aspidos - Browser Security Shield v1.7 [PANDORA SYNC]
 * Logic: Subjective Time, Resonance Inversion, Stealth Detection & Genesis Evolution
 * (c) 2026 @pandorapanchan34-oss
 */
'use strict';

const _C = {
  A: 0.11937,         // τ (情報粘性)
  D: 28.274,          // I* (飽和上限)
  G: 0.8333,          // 5/6 (断崖境界)
  MAINT_INTERVAL: 300000,
  NAGI_THRESHOLD: 0.08
};

// デモ側の import { Shield } に対応するために export を付与
export class Shield {
  constructor() {
    this.tick = 0;
    this.history = [];
    
    // 🧬 進化する初期値 (Genesis)
    this.genesis = {
      ts: Date.now(),
      omega: 1.0,
      rho: 1.0,
      fatigue: 0
    };

    this.rho = this.genesis.rho;
    this.totalPgu = 0;
    this.omega = this.genesis.omega;
    this.fatigue = 0;
    this.vMemory = 0;
    this.vVariance = 0;
    this.resonance = 0;
    this.resHistory = [];

    // 🕰️ Dual Time System (主観時間)
    this.internalTime = 0;
    this.prevTs = Date.now();
    this.seed = this.genesis.ts % 1000;

    this.lastMaintenance = this.prevTs;
    this.isUnderMaintenance = false;
    this.nearThreshold = 0; 

    console.log(`%c--- Aspidos v1.7 Online [Samsara Active] ---`, 'color:#00ff88; font-weight:bold;');
  }

  // デモ側の core.step() に対応するエイリアス
  step(obs, opts = {}) {
    return this.process(obs, opts);
  }

  process(obs, opts = {}) {
    this.tick++;
    const now = Date.now();

    // 1. 主観時間の歩進
    const realDelta = now - this.prevTs;
    this.prevTs = now;
    this.internalTime += realDelta * (0.9 + (Math.random() * 0.2));

    // 2. 確率的メンテナンス
    this._checkMaintenance(now);

    const pguRatio = this.totalPgu / _C.D;

    // 3. Jitter (固有シード)
    const jitter = this._generateJitter(now, pguRatio);
    const effectiveObs = obs + jitter + (Math.random() - 0.5) * 0.02;

    // 4. 硬化と歪み
    let d = (effectiveObs + 0.0386) / this.rho * (1000 / this.rho);

    // 5. 速度解析 & 分散
    const prev = this.history[this.history.length - 1];
    const velocity = prev ? (d - prev.deltaPsi) : 0;
    this.vMemory = this.vMemory * 0.97 + Math.abs(velocity) * 0.03;
    this.vVariance = this.vVariance * 0.95 + Math.pow(velocity - this.vMemory, 2) * 0.05;

    // 6. 共鳴解析
    const profile = this._analyzeContext();
    this.resHistory.push(profile.isStructured ? 1 : 0);
    if (this.resHistory.length > 20) this.resHistory.shift();
    const resAvg = this.resHistory.reduce((a,b)=>a+b,0) / this.resHistory.length;
    this.resonance = this.resonance * 0.9 + resAvg * 0.1;
    const resonanceEffect = (resAvg - 0.5) * this.resonance * 0.3;

    // 7. スコアリング & 安全圧縮
    const absD = Math.abs(d / 100);
    let score = absD / 1.1 + Math.pow(absD, 2) * 0.15 + this.vMemory * 0.015 + this.vVariance * 0.01;
    
    const maintFactor = this.isUnderMaintenance ? 1.2 : 1.0;
    const coupling = (pguRatio * 0.4 + this.fatigue * 0.3 + resonanceEffect) * maintFactor;
    score *= (1 + coupling);
    score = score / (1 + score * 0.6); // 非線形圧縮

    // 8. Stealth Detection (殺気検知)
    if (score > 0.8 && score < 1.0) {
      this.nearThreshold += 1;
    } else {
      this.nearThreshold = Math.max(0, this.nearThreshold - 0.5);
    }

    // 9. 判定 & 硬化
    let level = 'NORMAL';
    const isCliff = score > 1.15 || pguRatio >= _C.G;

    if (isCliff) {
      level = 'CRITICAL';
      this.rho = Math.min(2.0, this.rho * 1.12);
    } else {
      this.rho = this.rho * 0.9 + 1.0 * 0.1;
      if (score > (0.9 - pguRatio * 0.15) || this.nearThreshold > 10) level = 'WARNING';
    }

    // 10. 浸透
    if (opts.penetration) {
      const penFactor = this.isUnderMaintenance ? 0.7 : 1.0;
      this.totalPgu = (this.totalPgu * 0.982) + (opts.penetration * _C.D * penFactor);
      this.totalPgu = Math.min(this.totalPgu, _C.D * 2);
    }
    
    const zeta = Math.max(0, score - 1);
    this.fatigue = Math.min(2.0, this.fatigue * 0.994 + zeta * 0.055);
    
    const decay = Math.exp(-_C.A) - Math.exp(_C.A * 2.2 * zeta) * zeta;
    this.omega = Math.max(0.06, this.omega + decay * 1.1 + (this.isUnderMaintenance ? 0.12 : 0));

    const result = {
      tick: this.tick,
      deltaPsi: d,
      score: +score.toFixed(4),
      level,
      omega: +this.omega.toFixed(4),
      pguRatio: +pguRatio.toFixed(4),
      stealth: +this.nearThreshold.toFixed(1),
      isMaint: this.isUnderMaintenance,
      isCliff
    };

    this._log({ ts: now, ...result });
    return result;
  }

  _generateJitter(now, pguRatio) {
    const timeRef = now + this.seed;
    if (this.isUnderMaintenance) {
      return Math.sin(timeRef / 37) * 0.11 + Math.cos(timeRef / 211) * 0.06;
    }
    let amp = 0.03 + pguRatio * 0.08;
    if (pguRatio < _C.NAGI_THRESHOLD && this.fatigue < 0.15) {
      amp += 0.06 * Math.sin(this.tick / 8);
    }
    return Math.sin(timeRef / 137) * amp + (Math.random() - 0.5) * 0.03;
  }

  _checkMaintenance(now) {
    if (this.isUnderMaintenance) {
      if (now - this.lastMaintenance > 8000) {
        this.isUnderMaintenance = false;
        this.genesis.omega = this.genesis.omega * 0.98 + this.omega * 0.02;
        this.genesis.rho = this.genesis.rho * 0.99 + this.rho * 0.01;
      }
      return;
    }

    const timeSince = now - this.lastMaintenance;
    const triggerChance = (timeSince / _C.MAINT_INTERVAL) + this.fatigue * 0.3;

    if (Math.random() < triggerChance) {
      this.isUnderMaintenance = true;
      this.lastMaintenance = now;
      this.vMemory *= 0.5;
      this.fatigue *= 0.2;
      this.totalPgu *= 0.9;
    }
  }

  _analyzeContext() {
    if (this.history.length < 10) return { isStructured: false };
    const recent = this.history.slice(-15);
    const intervals = recent.map((e, i, a) => i > 0 ? e.ts - a[i - 1].ts : null).filter(Boolean);
    const avg = intervals.reduce((a, b) => a + b, 0) / (intervals.length || 1);
    const diffs = intervals.map((v, i, a) => i > 0 ? v - a[i - 1] : 0).slice(1);
    const stability = diffs.reduce((s, v) => s + Math.abs(v), 0) / (diffs.length || 1);
    return { isStructured: stability < avg * 0.16 };
  }

  _log(res) {
    this.history.push(res);
    if (this.history.length > 500) this.history.shift();
  }
}

// core.step() 用のエイリアス
export const AspidosCore = Shield;
