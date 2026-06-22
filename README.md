# FraudSense

A real-time credit card fraud detection engine. It combines a supervised Random Forest model, a set of hand-written domain rules, and a feedback loop that lets analysts correct the system as it runs.

It's built on the Kaggle Credit Card Fraud Detection dataset (284,807 original transactions, balanced and expanded to ~568,000 here, with roughly 0.17% fraud in the raw data).

## How it works

Every transaction goes through three layers before it gets a final score.

1. **ML layer.** A Random Forest classifier trained on 70% of the dataset, scoring each transaction by its predicted probability of being fraud. The decision threshold was tuned so precision stays at or above 95% on the held-out test split.
2. **Rule layer.** A few simple, deterministic banking rules — things like flagging unusually large amounts or transactions happening late at night. These catch patterns the model might miss.
3. **Fusion layer.** The two scores get combined: `fusion_score = 0.6 * ml_score + 0.4 * rule_score`. A transaction is flagged when this score crosses the current threshold (it starts at 0.6 and adjusts over time).

On top of that, there's a feedback loop: when an analyst confirms a flagged transaction was fraud, nothing changes. When they mark it as a false positive, the threshold goes up slightly (the system gets stricter). When they catch a missed fraud, the threshold goes down (the system gets more sensitive).

### Random Forest setup

- 200 trees, class weighting set to "balanced" to deal with how rare fraud actually is
- Trained on a 70/30 stratified split, so the reported numbers come from data the model never saw during training
- The threshold isn't arbitrary — it's the highest value that still keeps recall as high as possible while precision stays above 95%

### Rule layer

| Rule | Trigger | Risk added |
|---|---|---|
| High-value amount | Amount > $2,000 | +0.5 |
| Elevated amount | Amount > $500 | +0.2 |
| Off-hours | Between 12am and 5am | +0.3 |

### Risk level vs. flagged status

These are two different things and it's easy to mix them up. The "Risk Level" badge (Low / Medium / High) you see in the dashboard is just a fixed label based on the fusion score:

| Fusion score | Risk level |
|---|---|
| above 0.7 | High |
| 0.4 to 0.7 | Medium |
| below 0.4 | Low |

Whether a transaction is actually flagged as fraud is a separate decision — it depends on the *current* adaptive threshold, which moves around based on analyst feedback. So you might see a transaction labeled "High" risk that still shows up as "Cleared," because the threshold has climbed above 0.7 after analysts corrected a bunch of false positives. That's expected behavior, not a bug.

### What it's actually looking at

This scores transactions across an entire stream, not per individual customer. Each transaction is sampled independently — the model has no memory of "this card's history." It's scoring based purely on the transaction's own features (amount, time of day, and 28 anonymized PCA features from the original dataset). Tracking individual account behavior over time would be a meaningful next step, but it isn't built yet.

## Benchmark results

These numbers come from a 30% held-out test split, computed once at startup.

| Metric | Value |
|---|---|
| Precision | 95.61% |
| Recall | 73.65% |
| F1 score | 83.21% |
| ROC-AUC | 94.80% |
| Test samples | 85,443 |
| Fraud samples in test set | 148 (0.17%) |

Confusion matrix:

| | Predicted fraud | Predicted normal |
|---|---|---|
| Actual fraud | TP: 109 | FN: 39 |
| Actual normal | FP: 5 | TN: 85,290 |

## Tech stack

- **ML:** scikit-learn (RandomForestClassifier, StandardScaler)
- **Backend:** FastAPI + Uvicorn
- **Frontend:** React 18 + Vite
- **Charts:** Recharts
- **Dataset:** Kaggle Credit Card Fraud Detection (`creditcard_balanced.csv`)

## Project structure

```
FraudSense/
├── backend/
│   ├── main.py                      FastAPI app, model training, scoring logic
│   ├── data/
│   │   └── creditcard_balanced.csv  dataset (not checked in — download separately)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  root component, data fetching, page routing
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatsBar.jsx         KPI cards
│   │   │   ├── TransactionFeed.jsx  scored transaction table
│   │   │   ├── MetricsDashboard.jsx confusion matrix, ROC curve, latency chart
│   │   │   ├── FrameworkView.jsx    architecture breakdown
│   │   │   └── icons.jsx
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
├── run.sh
└── README.md
```

## Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/sanjay-gif245/FraudSense.git
   cd FraudSense
   ```

2. Download the dataset. The CSV is too large for the repo itself, so it's hosted separately:

   [Download creditcard_balanced.csv (GitHub Releases)](https://github.com/sanjay-gif245/FraudSense/releases/tag/v1.0)

   Place it at `backend/data/creditcard_balanced.csv`. If it's missing, the app still runs using a small synthetic dataset, but the benchmark numbers won't match the ones above.

3. Install the backend:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate   # on Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Install the frontend:
   ```bash
   cd frontend
   npm install
   ```

## Running it

**Easiest way:**

```bash
./run.sh
```

This starts the backend, waits until it's actually ready, then starts the frontend — all in one terminal. Ctrl+C stops both.

**Manual way**, if you'd rather run things yourself — you need two terminals open at once:

Terminal 1:
```bash
cd backend
.venv/bin/uvicorn main:app --reload --port 8000
```
Wait for `Application startup complete` before moving on — with the full dataset, training takes 30-60 seconds. Opening the frontend before this finishes is the most common cause of "connection lost" errors.

Terminal 2:
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173.

### If you see "Connection lost" or ECONNREFUSED

This just means the frontend is running but the backend isn't reachable. Usually it's one of:

- You only started the frontend and forgot the backend — check you have a second terminal running uvicorn
- The backend is still loading — check for `Application startup complete` in its terminal
- The backend crashed — look for a Python traceback, which is usually caused by a missing `requirements.txt` install or the dataset CSV not being where it's expected
- Just use `./run.sh` instead — it handles the ordering for you

## Dashboard pages

| Page | What it shows |
|---|---|
| Overview | Live KPI cards and a recent transaction feed |
| Transaction Stream | The full rolling feed of scored transactions, with review buttons |
| Fraud Detected | Two sections — transactions currently flagged, and transactions cleared after review |
| Model Metrics | Confusion matrix, ROC curve, latency distribution |
| Architecture | A breakdown of how the ML, rule, and fusion layers fit together |

## API endpoints

| Method | Endpoint | What it does |
|---|---|---|
| GET | /transaction | Scores a new transaction sampled from the dataset |
| POST | /feedback | Submits an analyst's verdict on a flagged transaction |
| GET | /stats | Live metrics plus the static benchmark metrics |
| GET | /framework | Describes the architecture components |
| GET | /benchmark | Runs a 1,000-transaction throughput test |
| GET | /feature-importances | Returns feature importance scores |
| GET | /health | Health check |

## Ideas for later

- Run the scoring pipeline on PySpark for higher throughput
- Try XGBoost or LightGBM against the current Random Forest
- Add SHAP explanations so individual decisions are easier to justify
- Move from in-memory state to a real database (Postgres) for analyst decisions and audit history
- Send alerts over email or Slack for critical flags
- Track each cardholder's own transaction history instead of scoring everything independently — this would let the system catch things that are unusual *for that specific account*, not just unusual in general
