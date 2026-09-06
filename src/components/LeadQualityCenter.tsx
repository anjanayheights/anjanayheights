import { useEffect, useMemo, useState } from 'react';

type Lead = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email?: string;
  lead_type?: string;
  property_type?: string;
  location?: string;
  budget?: string;
  timeline?: string;
  requirement?: string;
  message?: string;
};

type Meta = { status?: string; priority?: string; nextAction?: string; followUp?: string; location?: string; budget?: string; timeline?: string; propertyType?: string };

function scoreLead(lead: Lead, meta: Meta) {
  let score = 0;
  const location = meta.location || lead.location || '';
  const budget = meta.budget || lead.budget || '';
  const timeline = meta.timeline || lead.timeline || '';
  const requirement = lead.requirement || lead.message || '';
  if (lead.phone) score += 20;
  if (lead.name) score += 5;
  if (location) score += 15;
  if (budget) score += 20;
  if (timeline) score += 15;
  if (lead.property_type || meta.propertyType) score += 10;
  if (requirement.length >= 20) score += 10;
  const text = `${timeline} ${requirement}`.toLowerCase();
  if (/today|urgent|immediately|immediate|7 day|15 day|30 day|this month|within a month|ready/.test(text)) score += 10;
  if (meta.status === 'Site Visit') score += 15;
  if (meta.status === 'Negotiation') score += 20;
  if (meta.status === 'Closed' || meta.status === 'Lost') score = 0;
  return Math.min(100, score);
}

function tier(score: number) {
  if (score >= 75) return 'Very Hot';
  if (score >= 55) return 'Hot';
  if (score >= 35) return 'Warm';
  return 'Cold';
}

function wa(phone: string) {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
}

export default function LeadQualityCenter() {
  const [password, setPassword] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const h = { Authorization: `Bearer ${password}`, 'Cache-Control': 'no-cache' };
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const [lr, mr] = await Promise.all([
        fetch(`/api/leads?_refresh=${token}`, { headers: h, cache: 'no-store' }),
        fetch(`/api/lead-meta?_refresh=${token}`, { headers: h, cache: 'no-store' })
      ]);
      const ld = await lr.json();
      const md = mr.ok ? await mr.json() : { meta: {} };
      if (!lr.ok) throw new Error(ld.error || 'Unable to load leads');
      setLeads(ld.leads || []); setMeta(md.meta || {}); setLoggedIn(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load leads'); }
    finally { setLoading(false); }
  }

  const scored = useMemo(() => leads.map((lead) => {
    const m = meta[lead.id] || {};
    const score = scoreLead(lead, m);
    return { lead, meta: m, score, tier: tier(score) };
  }).sort((a, b) => b.score - a.score || new Date(b.lead.created_at).getTime() - new Date(a.lead.created_at).getTime()), [leads, meta]);

  const counts = useMemo(() => scored.reduce((a, x) => { a[x.tier] = (a[x.tier] || 0) + 1; return a; }, {} as Record<string, number>), [scored]);
  const top = scored.filter((x) => x.score >= 55 && !['Closed', 'Lost'].includes(x.meta.status || ''));

  if (!loggedIn) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4"><form onSubmit={(e) => { e.preventDefault(); void load(); }} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Lead Quality Center</h1><p className="text-gray-500 text-center mt-2">Find the leads most likely to convert.</p><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Dashboard password" className="w-full border rounded-xl px-4 py-3 mt-7" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button disabled={loading} className="w-full mt-4 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Lead Quality'}</button></form></div>;

  return <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8"><div className="max-w-7xl mx-auto"><div className="flex flex-col md:flex-row md:justify-between gap-3 mb-7"><div><h1 className="text-3xl font-bold text-[#1A365D]">Lead Quality Center</h1><p className="text-gray-500 mt-1">Automatic intent scoring — focus your team on the best opportunities first.</p></div><button onClick={() => void load()} disabled={loading} className="bg-[#1A365D] text-white px-5 py-3 rounded-xl font-semibold h-fit">{loading ? 'Refreshing...' : '↻ Refresh'}</button></div>{error && <div className="bg-red-50 text-red-700 rounded-xl p-3 mb-5">{error}</div>}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">{['Very Hot','Hot','Warm','Cold'].map((t) => <div key={t} className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">{t}</p><p className="text-3xl font-bold text-[#1A365D]">{counts[t] || 0}</p></div>)}</div>
  <div className="bg-white rounded-2xl shadow p-5 mb-6"><h2 className="text-xl font-bold text-[#1A365D]">🔥 Priority Leads</h2><p className="text-sm text-gray-500 mt-1">Hot and Very Hot leads should be called first.</p><div className="mt-4 space-y-3">{top.length === 0 ? <p className="text-gray-500">No high-intent active leads found.</p> : top.slice(0, 15).map(({ lead, meta: m, score, tier: t }) => { const location = m.location || lead.location || 'Location not specified'; const budget = m.budget || lead.budget || 'Budget not specified'; const timeline = m.timeline || lead.timeline || 'Timeline not specified'; return <div key={lead.id} className="border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-lg">{lead.name || 'Unnamed lead'}</strong><span className="px-2 py-1 rounded-full bg-gray-100 text-xs font-bold">{t} · {score}/100</span></div><p className="text-sm text-gray-600 mt-1">{location} · {budget} · {timeline}</p><p className="text-xs text-gray-500 mt-1">Status: {m.status || 'New'} · Next: {m.nextAction || 'Call'}</p></div><div className="flex gap-2"><a href={`tel:${lead.phone}`} className="px-4 py-2 rounded-lg bg-[#1A365D] text-white font-semibold">Call</a><button onClick={() => window.open(`https://wa.me/${wa(lead.phone)}?text=${encodeURIComponent(`Hi ${lead.name || 'there'}, thank you for your enquiry with Anjanay Heights. I have suitable property options matching your requirement. May I call you at a convenient time?`)}`, '_blank', 'noopener,noreferrer')} className="px-4 py-2 rounded-lg border border-[#1A365D] text-[#1A365D] font-semibold">WhatsApp</button></div></div>; })}</div></div>
  <div className="bg-white rounded-2xl shadow p-5"><h2 className="text-xl font-bold text-[#1A365D]">All Leads by Quality</h2><div className="overflow-x-auto mt-3"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-3 pr-3">Lead</th><th>Score</th><th>Quality</th><th>Location</th><th>Budget</th><th>Timeline</th><th>Status</th></tr></thead><tbody>{scored.map(({lead,m,score,tier:t}) => <tr key={lead.id} className="border-b"><td className="py-3 pr-3 font-semibold">{lead.name || 'Unnamed'}<div className="text-xs text-gray-500">{lead.phone}</div></td><td className="font-bold">{score}</td><td>{t}</td><td>{m.location || lead.location || '—'}</td><td>{m.budget || lead.budget || '—'}</td><td>{m.timeline || lead.timeline || '—'}</td><td>{m.status || 'New'}</td></tr>)}</tbody></table></div></div></div></div>;
}
