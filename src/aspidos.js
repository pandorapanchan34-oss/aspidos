'use strict';

/**
 * Aspidos Core (Pandora Defense Lite)
 * Hope Shield for Anomaly Systems
 */

const _C = {
  A: 0.11937,
  D: 28.274,
  get G() { return 0.85; } // 簡略化（公開用）
};

// ── DeltaPsiEngine ──
class DeltaPsiEngine {
  constructor(config = {}) {
    this.alpha      = config.alpha ?? 1.0;
    this.lambda     = config.lambda ?? 0.0386;
    this.kappa      = config.kappa ?? 1.0;
    this.tau0       = config.tau0 ?? 1000;
    this.windowSize = config.windowSize ?? 100;

    this.baseline = { mu: 0.15, sigma2: 0.04 };

    this._history = [];
    this._rho = 1.0;
  }

  _localDeltaT(rho, I) {
    const denom = Math.max(rho + (I ?? 0), 0.01);
    return this.tau0 / (this.kappa * denom);
  }

  _updateBaseline() {
    const n = this._history.length;
    if (n < 10) return;

    const mean = this._history.reduce((a, b) => a + b, 0) / n;
    const variance = this._history.reduce((a, b) => a + (b - mean) ** 2, 0) / n;

    this.baseline.mu = mean;
    this.baseline.sigma2 = variance;
  }

  compute(obs, rho = null, I = null) {
    const r = rho ?? this._rho;
    const dt = this._localDeltaT(r, I);

    let deltaPsi = (this.alpha * obs + this.lambda) / Math.max(r, 0.01) * dt;

    // 軽いノイズ（公開用）
    deltaPsi *= (0.99 + Math.random() * 0.02);

    this._history.push(deltaPsi);
    if (this._history.length > this.windowSize) this._history.shift();

    this._updateBaseline();

    return deltaPsi;
  }

  anomalyScore(deltaPsi) {
    const mu = this.baseline.mu;
    const sigma = Math.sqrt(this.baseline.sigma2);

    const threshold = (mu + 3 * sigma) * (1 + Math.random() * 0.03);

    const abs = Math.abs(deltaPsi);
    const score = abs / threshold;

    return {
      score,
      isAlert: abs > threshold,
      level: abs > threshold ? 'CRITICAL' : (score > 0.7 ? 'WARNING' : 'NORMAL')
    };
  }
}

// ── PGU ──
class PGUMonitor {
  constructor() {
    this.total = 0;
    this.limit = _C.D;
    this.decay = 0.99;
  }

  add(rate) {
    this.total *= this.decay;
    this.total += rate * this.limit;
    return this.status();
  }

  status() {
    const ratio = this.total / this.limit;

    let level = 'SAFE';
    if (ratio >= 1) level = 'CLIFF';
    else if (ratio >= _C.G) level = 'WARNING';
    else if (ratio >= 0.7) level = 'CAUTION';

    return { ratio, level, isCliff: ratio >= 1 };
  }
}

// ── Omega ──
class OmegaLoop {
  constructor() {
    this.omega = 1;
  }

  update(zeta) {
    const d = this.omega * (Math.exp(-_C.A) - Math.exp(_C.A) * zeta);
    this.omega = Math.max(0, this.omega + d * 0.001);

    return {
      omega: this.omega,
      healthy: d > 0
    };
  }
}

// ── Main ──
class Aspidos {
  constructor() {
    this.psi = new DeltaPsiEngine();
    this.pgu = new PGUMonitor();
    this.omega = new OmegaLoop();
  }

  analyze(v, opts = {}) {
    const d = this.psi.compute(v);
    const a = this.psi.anomalyScore(d);

    const p = opts.penetration ? this.pgu.add(opts.penetration) : this.pgu.status();
    const z = Math.max(0, a.score - 1);
    const o = this.omega.update(z);

    return {
      deltaPsi: d,
      anomaly: a,
      pgu: p,
      omega: o,
      alert: a.isAlert || p.isCliff || !o.healthy
    };
  }
}

module.exports = { Aspidos };
