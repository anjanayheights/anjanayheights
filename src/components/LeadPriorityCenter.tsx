import { useEffect, useMemo, useState } from 'react';

type Lead = {
  id: string; created_at: string; name: string; phone: string; email: string;
  lead_type: string; property_type: string; location: string; budget: string;
  timeline: string; requirement: string; message: string;
};

type HistoryItem = { action: string; at: string };
type Meta = { status?: string; followUp?: string; priority?: string; nextAction?: string; note?: string; history?: HistoryItem[] };

function todayIST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function dateLabel(value: string) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function phoneForWhatsApp(phone: string) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

export default function LeadPriorityCenter() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);

  async function load() {
    if (!password.trim()) { setError('Please enter dashboard password.'); return; }
    setLoading(true); setError('');
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const headers = { Authorization: `Bearer ${password}`, 'Cache-Control': 'no-cache' };
      const [lr, mr] = await Promise.all([
        fetch(`/api/leads?_refresh=${token}`, { headers, cache: 'no-store' }),
        fetch(`/api/lead-meta?_refresh=${token}`, { headers, cache: 'no-store' })
      ]);
      const ld = await lr.json();
      if (!lr.ok) throw new Error(ld.error || 'Unable to load leads');
      const md = mr.ok ? await mr.json() : { meta: {} };
      setLeads(ld.leads || []); setMeta(md.meta || {}); setLoggedIn(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load leads'); }
    finally { setLoading(false); }
  }

  const today = todayIST();
  const due = useMemo(() => leads.filter(l => { const m = meta[l.id] || {}; return !['Closed','Lost'].includes(m.status || '') && m.followUp === today; }).sort((a,b) => (meta[b.id]?.priority === 'Hot' ? 1 : 0) - (meta[a.id]?.priority === 'Hot' ? 1 : 0)), [leads, meta, today]);
  const overdue = useMemo(() => leads.filter(l => { const m = meta[l.id] || {}; return !['Closed','Lost'].includes(m.status || '') && !!m.followUp && m.followUp < today; }).sort((a,b) => (meta[b.id]?.priority === 'Hot' ? 1 : 0) - (meta[a.id]?.priority === 'Hot' ? 1 : 0)), [leads, meta, today]);
  const priority = useMemo(() => leads.filter(l => { const m = meta[l.id] || {}; return !['Closed','Lost'].includes(m.status || '') && ['Hot','Very Hot'].includes(m.priority || ''); }).sort((a,b) => (meta[b.id]?.followUp ? 1 : 0) - (meta[a.id]?.followUp ? 1 : 0)), [leads, meta]);

  function openWhatsApp(lead: Lead) {
    const m = meta[lead.id] || {};
    const text = `Hi ${lead.name || 'there'}, thank you for your enquiry with Anjanay Heights.\n\nI wanted to follow up regarding your property requirement${m.location || lead.location ? ` for ${m.location || lead.location}` : ''}. Please let me know a convenient time to speak.`;
    window.open(`https://wa.me/${phoneForWhatsApp(lead.phone)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  if (!loggedIn) return (
    <section className="mb-6 bg-white rounded-2xl shadow p-5">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1"><h2 className="text-xl font-bold text-[#1A365D]">🎯 Sales Priority Center</h2><p className="text-sm text-gray-500 mt-1">See Today, Overdue and priority leads before starting work.</p></div>
        <div className="flex gap-2 w-full md:w-auto"><input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void load(); }} placeholder="Dashboard password" className="border rounded-xl px-3 py-2 flex-1 md:w-52"/><button onClick={() => void load()} disabled={loading} className="bg-[#1A365D] text-white rounded-xl px-4 py-2 font-semibold">{loading ? 'Loading...' : 'Load'}</button></div>
      </div>
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </section>
  );

  const card = (lead: Lead, kind: 'Today' | 'Overdue' | 'Priority') => {
    const m = meta[lead.id] || {};
    const history = m.history || [];
    return <div key={`${kind}-${lead.id}`} className="border rounded-xl p-3 bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <button onClick={() => setSelected(lead)} className="text-left flex-1"><div className="font-bold text-[#1A365D]">{lead.name || 'Unnamed lead'} <span className="text-xs font-semibold text-gray-500">• {m.priority || 'Warm'}</span></div><div className="text-sm text-gray-600">{lead.phone}{lead.location || m.location ? ` • ${m.location || lead.location}` : ''}</div><div className="text-xs text-gray-500 mt-1">{kind === 'Priority' ? (m.followUp ? `Follow-up: ${dateLabel(m.followUp)}` : 'No follow-up set') : `${kind}: ${dateLabel(m.followUp || '')}`} • {m.status || 'New'} • {m.nextAction || 'Call'}</div><div className="text-xs text-gray-400 mt-1">{history.length ? `Last: ${history[history.length - 1].action}` : 'No activity yet'}</div></button>
        <div className="flex gap-2"><a href={`tel:${lead.phone}`} onClick={() => {}} className="rounded-lg bg-[#1A365D] text-white px-3 py-2 text-sm font-semibold">📞 Call</a><button onClick={() => openWhatsApp(lead)} className="rounded-lg border border-[#1A365D] text-[#1A365D] px-3 py-2 text-sm font-semibold">💬 WhatsApp</button></div>
      </div>
    </div>;
  };

  return <section className="mb-6 bg-white rounded-2xl shadow p-5">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold text-[#1A365D]">🎯 Sales Priority Center</h2><p className="text-sm text-gray-500">Today and overdue work is surfaced first.</p></div><button onClick={() => void load()} className="border rounded-xl px-4 py-2 font-semibold text-[#1A365D]">↻ Refresh</button></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"><div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-gray-600">Follow-up Today</p><p className="text-2xl font-bold">{due.length}</p></div><div className="rounded-xl bg-red-50 p-3"><p className="text-xs text-gray-600">Overdue</p><p className="text-2xl font-bold">{overdue.length}</p></div><div className="rounded-xl bg-orange-50 p-3"><p className="text-xs text-gray-600">Hot / Very Hot</p><p className="text-2xl font-bold">{priority.length}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-gray-600">Action Queue</p><p className="text-2xl font-bold">{due.length + overdue.length}</p></div></div>
    <div className="grid lg:grid-cols-3 gap-4">
      <div><h3 className="font-bold mb-2">🟡 Today ({due.length})</h3><div className="space-y-2">{due.slice(0,5).map(l => card(l,'Today'))}{!due.length && <p className="text-sm text-gray-400">No follow-ups due today.</p>}</div></div>
      <div><h3 className="font-bold mb-2 text-red-700">🔴 Overdue ({overdue.length})</h3><div className="space-y-2">{overdue.slice(0,5).map(l => card(l,'Overdue'))}{!overdue.length && <p className="text-sm text-gray-400">No overdue follow-ups.</p>}</div></div>
      <div><h3 className="font-bold mb-2">🔥 Priority ({priority.length})</h3><div className="space-y-2">{priority.slice(0,5).map(l => card(l,'Priority'))}{!priority.length && <p className="text-sm text-gray-400">No active Hot leads.</p>}</div></div>
    </div>
    {selected && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}><div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}><div className="flex justify-between gap-3"><div><h3 className="text-2xl font-bold text-[#1A365D]">{selected.name || 'Lead Details'}</h3><p className="text-gray-500">{selected.phone}</p></div><button onClick={() => setSelected(null)} className="text-gray-500 text-xl">✕</button></div><div className="grid grid-cols-2 gap-3 mt-5 text-sm"><div><b>Status</b><p>{meta[selected.id]?.status || 'New'}</p></div><div><b>Priority</b><p>{meta[selected.id]?.priority || 'Warm'}</p></div><div><b>Follow-up</b><p>{meta[selected.id]?.followUp ? dateLabel(meta[selected.id]?.followUp || '') : 'Not set'}</p></div><div><b>Next action</b><p>{meta[selected.id]?.nextAction || 'Call'}</p></div><div><b>Property</b><p>{selected.property_type || '—'}</p></div><div><b>Location</b><p>{selected.location || '—'}</p></div><div className="col-span-2"><b>Budget</b><p>{selected.budget || '—'}</p></div><div className="col-span-2"><b>Requirement</b><p>{selected.requirement || selected.message || '—'}</p></div></div><div className="mt-5"><h4 className="font-bold mb-2">🕐 Activity Timeline</h4>{(meta[selected.id]?.history || []).slice().reverse().map((h,i) => <div key={`${h.at}-${i}`} className="border-l-2 border-slate-200 pl-3 py-1 text-sm"><div className="font-semibold">{h.action}</div><div className="text-xs text-gray-500">{new Date(h.at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div></div>)}{!(meta[selected.id]?.history || []).length && <p className="text-sm text-gray-400">No activity recorded yet.</p>}</div><div className="flex gap-2 mt-6"><a href={`tel:${selected.phone}`} className="flex-1 text-center bg-[#1A365D] text-white rounded-xl py-3 font-semibold">📞 Call</a><button onClick={() => openWhatsApp(selected)} className="flex-1 border border-[#1A365D] text-[#1A365D] rounded-xl py-3 font-semibold">💬 WhatsApp</button></div></div></div>}
  </section>;
}
