import React from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { XIcon, ChartIcon } from './icons.jsx'

function metricTone(value, kind) {
  if (kind === 'auc') {
    if (value > 0.9) return 'var(--green)'
    if (value >= 0.8) return 'var(--yellow)'
    return 'var(--red)'
  }
  if (value > 0.8) return 'var(--green)'
  if (value >= 0.6) return 'var(--yellow)'
  return 'var(--red)'
}

function latencyBucketColor(avg) {
  if (avg < 5) return 'var(--green)'
  if (avg <= 20) return 'var(--yellow)'
  return 'var(--red)'
}

function buildHistogram(latencyHistory) {
  if (!latencyHistory || latencyHistory.length === 0) return []
  const min = Math.min(...latencyHistory)
  const max = Math.max(...latencyHistory)
  const binCount = 10
  const range = max - min || 1
  const binSize = range / binCount
  const bins = Array.from({ length: binCount }, (_, i) => ({
    label: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
    count: 0,
    mid: min + (i + 0.5) * binSize,
  }))
  latencyHistory.forEach((v) => {
    let idx = Math.floor((v - min) / binSize)
    if (idx >= binCount) idx = binCount - 1
    if (idx < 0) idx = 0
    bins[idx].count += 1
  })
  return bins
}

function percentile(arr, p) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

const ConfusionCell = ({ label, sub, value, bg, fg = '#102A43' }) => (
  <div className="confusion-cell" style={{ background: bg, color: fg }}>
    <div className="confusion-label">{label}</div>
    <div className="confusion-sub">({sub})</div>
    <div className="confusion-value">{value.toLocaleString()}</div>
  </div>
)

export default function MetricsDashboard({ benchmarkMetrics, latencyHistory, onClose }) {
  const bm = benchmarkMetrics || {}
  const cm = bm.confusion_matrix || { TP: 0, FP: 0, TN: 0, FN: 0 }

  const fpr = bm.false_positive_rate ?? 0
  const recall = bm.recall ?? 0
  const rocPoints = [
    { x: 0, y: 0 },
    { x: fpr, y: recall },
    { x: 1, y: 1 },
  ]
  const diagonalPoints = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ]

  const hist = buildHistogram(latencyHistory)
  const lh = latencyHistory || []
  const mean = lh.length ? lh.reduce((a, b) => a + b, 0) / lh.length : 0
  const median = percentile(lh, 50)
  const p95 = percentile(lh, 95)
  const p99 = percentile(lh, 99)

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} />
      <div className="slide-panel">
        <div className="slide-panel-header">
          <div className="card-header-text">
            <div className="title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChartIcon width={18} height={18} /> Model Performance Report
            </div>
            <div className="subtitle">Benchmarked against the full evaluation dataset at startup</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <XIcon width={16} height={16} /> Close
          </button>
        </div>

        <div className="page-content">
          {/* Section 1 - Dataset Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-text">
                <div className="title">Benchmark Dataset</div>
                <div className="subtitle">Computed once at startup — static for the lifetime of this session</div>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="metric-cell" style={{ textAlign: 'left' }}>
                <div className="label">Dataset</div>
                <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{bm.dataset}</div>
              </div>
              <div className="metric-cell">
                <div className="label">Total Samples</div>
                <div className="value">{(bm.total_samples ?? 0).toLocaleString()}</div>
              </div>
              <div className="metric-cell">
                <div className="label">Fraud Samples</div>
                <div className="value">{(bm.fraud_samples ?? 0).toLocaleString()}</div>
              </div>
              <div className="metric-cell">
                <div className="label">Fraud Prevalence</div>
                <div className="value">{(bm.fraud_prevalence_pct ?? 0).toFixed(4)}%</div>
              </div>
            </div>
          </div>

          {/* Section 2 - Confusion Matrix */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-text">
                <div className="title">Confusion Matrix</div>
                <div className="subtitle">Model predictions vs. ground-truth labels</div>
              </div>
            </div>
            <div className="card-body">
              <div className="confusion-grid">
                <div />
                <div className="confusion-axis-label">Actual Fraud</div>
                <div className="confusion-axis-label">Actual Normal</div>

                <div className="confusion-axis-label">Predicted Fraud</div>
                <ConfusionCell label="TRUE POSITIVE" sub="TP" value={cm.TP} bg="var(--green)" />
                <ConfusionCell label="FALSE POSITIVE" sub="FP" value={cm.FP} bg="var(--red)" />

                <div className="confusion-axis-label">Predicted Normal</div>
                <ConfusionCell label="FALSE NEGATIVE" sub="FN" value={cm.FN} bg="var(--yellow)" />
                <ConfusionCell label="TRUE NEGATIVE" sub="TN" value={cm.TN} bg="var(--grey)" />
              </div>
            </div>
          </div>

          {/* Section 3 - Core Metrics */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-text">
                <div className="title">Core Metrics</div>
                <div className="subtitle">Precision, recall, F1, and ranking quality (ROC-AUC)</div>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                ['PRECISION', bm.precision, 'std'],
                ['RECALL', bm.recall, 'std'],
                ['F1 SCORE', bm.f1_score, 'std'],
                ['ROC-AUC', bm.roc_auc, 'auc'],
              ].map(([label, value, kind]) => (
                <div key={label} className="metric-cell">
                  <div className="label">{label}</div>
                  <div className="value" style={{ color: metricTone(value ?? 0, kind) }}>
                    {(value ?? 0).toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 - ROC Curve */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-text">
                <div className="title">ROC Curve</div>
                <div className="subtitle">Approximate — full curve requires per-threshold data</div>
              </div>
            </div>
            <div className="card-body" style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 12, left: 56, fontSize: 13, color: 'var(--accent)',
                fontFamily: 'JetBrains Mono, monospace', zIndex: 2, fontWeight: 700,
              }}>
                AUC = {(bm.roc_auc ?? 0).toFixed(4)}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={rocPoints} margin={{ top: 30, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="x" type="number" domain={[0, 1]} stroke="var(--text-faint)"
                    label={{ value: 'False Positive Rate', position: 'bottom', fill: 'var(--text-faint)' }} />
                  <YAxis dataKey="y" type="number" domain={[0, 1]} stroke="var(--text-faint)"
                    label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: 'var(--text-faint)' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Area type="linear" data={diagonalPoints} dataKey="y" stroke="var(--text-faint)" fill="none" strokeDasharray="4 4" />
                  <Area type="linear" dataKey="y" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.18} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 5 - Latency Distribution */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-text">
                <div className="title">Inference Latency Distribution</div>
                <div className="subtitle">Last {lh.length} live transactions</div>
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hist}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--text-faint)" tick={{ fontSize: 10 }}
                    label={{ value: 'Latency (ms)', position: 'bottom', fill: 'var(--text-faint)' }} />
                  <YAxis stroke="var(--text-faint)" allowDecimals={false}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: 'var(--text-faint)' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {hist.map((entry, i) => (
                      <Cell key={i} fill={latencyBucketColor(entry.mid)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mono" style={{ marginTop: 12, fontSize: 13, color: 'var(--text-dim)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>Mean: <strong style={{ color: 'var(--text)' }}>{mean.toFixed(2)}ms</strong></span>
                <span>Median: <strong style={{ color: 'var(--text)' }}>{median.toFixed(2)}ms</strong></span>
                <span>P95: <strong style={{ color: 'var(--text)' }}>{p95.toFixed(2)}ms</strong></span>
                <span>P99: <strong style={{ color: 'var(--text)' }}>{p99.toFixed(2)}ms</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
