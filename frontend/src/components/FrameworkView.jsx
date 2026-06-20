import React from 'react'
import { LayersIcon } from './icons.jsx'

export default function FrameworkView({ framework, loading }) {
  if (loading) {
    return (
      <div className="card card-body">
        <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '60%' }} />
      </div>
    )
  }

  const fw = framework || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div className="card">
        <div className="card-body">
          <div className="section-label" style={{ marginBottom: 8 }}>System Architecture</div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>{fw.title}</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.7, maxWidth: 760 }}>{fw.novelty}</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {(fw.components || []).map((c) => (
          <div className="card" key={c.id}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="kpi-icon tone-accent"><LayersIcon width={16} height={16} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                  <div className="badge accent" style={{ marginTop: 4 }}>{c.method}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>{c.role}</div>
              <div style={{
                fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.6, borderTop: '1px solid var(--border)',
                paddingTop: 10, marginTop: 4,
              }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Why it matters: </span>
                {c.why_novel}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="section-label" style={{ marginBottom: 8 }}>Positioning</div>
          <p style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.7, maxWidth: 760, margin: 0 }}>
            {fw.positioning}
          </p>
        </div>
      </div>
    </div>
  )
}
