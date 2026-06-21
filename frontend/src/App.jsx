import React, { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import StatsBar from './components/StatsBar.jsx'
import TransactionFeed from './components/TransactionFeed.jsx'
import MetricsDashboard from './components/MetricsDashboard.jsx'
import FrameworkView from './components/FrameworkView.jsx'
import { ChartIcon, ShieldIcon, RefreshIcon } from './components/icons.jsx'

const API = '/api'

const PAGE_META = {
  overview: {
    title: 'Overview',
    subtitle: 'Real-time fraud detection pipeline health',
  },
  transactions: {
    title: 'Transaction Stream',
    subtitle: 'Live scoring feed with analyst review queue',
  },
  frauds: {
    title: 'Fraud Detected',
    subtitle: 'Transactions flagged as high risk by the scoring pipeline',
  },
  metrics: {
    title: 'Model Metrics',
    subtitle: 'Benchmarked performance on the evaluation dataset',
  },
  framework: {
    title: 'Architecture',
    subtitle: 'Hybrid detection framework components',
  },
}

export default function App() {
  const [stats, setStats] = useState(null)
  const [framework, setFramework] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [flaggedTransactions, setFlaggedTransactions] = useState([])
  const [clearedTransactions, setClearedTransactions] = useState([])
  const [showMetrics, setShowMetrics] = useState(false)
  const [activePage, setActivePage] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = () => {
      fetch(`${API}/stats`)
        .then((r) => {
          if (!r.ok) throw new Error('Stats request failed')
          return r.json()
        })
        .then((d) => { setStats(d); setError(null) })
        .catch(() => setError('The fraud detection service is unreachable. Make sure the backend is running on port 8000.'))
    }
    const fetchTransaction = () => {
      fetch(`${API}/transaction`)
        .then((r) => {
          if (!r.ok) throw new Error('Transaction request failed')
          return r.json()
        })
        .then((txn) => {
          const entry = { ...txn, feedbackGiven: false }
          setTransactions((prev) => [entry, ...prev].slice(0, 50))
          if (txn.is_flagged) {
            setFlaggedTransactions((prev) => [entry, ...prev])
          } else {
            setClearedTransactions((prev) => [entry, ...prev].slice(0, 50))
          }
          setError(null)
          setLoading(false)
        })
        .catch(() => {
          setError('The fraud detection service is unreachable. Make sure the backend is running on port 8000.')
          setLoading(false)
        })
    }

    fetch(`${API}/framework`).then((r) => r.json()).then(setFramework).catch(() => {})

    fetchStats()
    fetchTransaction()
    const statsInterval = setInterval(fetchStats, 3000)
    const txnInterval = setInterval(fetchTransaction, 2000)
    return () => {
      clearInterval(statsInterval)
      clearInterval(txnInterval)
    }
  }, [])

  const handleFeedback = (id, actualFraud) => {
    fetch(`${API}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: id, actual_fraud: actualFraud }),
    }).then(() => {
      const markReviewed = (t) => (t.id === id ? { ...t, feedbackGiven: true } : t)
      setTransactions((prev) => prev.map(markReviewed))
      setFlaggedTransactions((prev) => prev.map(markReviewed))
    })
  }

  const meta = PAGE_META[activePage]

  return (
    <div className="app-shell">
      <Sidebar active={activePage} onNavigate={setActivePage} />

      <div className="main-col">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">{meta.title}</div>
            <div className="topbar-subtitle">
              {error ? (
                <>
                  <span className="badge red" style={{ padding: '2px 8px' }}><span className="dot" />Offline</span>
                  {meta.subtitle}
                </>
              ) : (
                <>
                  <span className="pulse-dot" />
                  {meta.subtitle}
                </>
              )}
            </div>
          </div>
          <div className="topbar-right">
            <span className="badge accent">
              <ShieldIcon width={13} height={13} />
              Model: Random Forest
            </span>
            <button className="btn btn-primary" onClick={() => setShowMetrics(true)}>
              <ChartIcon width={15} height={15} />
              View Full Metrics
            </button>
          </div>
        </header>

        <main className="page-content">
          {error && (
            <div className="card">
              <div className="state-block error">
                <div className="state-icon"><RefreshIcon /></div>
                <div className="state-title">Connection lost</div>
                <div className="state-desc">{error}</div>
              </div>
            </div>
          )}

          {activePage === 'overview' && (
            <>
              <StatsBar liveMetrics={stats?.live_metrics} loading={loading && !error} />
              <TransactionFeed
                transactions={transactions.slice(0, 8)}
                onFeedback={handleFeedback}
                loading={loading && !error}
                error={null}
              />
            </>
          )}

          {activePage === 'transactions' && (
            <TransactionFeed
              transactions={transactions}
              onFeedback={handleFeedback}
              loading={loading && !error}
              error={null}
            />
          )}

          {activePage === 'frauds' && (
            <>
              <TransactionFeed
                transactions={flaggedTransactions}
                onFeedback={handleFeedback}
                loading={loading && !error}
                error={null}
                title="Detected as Fraud"
                subtitle="Transactions flagged as high risk by the scoring pipeline"
                badgeLabel="Flagged"
                badgeTone="red"
                emptyTitle="No fraud flags yet"
                emptyDesc="High-risk transactions identified by the model will be listed here for analyst review."
              />
              <TransactionFeed
                transactions={clearedTransactions}
                onFeedback={handleFeedback}
                loading={loading && !error}
                error={null}
                title="Cleared (Legitimate)"
                subtitle="Transactions scored below the fraud threshold and treated as legal"
                badgeLabel="Cleared"
                badgeTone="green"
                emptyTitle="No cleared transactions yet"
                emptyDesc="Transactions scored as legitimate by the pipeline will be listed here."
              />
            </>
          )}

          {activePage === 'metrics' && (
            <div className="kpi-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="card">
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div className="title" style={{ fontSize: 15, marginBottom: 4 }}>Full benchmark report</div>
                    <div className="subtitle">Confusion matrix, ROC curve, and latency distribution computed from the evaluation dataset.</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowMetrics(true)}>
                    <ChartIcon width={15} height={15} />
                    Open Report
                  </button>
                </div>
              </div>
              <StatsBar liveMetrics={stats?.live_metrics} loading={loading && !error} />
            </div>
          )}

          {activePage === 'framework' && (
            <FrameworkView framework={framework} loading={!framework && !error} />
          )}
        </main>
      </div>

      {showMetrics && (
        <MetricsDashboard
          benchmarkMetrics={stats?.benchmark_metrics}
          latencyHistory={stats?.live_metrics?.latency_history}
          onClose={() => setShowMetrics(false)}
        />
      )}
    </div>
  )
}
