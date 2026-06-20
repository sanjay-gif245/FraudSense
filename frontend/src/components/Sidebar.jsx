import React from 'react'
import {
  ShieldIcon, GridIcon, ListIcon, ChartIcon, LayersIcon, AlertIcon,
} from './icons.jsx'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: GridIcon },
  { id: 'transactions', label: 'Transaction Stream', icon: ListIcon },
  { id: 'frauds', label: 'Fraud Detected', icon: AlertIcon },
  { id: 'metrics', label: 'Model Metrics', icon: ChartIcon },
  { id: 'framework', label: 'Architecture', icon: LayersIcon },
]

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <ShieldIcon stroke="#0B2341" width={18} height={18} />
        </div>
        <div className="sidebar-brand-text">
          <span className="name">FraudSense</span>
          <span className="tag">FRAUD OPS CONSOLE</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Monitoring</div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="icon"><item.icon width={17} height={17} /></span>
            {item.label}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">AN</div>
          <div className="sidebar-user-text">
            <span className="uname">Fraud Analyst</span>
            <span className="urole">Tier 2 · Active session</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
