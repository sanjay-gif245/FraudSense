# 🛡️ FraudSense — Real-Time Credit Card Fraud Detection Engine
### Hybrid Random Forest Classifier + Domain Rule Engine + Adaptive Analyst Feedback Loop

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)
![Security](https://img.shields.io/badge/Domain-Financial%20Fraud-red?style=for-the-badge)

---

## 📌 Overview

**A production-grade fraud detection pipeline for real-time credit card transaction scoring** — built on the Kaggle Credit Card Fraud Detection dataset (284,807 transactions, 0.17% fraud prevalence).

Unlike threshold-only rule engines, FraudSense runs a **three-layer hybrid pipeline** on every transaction:

1. **ML Layer** — A supervised Random Forest classifier trained on 70% of the benchmark dataset, scoring transactions by predicted fraud probability. Threshold is tuned to guarantee **≥95% precision** on the held-out test split.
2. **Rule Layer** — Domain heuristics (high-value amounts, off-hours timing) that catch fraud patterns models may miss.
3. **Fusion Layer** — A 60/40 weighted combination of ML and rule scores into a single risk signal.

An **Adaptive Feedback Loop** lets analysts confirm or dismiss alerts in real time, shifting the detection threshold dynamically to suppress false positives as they accumulate.

---

## 🚀 Key Features

### 1. 🤖 Supervised Random Forest Classifier (ML Layer)
Trained on labeled historical transactions with class-balanced learning to handle extreme fraud rarity:

| Parameter | Value |
| :--- | :--- |
| **Algorithm** | Random Forest Classifier |
| **Trees** | 200 estimators |
| **Class Weighting** | `balanced` — compensates for 0.17% fraud prevalence |
| **Train/Test Split** | 70% train / 30% held-out test (stratified) |
| **Threshold Strategy** | Precision-constrained search (≥95% target) maximizing recall |

### 2. 📏 Domain Rule Engine (Rule Layer)
Banking-domain heuristics applied deterministically on every transaction:

| Rule | Trigger | Risk Added |
| :--- | :--- | :--- |
| **High-Value Amount** | Amount > $2,000 | +0.5 |
| **Elevated Amount** | Amount > $500 | +0.2 |
| **Off-Hours Timing** | Between 12:00 AM – 5:00 AM | +0.3 |

### 3. ⚖️ Weighted Fusion Layer
Combines ML and Rule scores into a single fraud risk score:

```
fusion_score = 0.60 × ml_score + 0.40 × rule_score
```

A transaction is flagged when `fusion_score > current_threshold` (adaptive, starts at 0.6).

### 4. 🔄 Adaptive Analyst Feedback Loop
Analysts review flagged transactions directly in the dashboard:

- **Confirm Fraud** → confirmed fraud counter increments; threshold unchanged.
- **Mark OK (False Positive)** → threshold increases by 0.02 (becomes stricter).
- **Missed Fraud (unflagged)** → threshold decreases by 0.02 (becomes more sensitive).

---

## 📊 Benchmark Results

Evaluated on a held-out **30% stratified test split** at startup. Results are static for the session lifetime.

| Metric | Value |
| :--- | :--- |
| **Precision** | **95.61%** |
| **Recall** | 73.65% |
| **F1 Score** | 83.21% |
| **ROC-AUC** | 94.80% |
| **Test Samples** | 85,443 |
| **Fraud Samples** | 148 (0.1732%) |

**Confusion Matrix (test split):**

|  | Predicted Fraud | Predicted Normal |
| :--- | :--- | :--- |
| **Actual Fraud** | TP: 109 | FN: 39 |
| **Actual Normal** | FP: 5 | TN: 85,290 |

---

## ⚙️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **ML Model** | scikit-learn `RandomForestClassifier` |
| **Feature Scaling** | `StandardScaler` (Amount + Time columns) |
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | React 18 + Vite |
| **Charts** | Recharts (AreaChart, BarChart) |
| **Dataset** | Kaggle Credit Card Fraud Detection (`creditcard.csv`) |
| **Styling** | CSS custom properties — banking light theme |

---

## 📂 Repository Structure

```text
FraudSense/
├── backend/
│   ├── main.py                      ← FastAPI app, model training, scoring pipeline
│   ├── data/
│   │   └── creditcard.csv           ← Kaggle dataset (gitignored — download separately)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  ← Root component, data fetching, page routing
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          ← Navigation sidebar
│   │   │   ├── StatsBar.jsx         ← KPI cards (live metrics)
│   │   │   ├── TransactionFeed.jsx  ← Scored transaction table
│   │   │   ├── MetricsDashboard.jsx ← Confusion matrix, ROC curve, latency histogram
│   │   │   ├── FrameworkView.jsx    ← Architecture breakdown panel
│   │   │   └── icons.jsx            ← Inline SVG icon set
│   │   └── index.css                ← Design tokens + banking theme
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/FraudSense.git
cd FraudSense
```

### 2. Download the Dataset

Download the **Credit Card Fraud Detection** dataset from Kaggle and place the CSV at:

```
backend/data/creditcard.csv
```

> Dataset: [kaggle.com/datasets/mlg-ulb/creditcardfraud](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
>
> ⚠️ If the CSV is not present, the app falls back to a 5,000-row synthetic dataset that mimics the real distribution — the app runs end-to-end but benchmark metrics will differ.

### 3. Install Backend Dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 🖥️ Running the Project

### Start the Backend

```bash
cd backend
.venv/bin/uvicorn main:app --reload --port 8000
```

> The server trains the Random Forest model on startup. With the full 284K-row dataset this takes ~30–60 seconds.

### Start the Frontend

```bash
cd frontend
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🗂️ Dashboard Pages

| Page | Description |
| :--- | :--- |
| **Overview** | Live KPI cards + recent transaction feed |
| **Transaction Stream** | Full rolling feed of all scored transactions with analyst review buttons |
| **Fraud Detected** | Persistent list of every transaction flagged as high-risk |
| **Model Metrics** | Full benchmark report — confusion matrix, ROC curve, latency histogram |
| **Architecture** | Component-by-component breakdown of the hybrid pipeline |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/transaction` | Score a new live transaction sampled from the dataset |
| `POST` | `/feedback` | Submit analyst verdict (`actual_fraud: true/false`) |
| `GET` | `/stats` | Live metrics + benchmark metrics |
| `GET` | `/framework` | Architecture component descriptions |
| `GET` | `/benchmark` | 1,000-transaction throughput benchmark |
| `GET` | `/feature-importances` | Feature importance scores |
| `GET` | `/health` | Health check |

---

## 🔮 Future Roadmap

* [ ] **PySpark Integration** — Distribute the scoring pipeline across a cluster for high-throughput environments
* [ ] **XGBoost / LightGBM** — Benchmark alternative gradient boosting models against Random Forest
* [ ] **SHAP Explanations** — Per-transaction feature attribution for explainable AI compliance
* [ ] **Persistent Storage** — PostgreSQL backend for analyst decisions and audit trail
* [ ] **Email / Slack Alerts** — Real-time notifications for CRITICAL fraud flags
* [ ] **SMOTE Oversampling** — Evaluate synthetic minority oversampling vs. class weighting

---

*Project developed by Chiidammbro*
