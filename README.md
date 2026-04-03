# 🛡 Aspidos

**Hope Shield for Anomaly Systems**

Aspidos is a lightweight anomaly defense engine based on dynamic field modeling.

## Features

- Dynamic anomaly detection (ΔΨ)
- Accumulated risk model (PGU)
- Self-stability loop (Ω)

## Install

```bash
npm install aspidos
```

## Usage

```javascript
const { Aspidos } = require('aspidos');

const pd = new Aspidos();

// Basic analysis
const result = pd.analyze(0.7);
console.log(result.anomaly.level); // 'NORMAL' | 'WARNING' | 'CRITICAL'
console.log(result.alert);         // true | false

// With penetration rate
pd.analyze(0.9, { penetration: 0.2 });
console.log(pd.pgu.status().level); // 'SAFE' | 'CAUTION' | 'WARNING' | 'CLIFF'

// Loop health
console.log(result.omega.healthy); // true | false
```

## Alert Levels

| Level   | Meaning                  |
|---------|--------------------------|
| NORMAL  | No anomaly detected      |
| WARNING | Elevated risk            |
| CRITICAL| Immediate alert          |
| CLIFF   | System boundary exceeded |

## Architecture

```
Aspidos
├── DeltaPsiEngine  — dynamic anomaly scoring
├── PGUMonitor      — accumulated penetration risk
└── OmegaLoop       — self-stability monitoring
```

## License

MIT © @pandorapanchan1
