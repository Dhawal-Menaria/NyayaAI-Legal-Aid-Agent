// @ts-nocheck
'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function Home() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [over, setOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pick = (f) => {
    if (!f) return;
    if (f.name.toLowerCase().endsWith('.pdf')) { setFile(f); setError(''); }
    else setError('PDF files only, please.');
  };

  const submit = async () => {
    if (!file && text.trim().length < 20) {
      setError('Drop a PDF or paste at least a few lines of the contract.');
      return;
    }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      if (file) fd.append('file', file); else fd.append('text', text);
      const res = await fetch(`${API}/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Server replied ${res.status}`);
      const data = await res.json();
      router.push(`/analysis/${data.document_id ?? data.id}`);
    } catch (e) {
      setError(e.message || 'Something broke. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <main className="nb-wrap">
      <section className="nb-grid two" style={{ alignItems: 'center', marginBottom: 44 }}>
        <div>
          <h1 className="nb-h1">
            Read the <span className="nb-mark">fine print</span> before it reads you.
          </h1>
          <p style={{ fontSize: 20, maxWidth: 520, margin: '22px 0 0' }}>
            Upload a rental, freelance or job contract. Get a risk score, the sneaky clauses, and what to ask for instead, in plain English.
          </p>
        </div>
        <div className="nb-card p" style={{ transform: 'rotate(1.5deg)' }}>
          <span className="nb-tag">How it works</span>
          <ol style={{ margin: 0, paddingLeft: 22, fontWeight: 700, fontSize: 18, lineHeight: 1.9 }}>
            <li>Drop your contract</li>
            <li>4 AI agents tear it apart</li>
            <li>Get risks, fixes and answers</li>
          </ol>
        </div>
      </section>

      <section className="nb-card" style={{ marginBottom: 44 }}>
        <h2 className="nb-h2">1 · Feed me a contract</h2>
        <div
          className={`nb-drop ${over ? 'over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
        >
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <div style={{ fontSize: 44, lineHeight: 1 }}>{file ? '📄' : '⬆'}</div>
          <div style={{ fontWeight: 700, fontSize: 20, marginTop: 8 }}>
            {file ? file.name : 'Drag a PDF here or click to browse'}
          </div>
          <div className="nb-mono" style={{ fontSize: 12, marginTop: 6, opacity: .7 }}>
            {file ? 'Click to swap the file' : 'Rental · Freelance · Employment · NDA'}
          </div>
        </div>

        <div className="nb-mono" style={{ textAlign: 'center', margin: '18px 0', fontWeight: 700 }}>— OR PASTE THE TEXT —</div>
        <textarea
          className="nb-input"
          rows={6}
          placeholder="Paste the contract text here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!!file}
        />

        {error && (
          <div className="nb-card r" style={{ marginTop: 18, padding: '10px 14px', boxShadow: '4px 4px 0 var(--ink)', fontWeight: 700 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginTop: 22, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="nb-btn" onClick={submit} disabled={loading}>
            {loading ? 'Agents reading…' : 'Analyze contract →'}
          </button>
          {file && !loading && <button className="nb-btn white sm" onClick={() => setFile(null)}>Remove file</button>}
        </div>
        {loading && <div className="nb-stripes" style={{ height: 18, border: '3px solid var(--ink)', marginTop: 20 }} />}
      </section>

      <section className="nb-grid three">
        {[
          ['b', '🔍', 'Contract Reviewer', 'Flags one-sided, risky and unclear clauses.'],
          ['g', '⚖', 'Compliance Checker', 'Checks the contract against Indian law documents.'],
          ['y', '💬', 'Q&A with citations', 'Ask anything. Answers come from the law, not vibes.'],
        ].map(([c, icon, t, d]) => (
          <div key={t} className={`nb-card ${c}`}>
            <div style={{ fontSize: 34 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 20, textTransform: 'uppercase', margin: '6px 0' }}>{t}</div>
            <div>{d}</div>
          </div>
        ))}
      </section>
    </main>
  );
}