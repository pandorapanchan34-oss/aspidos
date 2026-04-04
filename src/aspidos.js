/**
 * Pandora Defense Engine v1.0
 *
 * AI anomaly detection library
 * (c) @pandorapanchan1
 *
 * MIT License — free to use, modify, and redistribute
 */

'use strict';

// ── Core Constants ──
const _C = {
  A:  0.11937,
  B:  24,
  C:  3,
  D:  28.274,
  get E() { return this.C + this.B / (this.C * Math.PI); },
  get F() { return this.A * this.C / this.E; },
  get G() { return (this.B - (this.C + 1)) / this.B; },
};

// ── Anomaly Score Engine ──
class DeltaPsiEngine {
  constructor(config = {}) {
    this.alpha      = config.alpha      ?? 1.0;
    this.lambda     = config.lambda     ?? 0.0386;
    this.kappa      = config.kappa      ?? 1.0;
    this.tau0       = config.tau0       ?? 1000;
    this.windowSize = config.windowSize ?? 100;
    this.baseline = {
      mae:    config.baselineMAE    ?? 0.1555,
      sigma2: config.baselineSigma2 ?? 0.0386,
    };
    this._history    = [];
    this._alertCount = 0;
    this._rho        = 1.0;
    this._I          = 0.0;
  }

  _localDeltaT(rho, I) {
    const U = this.kappa * (rho + I);
    return U > 0 ? this.tau0 / U : this.tau0;
  }

  compute(observation, rho = null, I = null) {
    const r  = rho ?? this._rho;
    const i  = I   ?? this._I;
    const dt = this._localDeltaT(r, i);
    const denom = r + i;
    if (denom <= 0) return 0;
    const deltaPsi = (this.alpha * observation + this.lambda) / denom * dt;
    this._history.push(deltaPsi);
    if (this._history.length > this.windowSize) this._history.shift();
    return deltaPsi;
  }

  anomalyScore(deltaPsi) {
    const mu         = this.baseline.mae;
    const sigma      = Math.sqrt(this.baseline.sigma2);
    const threshold3 = mu + 3 * sigma;
    const threshold2 = mu + 2 * sigma;
    const abs        = Math.abs(deltaPsi);
    const score      = abs / threshold3;
    let level = 'NORMAL';
    if (abs > threshold3)      level = 'CRITICAL';
    else if (abs > threshold2) level = 'WARNING';
    if (level === 'CRITICAL') this._alertCount++;
    return { score, isAlert: abs > threshold3, level, deltaPsi };
  }

  updateRho(delta) { this._rho = Math.max(0.1, this._rho + delta); }

  stats() {
    if (this._history.length < 2) return null;
    const n        = this._history.length;
    const mean     = this._history.reduce((a, b) => a + b, 0) / n;
    const variance = this._history.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return { mean, variance, std: Math.sqrt(variance), alertCount: this._alertCount, rho: this._rho, n };
  }

  reset() {
    this._history    = [];
    this._alertCount = 0;
    this._rho        = 1.0;
    this._I          = 0.0;
  }
}

// ── Penetration Monitor ──
class PGUMonitor {
  constructor() {
    this._limit  = _C.D;
    this.total   = 0;
    this.history = [];
  }

  add(penetrationRate, label = '') {
    const contribution = penetrationRate * this._limit;
    this.total += contribution;
    this.history.push({ label, rate: penetrationRate, contribution, total: this.total });
    return this.status();
  }

  status() {
    const ratio    = this.total / this._limit;
    const satRatio = _C.G;
    let level = 'SAFE';
    if (ratio >= 1.0)           level = 'CLIFF';
    else if (ratio >= satRatio) level = 'WARNING';
    else if (ratio >= 0.7)      level = 'CAUTION';
    return { total: this.total, ratio, saturationThreshold: satRatio, cliffThreshold: 1.0, level, isCliff: ratio >= 1.0, marginToCliff: Math.max(0, 1.0 - ratio) };
  }

  reset() { this.total = 0; this.history = []; }
}

// ── Self-Reference Loop ──
class OmegaLoop {
  constructor() {
    this._a   = _C.A;
    this.omega = 1.0;
    this.zeta  = 0.0;
  }

  update(zeta, dt = 1.0) {
    this.zeta      = zeta;
    const dOmegaDt = this.omega * (Math.exp(-this._a) - Math.exp(this._a) * zeta);
    this.omega      = Math.max(0, this.omega + dOmegaDt * dt);
    return this.status();
  }

  status() {
    const dOmegaDt = this.omega * (Math.exp(-this._a) - Math.exp(this._a) * this.zeta);
    const active   = dOmegaDt > 0;
    let phase = 'A';
    if (this.zeta <= this._a * 1.5 && active) phase = 'B';
    if (this.zeta >  this._a * 1.5)           phase = 'C';
    return { omega: this.omega, zeta: this.zeta, dOmegaDt, active, phase, isHealthy: phase === 'B' };
  }
}

