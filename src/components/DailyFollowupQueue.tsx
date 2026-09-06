import { useMemo, useState } from 'react';

type Lead = { id: string; name: string; phone: string; location?: string; budget?: string; timeline?: string; requirement?: string; message?: string; created_at: string };
type Meta = { status?: string; priority?: string; nextAction?: string; followUp?: string; location?: string; budget?: string; timeline?: string };

function score(lead: Lead, m: Meta) {
  let s = 0;
  if (lead.phone) s += 20;
  if (lead.name) s += 5;
  if (m.location || lead.location) s += 15;
  if (m.budget || lead.budget) s += 20;
  if (m.timeline || lead.timeline) s += 15;
  if ((lead.requirement || lead.message || '').length >= 20) s += 10;
  if (/today|urgent|immediate|7 day|15 day|30 day|this month|ready/i.test(`${m.timeline || lead.timeline || ''} ${lead.requirement || lead.message || ''}`)) s += 10;
  if (m.status === 'Site Visit') s += 15;
  if (m.status === 'Negotiation') s += 20;
  if (m.status === 'Closed' || m.status === 'Lost') return 0;
  return Math.min(100, s);
}

function wa(phone: string) { const d = phone.replace(/\D/g, ''); return d.length === 10 ? `91${d}` : d; }

export default function DailyFollowupQueue() {
  const [password, setPassword] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const h = { Authorization: `Bearer ${password}`, 'Cache-Control': 'no-cache' };
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const [lr, mr] = await Promise.all([fetch(`/api/leads?_refresh=${token}`, { headers: h, cache: 'no-store' }), fetch(`/api/lead-meta?_refresh=${token}`, { headers: h, cache: 'no-store' })]);
      const ld = await lr.json(); const md = mr.ok ? await mr.json() : { meta: {} };
      if (!lr.ok) throw new Error(ld.error || 'Unable to load leads');
      setLeads(ld.leads || []); setMeta(md.meta || {}); setLoggedIn(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load follow-ups'); }
    finally { setLoading(false); }
  }

  async function markToday(id: string) {
    const next = { ...(meta[id] || {}), priority: 'Hot', nextAction: 'Follow-up', followUp: new Date().toISOString().slice(0, 10) };
    setMeta((x) => ({ ...x, [id]: next })); setSaving(id); setError('');
    try {
      const r = await fetch('/api/lead-meta', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ leadId: id, meta: next }) });
      if (!r.ok) throw new Error('Could not save follow-up');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save follow-up'); }
    finally { setSaving(''); }
  }

  const queue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return leads.map((lead) => ({ lead, m: meta[lead.id] || {}, score: score(lead, meta[lead.id] || {}) }))
      .filter((x) => x.score >= 55 && !['Closed', 'Lost'].includes(x.m.status || ''))
      .sort((a, b) => { const ad = a.m.followUp === today ? 0 : a.m.followUp && a.m.followUp < today ? 1 : 2; const bd = b.m.followUp === today ? 0 : b.m.followUp && b.m.followUp < today ? 1 : 2; return ad - bd || b.score - a.score; });
  }, [leads, meta]);

  const today = new Date().toISOString().slice(0, 10);
  const due = queue.filter((x) => x.m.followUp === today || !x.m.followUp || (x.m.followUp || '') < today);

  if (!loggedIn) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4"><form onSubmit={(e) => { e.preventDefault(); void load(); }} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Daily Follow-up Queue</h1><p className="text-gray-500 text-center mt-2">Start each day with the leads most likely to convert.</p><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Dashboard password" className="w-full border rounded-xl px-4 py-3 mt-7" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button disabled={loading} className="w-full mt-4 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Follow-up Queue'}</button></form></div>;

  return <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8"><div className="max-w-7xl mx-auto"><div className="flex flex-col md:flex-row md:justify-between gap-3 mb-7"><div><h1 className="text-3xl font-bold text-[#1A365D]">📞 Daily Follow-up Queue</h1><p className="text-gray-500 mt-1">Hot and Very Hot active leads — call the due leads first.</p></div><button onClick={() => void load()} disabled={loading} className="bg-[#1A365D] text-white px-5 py-3 rounded-xl font-semibold h-fit">{loading ? 'Refreshing...' : '↻ Refresh'}</button></div>{error && <div className="bg-red-50 text-red-700 rounded-xl p-3 mb-5">{error}</div>}<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Due Today</p><p className="text-3xl font-bold text-[#1A365D]">{due.length}</p></div><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Priority Queue</p><p className="text-3xl font-bold text-[#1A365D]">{queue.length}</p></div><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Very Hot</p><p className="text-3xl font-bold text-[#1A365D]">{queue.filter(x => x.score >= 75).length}</p></div><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">No Follow-up</p><p className="text-3xl font-bold text-[#1A365D]">{queue.filter(x => !x.m.followUp).length}</p></div></div><div className="bg-white rounded-2xl shadow p-5"><h2 className="text-xl font-bold text-[#1A365D]">Today’s Sales Calls</h2><p className="text-sm text-gray-500 mt-1">Call first, then update the next action in CRM.</p><div className="mt-4 space-y-3">{due.length === 0 ? <p className="text-gray-500 py-6">No priority follow-ups are due today.</p> : due.map(({ lead, m, score: s }) => <div key={lead.id} className="border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-lg">{lead.name || 'Unnamed lead'}</strong><span className="px-2 py-1 rounded-full bg-gray-100 text-xs font-bold">{s >= 75 ? 'Very Hot' : 'Hot'} · {s}/100</span></div><p className="text-sm text-gray-600 mt-1">{m.location || lead.location || 'Location not specified'} · {m.budget || lead.budget || 'Budget not specified'} · {m.timeline || lead.timeline || 'Timeline not specified'}</p><p className="text-xs text-gray-500 mt-1">Follow-up: {m.followUp || 'Not set'} · Next: {m.nextAction || 'Call'}</p></div><div className="flex flex-wrap gap-2"><a href={`tel:${lead.phone}`} className="px-4 py-2 rounded-lg bg-[#1A365D] text-white font-semibold">Call</a><button onClick={() => window.open(`https://wa.me/${wa(lead.phone)}?text=${encodeURIComponent(`Hi ${lead.name || 'there'}, following up on your Anjanay Heights property enquiry. May I help you with suitable options?`)}`, '_blank', 'noopener,noreferrer')} className="px-4 py-2 rounded-lg border border-[#1A365D] text-[#1A365D] font-semibold">WhatsApp</button><button disabled={saving === lead.id} onClick={() => void markToday(lead.id)} className="px-4 py-2 rounded-lg border font-semibold disabled:opacity-50">{saving === lead.id ? 'Saving...' : 'Set Follow-up Today'}</button></div></div>)}</div></div></div></div>;
}
