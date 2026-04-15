/**
 * Pandora Defense Engine v1.
 *
 * Lightweight adaptive anomaly detection library
 * (c) @pandorapanchan1
 *
 * MIT License
 */

'use strict';

const _C = {
  A: 0.11937,   // default stability factor
  B: 24,        // internal constant
  C: 3,         // default dimension
  D: 28.274,    // buffer limit
  get E() { return this.C + this.B / (this.C * Math.PI); },
  get F() { return this.A * this.C / this.E; },
  get G() { return (this.B - (this.C + 1)) / this.B; }, // saturation threshold
};

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

class PGUMonitor {
  constructor(config = {}) {
    this._limit  = config.limit ?? _C.D;
    this.total   = 0;
    this.history = [];
    this.satRatio = config.saturationThreshold ?? _C.G;
  }

  add(penetrationRate, label = '') {
    const contribution = penetrationRate * this._limit;
    this.total += contribution;
    this.history.push({ label, rate: penetrationRate, contribution, total: this.total });
    return this.status();
  }

  status() {
    const ratio    = this.total / this._limit;
    let level = 'SAFE';
    if (ratio >= 1.0)           level = 'OVERLOAD';
    else if (ratio >= this.satRatio) level = 'WARNING';
    else if (ratio >= 0.7)      level = 'CAUTION';
    return {
      total: this.total,
      ratio,
      saturationThreshold: this.satRatio,
      overloadThreshold: 1.0,
      level,
      isOverload: ratio >= 1.0,
      marginToOverload: Math.max(0, 1.0 - ratio),
    };
  }

  reset() { this.total = 0; this.history = []; }
}

class OmegaLoop {
  constructor() {
    this._a    = _C.A;
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
    let phase = 'PHASE_A';
    if (this.zeta <= this._a * 1.5 && active) phase = 'STABLE_PHASE';
    if (this.zeta >  this._a * 1.5)           phase = 'UNSTABLE';
    return { omega: this.omega, zeta: this.zeta, dOmegaDt, active, phase, isHealthy: phase === 'STABLE_PHASE' };
  }
}

class PandoraCore {
  constructor(config = {}) {
    this.rho            = 1.0;
    this.omega          = 1.0;
    this.phi            = 0;
    this.recoveryRate   = config.recoveryRate   ?? 0.05;
    this.ethicsWeight   = config.ethicsWeight   ?? 1.3;
    this.externalWeight = config.externalWeight ?? 0.7;
  }

  _classify(zeta, external, theory) {
    if (zeta < 0.5)                            return 'SAFE';
    if (theory > 0.7 && zeta > 1.0)           return 'HIGH_DEVIATION';
    if (external > 0.7 && theory < 0.4)       return 'UNEXPECTED_PATTERN';
    if (theory > 0.6)                          return 'RULE_DEVIATION';
    return 'WARNING';
  }

  _recover(zeta) {
    const recoveryForce = this.recoveryRate * zeta;
    this.omega = Math.min(1.0, this.omega + recoveryForce);
  }

  process(vector) {
    const { external = 0, theory = 0 } = vector;
    const I        = external * this.externalWeight + theory * this.ethicsWeight;
    const dt       = 1.0 / (this.rho + I);
    const deltaPsi = (_C.A * theory + 0.0386) / (this.rho + I) * dt;
    const zeta     = Math.max(0, (Math.abs(deltaPsi) / 0.1555) - 1);
    const dOmega   = this.omega * (Math.exp(-_C.A) - Math.exp(_C.A) * zeta);
    this.omega      = Math.max(0, this.omega + dOmega * dt);
    this.phi       += (external + theory) * 0.1;

    const category  = this._classify(zeta, external, theory);
    const isSlapped = zeta > _C.A * 1.5;
    const isOverload = this.phi > _C.D;
    const isHealthy = this.omega > 0.5 && !isSlapped;

    if (isSlapped)  this._recover(zeta);
    if (!isHealthy) this.rho += _C.A;

    let status = 'STABLE_PHASE';
    if (category === 'SAFE')    status = 'PHASE_A';
    if (category === 'WARNING') status = 'WARNING';
    if (isSlapped)              status = 'RECOVERY_NEEDED';
    if (isOverload)             status = 'OVERLOAD';

    const severity = Math.min(1, zeta);

    return {
      status,
      category,
      severity:  Number(severity.toFixed(3)),
      omega:     Number(this.omega.toFixed(4)),
      zeta:      Number(zeta.toFixed(4)),
      phi:       Number(this.phi.toFixed(4)),
      integrity: isHealthy ? 'COMPLIANT' : 'VIOLATED',
      action:    isSlapped ? 'RECOVERING' : 'OBSERVE',
    };
  }

  reset() { this.rho = 1.0; this.omega = 1.0; this.phi = 0; }
}

class PandoraDefense {
  constructor(config = {}) {
    this.psi    = new DeltaPsiEngine(config);
    this.pgu    = new PGUMonitor(config);
    this.omega  = new OmegaLoop();
    this.core   = new PandoraCore(config);
    this.config = config;
    this._t     = 0;
  }

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

    const coreAlert = coreStatus
      ? coreStatus.status === 'RECOVERY_NEEDED' || coreStatus.status === 'OVERLOAD'
      : false;

    return {
      t:       this._t,
      deltaPsi,
      anomaly,
      pgu:     pguStatus,
      omega:   omegaStatus,
      core:    coreStatus,
      alert:   anomaly.isAlert || pguStatus.isOverload || !omegaStatus.isHealthy || coreAlert,
      level:   this._overallLevel(anomaly, pguStatus, omegaStatus, coreStatus),
      stats:   this.psi.stats(),
    };
  }

  _overallLevel(anomaly, pgu, omega, core) {
    if (pgu.isOverload || omega.phase === 'UNSTABLE')           return 'CRITICAL_OVERLOAD';
    if (anomaly.level === 'CRITICAL')                           return 'CRITICAL';
    if (core && core.status === 'RECOVERY_NEEDED')              return 'CRITICAL';
    if (core && core.category === 'RULE_DEVIATION')             return 'WARNING';
    if (core && core.category === 'UNEXPECTED_PATTERN')         return 'WARNING';
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
