import React from 'react'
import {
  ActivityIcon, AlertIcon, ChartIcon, CheckCircleIcon, TargetIcon, ZapIcon, ClockIcon,
} from './icons.jsx'

function f1Tone(f1) {
  if (f1 > 0.7) return 'green'
  if (f1 >= 0.4) return 'yellow'
  return 'red'
}

function latencyTone(ms) {
  if (ms < 5) return 'green'
  if (ms <= 20) return 'yellow'
  return 'red'
}

function Kpi({ icon: Icon, tone, label, value, foot }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className={`kpi-icon tone-${tone}`}>
          <Icon width={18} height={18} />
        </div>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {foot && <div className="kpi-foot">{foot}</div>}
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
      </div>
      <div className="skeleton" style={{ width: '60%', height: 12 }} />
      <div className="skeleton" style={{ width: '40%', height: 26 }} />
    </div>
  )
}

export default function StatsBar({ liveMetrics, loading }) {
  if (loading) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 7 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    )
  }

  const lm = liveMetrics || {}
  const latencyHistory = lm.latency_history || []
  const avgLatency = latencyHistory.length
    ? latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length
    : 0

  return (
    <div className="kpi-grid">
      <Kpi
        icon={ActivityIcon}
        tone="accent"
        label="Total Processed"
        value={(lm.total_processed ?? 0).toLocaleString()}
        foot="Transactions scored"
      />
      <Kpi
        icon={AlertIcon}
        tone="red"
        label="Flagged for Review"
        value={(lm.total_flagged ?? 0).toLocaleString()}
        foot="Above risk threshold"
      />
      <Kpi
        icon={ChartIcon}
        tone="yellow"
        label="Fraud Rate"
        value={`${((lm.fraud_rate ?? 0) * 100).toFixed(2)}%`}
        foot="Of processed volume"
      />
      <Kpi
        icon={CheckCircleIcon}
        tone="green"
        label="Confirmed Frauds"
        value={(lm.confirmed_frauds ?? 0).toLocaleString()}
        foot="Analyst-confirmed"
      />
      <Kpi
        icon={TargetIcon}
        tone="grey"
        label="Risk Threshold"
        value={(lm.current_threshold ?? 0).toFixed(2)}
        foot="Adaptive fusion cutoff"
      />
      <Kpi
        icon={ZapIcon}
        tone={f1Tone(lm.live_f1 ?? 0)}
        label="Live F1 Score"
        value={(lm.live_f1 ?? 0).toFixed(2)}
        foot="From analyst feedback"
      />
      <Kpi
        icon={ClockIcon}
        tone={latencyTone(avgLatency)}
        label="Avg. Latency"
        value={`${avgLatency.toFixed(2)} ms`}
        foot="Per-transaction scoring"
      />
    </div>
  )
}
