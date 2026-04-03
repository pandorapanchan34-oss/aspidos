# Aspidos

**🛡 Aspidos**  
**Hope Shield for Anomaly Systems**

> **Aspidosは攻撃ツールではありません。**  
> **システムの安定性を守るための数学的盾です。**

システムが静かに壊れていくのを、ただ見ているだけじゃない。  
Aspidosは異常を「歪み」として捉え、**リスクを蓄積しながらシステムを積極的に安定化**させる軽量な防御エンジンです。

## 哲学（Philosophy）

> Anomalies are not errors.  
> They are distortions in a system trying to remain stable.  
> **We do not just detect them.**  
> **We hold the system together.**

**Not detection. Stabilization.**

## 主な用途

- **既存セキュリティの追加レイヤー**として  
- **リアルタイム異常安定化**  
- クリティカルシステム監視  
- Security monitoring systems  
- AI behavior anomaly detection  
- Real-time system health tracking  
- Critical infrastructure monitoring

## 特徴（Features）

- **ΔΨ Engine** — 動的フィールドの歪みとして異常を検知  
- **PGU Model** — リスクの蓄積を連続的に管理し、危険な臨界点を予測  
- **Ω Loop** — 自己安定化フィードバックでシステムを守る  
- 極めて軽量で、すべて**固定値の数値計算**（決定論的・再現性が高い）  
- ブラウザでもNode.jsでもサクッと動く

## システムの流れ
![Aspidos](./assets/hero.png)

# 🛡 Aspidos

![logo](./assets/logo.png)

**Hope Shield for Anomaly Systems**

> When systems fail silently, Aspidos becomes the shield

🔥 Overview

Aspidos is a lightweight anomaly defense engine based on dynamic field modeling.

Unlike traditional systems that rely on fixed thresholds, Aspidos treats anomalies as:

«Distortions in a dynamic field»

---

🧠 Core Concept

Traditional systems:

- Detect anomalies using static thresholds

Aspidos:

- Models systems as a dynamic field
- Measures distortion (ΔΨ)
- Tracks accumulated risk (PGU)
- Maintains system stability (Ω)

---

⚙️ Features

ΔΨ Engine — Distortion Detection

Detect anomalies as distortions in a dynamic field rather than fixed thresholds.

PGU Model — Accumulated Risk Field

Continuously integrates risk and detects saturation leading to critical transitions.

Ω Loop — Self-Stability System

Maintains system stability through self-referential feedback dynamics.

Adaptive Behavior

Learns baseline behavior dynamically and adapts to changing environments.

Designed for Critical Systems

Built for environments where silent failure is unacceptable.

---

🧩 System Flow

ΔΨ (distortion) → PGU (accumulation) → Ω (stability)

         ┌────────────┐
         │   ΔΨ Engine │
         └─────┬──────┘
               ↓
         ┌────────────┐
         │    PGU     │
         └─────┬──────┘
               ↓
         ┌────────────┐
         │   Ω Loop    │
         └────────────┘

---

🚀 Installation

npm install

---

💻 Usage

const { Aspidos } = require('aspidos');

const pd = new Aspidos();

// Normal event
const result = pd.analyze(0.3);
console.log(result);

// Anomaly event
const alert = pd.analyze(0.9, { penetration: 0.2 });
console.log(alert);

---

🎯 What Makes It Different?

- Not rule-based
- Not threshold-dependent
- Not static

👉 Aspidos is:

«A dynamic state control system»

---

🧠 Philosophy

Aspidos is built on a simple idea:

Anomalies are not errors.
They are distortions in a system trying to remain stable.

We do not just detect them.

«We hold the system together.»

---

🛡 Use Cases

- Security monitoring systems
- AI behavior anomaly detection
- Real-time system health tracking
- Critical infrastructure monitoring

---

📦 Project Structure

/src        Core engine
/examples   Node.js examples
/demo       Browser demo

---

🧲 Keywords

anomaly-detection, cybersecurity, ai, complex-systems, control-theory

---

📄 License

MIT License

---

🌌 Final Note

Aspidos is not just a library.

It is a way to think about systems.

«Not detection. Stabilization.»
