// @ts-nocheck
'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const CHIPS = ['Can the landlord keep my deposit?', 'Is the notice period fair?', 'What are my exit options?'];

export default function Chat() {
  const { id } = useParams();
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'Ask me anything about your contract. I answer from the uploaded document and the legal knowledge base, and I will say so when I do not know.' },
  ]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);

  const send = async (question) => {
    const text = (question ?? q).trim();
    if (!text || busy) return;
    setQ(''); setBusy(true);
    setMsgs((m) => [...m, { role: 'me', text }]);
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: /^\d+$/.test(id) ? Number(id) : id, question: text }),
      });
      if (!res.ok) throw new Error(`Server replied ${res.status}`);
      const data = await res.json();
      setMsgs((m) => [...m, { role: 'ai', text: data.answer || 'No answer returned.' }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: 'ai', text: `⚠ ${e.message}` }]);
    } finally { setBusy(false); }
  };

  return (
    <main className="nb-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <h1 className="nb-h2" style={{ margin: 0 }}>Ask <span className="nb-mark">Nyaya</span></h1>
        <Link href={`/analysis/${id}`} className="nb-btn sm white">← Back to analysis</Link>
      </div>

      <div className="nb-card" style={{ padding: 18, minHeight: 380, display: 'grid', gap: 18, alignContent: 'start' }}>
        {msgs.map((m, i) => (
          <div key={i} className={`nb-bubble ${m.role}`}>
            <span className="nb-tag">{m.role === 'me' ? 'You' : 'Nyaya'}</span>
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="nb-bubble ai"><span className="nb-tag">Nyaya</span><span className="nb-dot" /><span className="nb-dot" /><span className="nb-dot" /></div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '22px 0 14px' }}>
        {CHIPS.map((c) => (
          <button key={c} className="nb-btn sm white" onClick={() => send(c)} disabled={busy}>{c}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <input
          className="nb-input"
          placeholder="Type your question…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button className="nb-btn" onClick={() => send()} disabled={busy || !q.trim()}>Send</button>
      </div>
    </main>
  );
}