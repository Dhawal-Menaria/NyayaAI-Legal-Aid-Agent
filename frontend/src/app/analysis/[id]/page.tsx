// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const RISK = {
  high: { bg: 'var(--red)', label: 'High' },
  medium: { bg: 'var(--amber)', label: 'Medium' },
  low: { bg: 'var(--green)', label: 'Low' },
};
const STATUS = {
  compliant: { bg: 'var(--green)', label: 'Compliant' },
  violation: { bg: 'var(--red)', label: 'Violation' },
  unclear: { bg: 'var(--amber)', label: 'Unclear' },
};
const level = (s) => (s >= 70 ? ['High risk', 'r'] : s >= 40 ? ['Medium risk', 'a'] : ['Low risk', 'g']);
const norm = (v) => String(v || '').toLowerCase();

export default function Analysis() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch(`${API}/analysis/${id}`)
      .then((r) => { if (!r.ok) throw new Error(`Server replied ${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <main className="nb-wrap"><div className="nb-card r" style={{ fontWeight: 700 }}>⚠ {error}</div></main>;
  if (!data) return (
    <main className="nb-wrap">
      <h2 className="nb-h2">Agents are reading…</h2>
      <div className="nb-stripes" style={{ height: 24, border: '3px solid var(--ink)' }} />
    </main>
  );

  const score = Math.max(0, Math.min(100, Number(data.risk_score) || 0));
  const [lvlLabel, lvlColor] = level(score);
  const clauses = data.clauses || data.clauses_json || [];
  const compliance = data.compliance || data.compliance_json || [];
  const count = (k) => clauses.filter((c) => norm(c.risk_level) === k).length;
  const shown = filter === 'all' ? clauses : clauses.filter((c) => norm(c.risk_level) === filter);
  const filled = Math.round(score / 10);

  return (
    <main className="nb-wrap">
      <section className="nb-grid two" style={{ marginBottom: 36 }}>
        <div className={`nb-card ${lvlColor}`}>
          <span className="nb-tag">Risk score</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 104, fontWeight: 700, lineHeight: .9, letterSpacing: '-.05em' }}>{score}</span>
            <span style={{ fontSize: 26, fontWeight: 700 }}>/100</span>
          </div>
          <div className="nb-badge" style={{ marginTop: 10 }}>{lvlLabel}</div>
          <div className="nb-seg">
            {Array.from({ length: 10 }).map((_, i) => (
              <i key={i} style={{ background: i < filled ? 'var(--ink)' : '#fff' }} />
            ))}
          </div>
        </div>
        <div className="nb-card">
          <span className="nb-tag">The short version</span>
          <p style={{ fontSize: 19, margin: '4px 0 18px' }}>{data.summary || 'No summary returned.'}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="nb-badge" style={{ background: RISK.high.bg }}>{count('high')} high</span>
            <span className="nb-badge" style={{ background: RISK.medium.bg }}>{count('medium')} medium</span>
            <span className="nb-badge" style={{ background: RISK.low.bg }}>{count('low')} low</span>
          </div>
          <div style={{ marginTop: 20 }}>
            <Link href={`/chat/${id}`} className="nb-btn dark">Ask about this contract →</Link>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <h2 className="nb-h2" style={{ margin: 0 }}>Flagged clauses</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button key={f} className="nb-btn sm" onClick={() => setFilter(f)}
                style={{ background: filter === f ? 'var(--ink)' : '#fff', color: filter === f ? '#fff' : 'var(--ink)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 && <div className="nb-card">Nothing here. Either it is clean, or the filter is too strict.</div>}
        <div className="nb-grid">
          {shown.map((c, i) => {
            const r = RISK[norm(c.risk_level)] || { bg: '#fff', label: c.risk_level || 'Info' };
            return (
              <article key={i} className="nb-card" style={{ padding: 0 }}>
                <div style={{ background: r.bg, borderBottom: '3px solid var(--ink)', padding: '8px 16px', display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>{r.label} risk</strong>
                  <span className="nb-mono" style={{ fontWeight: 700 }}>#{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div style={{ padding: 18, display: 'grid', gap: 12 }}>
                  <div className="nb-quote">“{c.clause_text}”</div>
                  <div><span className="nb-badge" style={{ marginRight: 8 }}>Why</span>{c.reason}</div>
                  <div className="nb-card g" style={{ padding: '10px 14px', boxShadow: '4px 4px 0 var(--ink)' }}>
                    <span className="nb-badge" style={{ marginRight: 8 }}>Fix</span>{c.suggestion}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="nb-h2">Compliance check</h2>
        <div className="nb-card" style={{ padding: 0 }}>
          <div className="nb-row hd"><div>Rule</div><div>Status</div><div>Source</div><div>Explanation</div></div>
          {compliance.length === 0 && <div className="nb-row" style={{ gridTemplateColumns: '1fr' }}>No compliance results returned.</div>}
          {compliance.map((c, i) => {
            const s = STATUS[norm(c.status)] || { bg: '#fff', label: c.status || '—' };
            return (
              <div key={i} className="nb-row">
                <div style={{ fontWeight: 700 }}>{c.rule}</div>
                <div><span className="nb-badge" style={{ background: s.bg }}>{s.label}</span></div>
                <div className="nb-mono" style={{ fontSize: 13 }}>{c.source_document || c.source}</div>
                <div>{c.explanation}</div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}