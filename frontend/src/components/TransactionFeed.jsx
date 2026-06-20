import React from 'react'
import { InboxIcon, WifiOffIcon } from './icons.jsx'

function riskTone(score) {
  if (score > 0.7) return 'red'
  if (score > 0.4) return 'yellow'
  return 'green'
}

function riskLabel(score) {
  if (score > 0.7) return 'High'
  if (score > 0.4) return 'Medium'
  return 'Low'
}

function timeAgo() {
  return 'just now'
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i}><div className="skeleton" style={{ height: 14, width: i === 0 ? 90 : 50 }} /></td>
      ))}
    </tr>
  )
}

export default function TransactionFeed({
  transactions, onFeedback, loading, error,
  emptyTitle = 'No transactions yet',
  emptyDesc = "New transactions will appear here automatically as they're scored by the pipeline.",
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-text">
          <div className="title">Live Transaction Stream</div>
          <div className="subtitle">Sampled from the production dataset and scored in real time</div>
        </div>
        <span className="badge accent">
          <span className="pulse-dot" />
          Streaming
        </span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Amount</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Analyst Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && !error && transactions.map((t) => (
              <tr key={t.id}>
                <td className="mono cell-faint">{t.id.slice(0, 8)}…</td>
                <td className="mono cell-strong">
                  ${t.Amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="mono">{t.fusion_score.toFixed(3)}</td>
                <td>
                  <span className={`badge ${riskTone(t.fusion_score)}`}>
                    <span className="dot" />
                    {riskLabel(t.fusion_score)}
                  </span>
                </td>
                <td>
                  {t.is_flagged
                    ? <span className="badge red">Flagged</span>
                    : <span className="badge green">Cleared</span>}
                </td>
                <td className="mono cell-faint">{t.latency_ms.toFixed(2)} ms</td>
                <td>
                  {t.is_flagged && !t.feedbackGiven && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-danger btn-sm" onClick={() => onFeedback(t.id, true)}>Confirm Fraud</button>
                      <button className="btn btn-success btn-sm" onClick={() => onFeedback(t.id, false)}>Mark OK</button>
                    </div>
                  )}
                  {t.is_flagged && t.feedbackGiven && (
                    <span className="badge grey">Reviewed</span>
                  )}
                  {!t.is_flagged && <span className="cell-faint">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && !error && transactions.length === 0 && (
        <div className="state-block">
          <div className="state-icon"><InboxIcon /></div>
          <div className="state-title">{emptyTitle}</div>
          <div className="state-desc">{emptyDesc}</div>
        </div>
      )}

      {error && (
        <div className="state-block error">
          <div className="state-icon"><WifiOffIcon /></div>
          <div className="state-title">Unable to reach the scoring service</div>
          <div className="state-desc">{error}</div>
        </div>
      )}
    </div>
  )
}
