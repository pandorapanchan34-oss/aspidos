/**
 * Aspidos - Browser Security Shield v1.4 [FINAL SURVIVAL]
 * Logic: Information Field Theory (Pandora) & Biological Survival
 * MIT License - (c) 2026 @pandorapanchan34-oss
 */

'use strict';

const Aspidos = (() => {
  // パンドラ定数：宇宙の帯域と収束戦略
  const _C = {
    A: 0.11937,   // 情報粘性 (τ)
    D: 28.274,    // 飽和限界 (I*)
    G: 0.8333     // 収束境界線 (5/6)
  };

  class Shield {
    constructor() {
      this.tick = 0;
      this.history = [];
      this.rho = 1.0;
      this.totalPgu = 0;
      this.omega = 1.0;
      this.minFloor = 0;
      this.fatigue = 0;
      this.fatigueMemory = 0;
      this.vSmooth = 0;
      this.vPeak = 0;
      this.vMemory = 0;
    }

    /**
     * 真理の門を守るためのメイン解析プロセス
     */
    process(obs, opts = {}) {
      this.tick++;
      const profile = this._analyzeContext();

      // 1. ΔΨ (歪みエンジン): 創造的ゆらぎの注入
      const jitter = Math.sin(Date.now() / 137) * 0.03 + (Math.random() - 0.5) * (0.02 + (this.totalPgu / _C.D) * 0.1);
      const effectiveObs = obs + jitter;
      const d = (effectiveObs + 0.0386) / this.rho * (1000 / this.rho) * (0.95 + Math.random() * 0.1);

      // --- ⚡ 速度解析 & 深層記憶 (vMemory) ---
      const prev = this.history[this.history.length - 1];
      const velocity = prev ? (d - prev.deltaPsi) : 0;
      this.vSmooth = this.vSmooth * 0.8 + velocity * 0.2;
      
      // 過去のトラウマを少しずつ浄化しつつ、新たなピークを刻む
      this.vMemory = Math.max(this.vMemory * 0.995, this.vPeak);
      this.vPeak = Math.max(this.vPeak * 0.9, Math.abs(velocity)) + (this.vMemory * 0.02);

      // 2. 適応型スコアリング
      const pguRatio = this.totalPgu / _C.D;
      const absD = Math.abs(d / 100);
      
      // 基本スコア算出
      let score = absD / 1.1 + Math.pow(absD, 2) * 0.15 + Math.abs(velocity) * 0.05 + (this.vPeak * 0.03);

      // --- ⚡ 結合 (Coupling) & 動的 Base Pressure ---
      const basePressure = 0.1 + (this.fatigue * 0.05) + (pguRatio * 0.05);
      const coupling = (pguRatio * 0.4) + (this.fatigue * 0.3) + (Math.abs(this.vSmooth) * 0.3);
      score *= (1 + coupling + basePressure);

      // --- ⚡ スコアの安定化 (脳筋をインテリジェンスに) ---
      score = Math.log1p(score);

      // 3. 判定ロジック & 確率的トリガー
      let level = 'NORMAL';
      let alertBase = 0.9 - pguRatio * 0.15;
      if (profile.isStructured && profile.intensity > 0.7) alertBase *= 0.8;

      // 基本判定
      if (score > (1.4 - pguRatio * 0.2)) level = 'CRITICAL';
      else if (score > alertBase) level = 'WARNING';

      // --- ⚡ Probabilistic Trigger (量子的な不確定防御) ---
      const triggerProb = (absD * 0.8) + (Math.abs(this.vSmooth) * 0.6) + (pguRatio * 0.5);
      if (Math.random() < triggerProb * 0.5) {
        level = 'CRITICAL';
      }

      // 4. PGU (累積リスク): 限界設定 (Ceiling)
      if (opts.penetration) {
        this.minFloor = Math.max(this.minFloor * 0.999, this.totalPgu * 0.3);
        const boost = profile.escalation > 0.2 ? 1.05 : 1.0;
        this.totalPgu = Math.max(this.minFloor, (this.totalPgu * 0.985) + (opts.penetration * _C.D * boost));
        this.totalPgu += profile.intensity * 0.02;
        
        // --- ⚡ PGU Ceiling: 帯域有限性に基づく上限 ---
        this.totalPgu = Math.min(this.totalPgu, _C.D * 2);
      }

      // 5. Ω (自己安定) & Fatigue Memory
      const zeta = Math.max(0, score - 1);
      
      this.fatigueMemory = Math.max(this.fatigueMemory, this.fatigue);
      this.fatigue = Math.min(2.0, this.fatigue * 0.995 + zeta * 0.05) + (this.fatigueMemory * 0.01);
      
      const decay = Math.exp(-_C.A) - Math.exp(_C.A * 2.2 * zeta) * zeta;
      this.omega = Math.max(0.06, this.omega + decay * (1.1 + Math.random() * 0.2));
      
      // --- ⚡ Ω Recovery: 不屈の自己修復 ---
      if (this.omega < 0.2 && this.fatigue < 0.5) {
        this.omega += 0.05;
      }
      
      this.omega *= (1 - this.fatigue * 0.02);
      if (zeta > 1.0 || profile.intensity > 0.8) this.omega *= 0.97;

      const result = {
        tick: this.tick,
        deltaPsi: d,
        score: parseFloat(score.toFixed(4)),
        level: level,
        pguRatio: this.totalPgu / _C.D,
        omega: this.omega,
        fatigue: this.fatigue,
        isCliff: zeta > 1.15 || (this.totalPgu / _C.D) >= _C.G
      };

      this._log(result);
      return result;
    }

    _analyzeContext() {
      if (this.history.length < 10) return { isStructured: false, escalation: 0, intensity: 0 };
      const recent = this.history.slice(-15);
      const intervals = recent.map((e, i, a) => i > 0 ? e.ts - a[i-1].ts : null).filter(Boolean);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const diffs = intervals.map((v, i, a) => i > 0 ? v - a[i - 1] : 0).slice(1);
      const stability = diffs.length > 0 ? diffs.reduce((s, v) => s + Math.abs(v), 0) / diffs.length : 0;
      return {
        isStructured: stability < avg * 0.15,
        escalation: recent[recent.length - 1].deltaPsi - recent[0].deltaPsi,
        intensity: recent.reduce((s, e) => s + Math.abs(e.deltaPsi), 0) / recent.length
      };
    }

    _log(res) {
      this.history.push({ ts: Date.now(), ...res });
      if (this.history.length > 500) this.history.shift();
    }
  }

  return { Shield };
})();

if (typeof window !== 'undefined') { window.Aspidos = Aspidos; }
