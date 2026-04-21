// src/aspidos.js  — セキュリティ強化版 v1.1 (攻撃してこいやー対応)

'use strict';

const _C = {
  A: 0.11937,   // τ (情報粘性)
  B: 24,        // K₄
  C: 3,         // n=3
  D: 28.274,    // I*
  get G() { return (this.B - (this.C + 1)) / this.B; }, // 5/6 ≈ 0.8333
};

class DeltaPsiEngine {
  constructor(config = {}) {
    this.alpha      = config.alpha ?? 1.0;
    this.lambda     = config.lambda ?? 0.0386;
    this.kappa      = config.kappa ?? 1.0;
    this.tau0       = config.tau0 ?? 1000;
    this.windowSize = config.windowSize ?? 500; // 少し増やした
    this.baseline   = {
      mae:    config.baselineMAE ?? 0.1555,
      sigma2: config.baselineSigma2 ?? 0.0386,
    };
    this._history   = [];
    this._alertCount = 0;
    this._rho       = 1.0;
    this._I         = 0.0;
  }

  _localDeltaT(rho, I) {
    const U = this.kappa * (rho + I);
    return U > 0 ? this.tau0 / U : this.tau0;
  }

  compute(observation, rho = null, I = null) {
    const r = rho ?? this._rho;
    const i = I ?? this._I;
    const dt = this._localDeltaT(r, i);
    const denom = r + i;
    if (denom <= 0) return 0;

    const deltaPsi = (this.alpha * observation + this.lambda) / denom * dt;
    
    this._history.push({ ts: Date.now(), value: deltaPsi });
    if (this._history.length > this.windowSize) this._history.shift();

    return deltaPsi;
  }

  anomalyScore(deltaPsi) {
    const mu = this.baseline.mae;
    const sigma = Math.sqrt(this.baseline.sigma2);
    const threshold3 = mu + 3 * sigma;
    const abs = Math.abs(deltaPsi);
    const score = abs / threshold3;

    let level = 'NORMAL';
    if (abs > threshold3) level = 'CRITICAL';
    else if (abs > mu + 2 * sigma) level = 'WARNING';

    if (level === 'CRITICAL') this._alertCount++;

    return { score, isAlert: abs > threshold3, level, deltaPsi };
  }

  updateRho(delta) {
    this._rho = Math.max(0.1, this._rho + delta);
  }

  getHistory() {
    return [...this._history];
  }
}

class PGUMonitor {
  constructor(config = {}) {
    this._limit = config.limit ?? _C.D;
    this.total = 0;
    this.history = [];           // ログ永続化用
    this.satRatio = _C.G;        // 厳密に5/6
  }

  add(penetrationRate, label = '') {
    const contribution = penetrationRate * this._limit;
    this.total += contribution;
    const entry = {
      ts: Date.now(),
      rate: penetrationRate,
      contribution,
      total: this.total,
      ratio: this.total / this._limit,
      label
    };
    this.history.push(entry);

    return this.status();
  }

  status() {
    const ratio = this.total / this._limit;
    let level = 'SAFE';
    if (ratio >= 1.0) level = 'OVERLOAD';
    else if (ratio >= this.satRatio) level = 'CLIFF_WARNING';   // 計算崖手前
    else if (ratio >= 0.7) level = 'CAUTION';

    return {
      total: this.total,
      ratio,
      saturationThreshold: this.satRatio,
      level,
      isCliff: ratio >= this.satRatio,
      isOverload: ratio >= 1.0,
    };
  }

  getHistory() {
    return [...this.history];
  }
}

// OmegaLoopも強化（崖発生時に明確に不安定化）
class OmegaLoop {
  constructor() {
    this._a = _C.A;
    this.omega = 1.0;
    this.zeta = 0.0;
  }

  update(zeta, dt = 1.0) {
    this.zeta = zeta;
    // 崖が深いほど急激に減少
    const decay = Math.exp(-this._a) - Math.exp(this._a * zeta) * zeta;
    this.omega = Math.max(0.05, this.omega + decay * dt);   // 下限を少し上げて完全死を防ぐ
    return this.status();
  }

  status() {
    const active = this.omega > 0.3;
    let phase = 'STABLE';
    if (this.zeta > 1.2) phase = 'CRITICAL_CLIFF';
    else if (this.zeta > 0.8) phase = 'WARNING_CLIFF';

    return {
      omega: this.omega,
      zeta: this.zeta,
      phase,
      isCliff: phase.includes('CLIFF')
    };
  }
}

// メインクラスも少し強化
class PandoraDefense {
  constructor(config = {}) {
    this.psi = new DeltaPsiEngine(config);
    this.pgu = new PGUMonitor(config);
    this.omega = new OmegaLoop();
    this._t = 0;
    this._cliffs = 0;        // 崖発生回数記録
  }

  analyze(eventValue, opts = {}) {
    this._t++;
    const deltaPsi = this.psi.compute(eventValue);
    const anomaly = this.psi.anomalyScore(deltaPsi);
    
    let pguStatus = this.pgu.status();
    if (opts.penetration != null) {
      pguStatus = this.pgu.add(opts.penetration, opts.label || '');
    }

    const zeta = Math.max(0, anomaly.score - 1);
    const omegaStatus = this.omega.update(zeta);

    // 崖発生カウント
    if (omegaStatus.isCliff) this._cliffs++;

    return {
      t: this._t,
      deltaPsi,
      anomaly,
      pgu: pguStatus,
      omega: omegaStatus,
      cliffCount: this._cliffs,
      alert: anomaly.isAlert || pguStatus.isCliff || pguStatus.isOverload,
      level: this._getLevel(anomaly, pguStatus, omegaStatus)
    };
  }

  _getLevel(anomaly, pgu, omega) {
    if (pgu.isOverload || omega.phase === 'CRITICAL_CLIFF') return 'CRITICAL_CLIFF';
    if (anomaly.level === 'CRITICAL') return 'CRITICAL';
    if (pgu.isCliff) return 'CLIFF_WARNING';
    return 'NORMAL';
  }

  getAllLogs() {
    return {
      psi: this.psi.getHistory(),
      pgu: this.pgu.getHistory(),
      cliffCount: this._cliffs
    };
  }

  exportLogs() {
    const logs = this.getAllLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `aspidos_attack_log_${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}

// グローバル公開
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PandoraDefense, DeltaPsiEngine, PGUMonitor, OmegaLoop };
} else if (typeof window !== 'undefined') {
  window.PandoraDefense = PandoraDefense;
}