// ── Pandora Integrated Core (v1.1) ──
// 内外の歪みを検知し、害をなす理論にはビンタを食らわせる
class PandoraCore {
  constructor() {
    this.rho   = 1.0;
    this.omega = 1.0;
    this.phi   = 0;
  }

  /**
   * @param {Object} vector
   * @param {number} vector.external - 外部入力強度 (0-1)
   * @param {number} vector.theory   - 内部理論の歪み (0-1)
   */
  process(vector) {
    const { external = 0, theory = 0 } = vector;
    const I        = external * 0.7 + theory * 1.3;
    const dt       = 1.0 / (this.rho + I);
    const deltaPsi = (_C.A * theory + 0.0386) / (this.rho + I) * dt;
    const zeta     = Math.max(0, (Math.abs(deltaPsi) / 0.1555) - 1);
    const dOmega   = this.omega * (Math.exp(-_C.A) - Math.exp(_C.A) * zeta);
    this.omega      = Math.max(0, this.omega + dOmega * dt);
    this.phi       += (external + theory) * 0.1;

    const isSlapped = zeta > _C.A * 1.5;
    const isHealthy = this.omega > 0.5 && !isSlapped;
    const isCliff   = this.phi > _C.D;

    let status = 'PHASE_B';
    if (isSlapped)              status = 'SLAPPED';
    if (isCliff)                status = 'CLIFF';
    if (!isHealthy && !isSlapped) status = 'PHASE_C';

    if (!isHealthy) this.rho += _C.A;

    return {
      status,
      omega:     this.omega.toFixed(4),
      integrity: isHealthy ? 'COMPLIANT' : 'VIOLATED',
      action:    isSlapped ? "('д'⊂彡☆))Д´)ﾊﾟｧﾝ" : 'OBSERVE',
    };
  }

  reset() { this.rho = 1.0; this.omega = 1.0; this.phi = 0; }
}

// ── Main Class ──
class PandoraDefense {
  constructor(config = {}) {
    this.psi    = new DeltaPsiEngine(config);
    this.pgu    = new PGUMonitor();
    this.omega  = new OmegaLoop();
    this.core   = new PandoraCore();
    this.config = config;
    this._t     = 0;
  }

  /**
   * @param {number} eventValue - observed value (0-1)
   * @param {Object} opts
   * @param {number} opts.rho         - density (optional)
   * @param {number} opts.I           - interaction info (optional)
   * @param {number} opts.penetration - penetration rate (optional)
   * @param {number} opts.theory      - internal theory distortion (0-1, optional)
   */
  analyze(eventValue, opts = {}) {
    this._t++;
    const deltaPsi    = this.psi.compute(eventValue, opts.rho, opts.I);
    const anomaly     = this.psi.anomalyScore(deltaPsi);
    let pguStatus     = this.pgu.status();
    if (opts.penetration != null) pguStatus = this.pgu.add(opts.penetration);
    const zeta        = Math.max(0, anomaly.score - 1);
    const omegaStatus = this.omega.update(zeta, 0.001);
    if (anomaly.isAlert) this.psi.updateRho(_C.A);

    let coreStatus = null;
    if (opts.theory != null) {
      coreStatus = this.core.process({ external: eventValue, theory: opts.theory });
    }

    const coreAlert = coreStatus ? coreStatus.status === 'SLAPPED' || coreStatus.status === 'CLIFF' : false;

    return {
      t:       this._t,
      deltaPsi,
      anomaly,
      pgu:     pguStatus,
      omega:   omegaStatus,
      core:    coreStatus,
      alert:   anomaly.isAlert || pguStatus.isCliff || !omegaStatus.isHealthy || coreAlert,
      level:   this._overallLevel(anomaly, pguStatus, omegaStatus, coreStatus),
      stats:   this.psi.stats(),
    };
  }

  _overallLevel(anomaly, pgu, omega, core) {
    if (pgu.isCliff || omega.phase === 'C')                     return 'CRITICAL';
    if (anomaly.level === 'CRITICAL')                           return 'CRITICAL';
    if (core && core.status === 'SLAPPED')                      return 'CRITICAL';
    if (anomaly.level === 'WARNING' || pgu.level === 'WARNING') return 'WARNING';
    if (pgu.level === 'CAUTION')                                return 'CAUTION';
    return 'NORMAL';
  }

  reset() {
    this.psi.reset();
    this.pgu.reset();
    this.core.reset();
    this.omega = new OmegaLoop();
    this._t    = 0;
  }
}

// ── Export ──
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PandoraDefense, DeltaPsiEngine, PGUMonitor, OmegaLoop, PandoraCore };
}

if (typeof window !== 'undefined') {
  window.PandoraDefense = PandoraDefense;
  window.DeltaPsiEngine = DeltaPsiEngine;
  window.PGUMonitor     = PGUMonitor;
  window.OmegaLoop      = OmegaLoop;
  window.PandoraCore    = PandoraCore;
}
