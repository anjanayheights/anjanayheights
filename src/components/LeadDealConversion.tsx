import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name?: string; phone?: string; property_type?: string; location?: string; budget?: string };
type HistoryItem = { id: string; action: string; at: string };
type Meta = { status?: string; nextAction?: string; followUp?: string; priority?: string; dealValue?: string | number; sellerCommissionRate?: string | number; commissionStatus?: string; history?: HistoryItem[] };

const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const makeId = () => `conversion-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export default function LeadDealConversion() {
  const [password, setPassword] = useState(sessionStorage.getItem('anjanay-heights-crm-password') || '');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!password) return;
    setLoading(true);
    setError('');
    const headers = { Authorization: `Bearer ${password}`, 'Cache-Control': 'no-cache' };
    try {
      const [lr, mr] = await Promise.all([
        fetch(`/api/leads?_refresh=${Date.now()}`, { headers, cache: 'no-store' }),
        fetch(`/api/lead-meta?_refresh=${Date.now()}`, { headers, cache: 'no-store' })
      ]);
      const l = await lr.json();
      const m = mr.ok ? await mr.json() : { meta: {} };
      if (!lr.ok) throw new Error(l.error || 'Unable to load leads');
      setLeads(l.leads || []);
      setMeta(m.meta || {});
      sessionStorage.setItem('anjanay-heights-crm-password', password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load leads');
    } finally { setLoading(false); }
  }

  useEffect(() => { if (password) void load(); }, []);

  const active = useMemo(() => leads.filter(l => !['Closed', 'Lost'].includes(meta[l.id]?.status || 'New')).slice(0, 12), [leads, meta]);

  async function transition(lead: Lead, status: string, nextAction: string) {
    const old = meta[lead.id] || {};
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/lead-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({
          leadId: lead.id,
          meta: {
            status,
            nextAction,
            followUp: todayIST(),
            activity: { id: makeId(), action: `Status: ${status}`, at: new Date().toISOString() },
            ...(status === 'Closed' ? { commissionStatus: old.commissionStatus || 'Pending', sellerCommissionRate: old.sellerCommissionRate || 1 } : {})
          }
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Could not save conversion update');
      setMeta(v => ({ ...v, [lead.id]: data.meta || { ...old, status, nextAction, followUp: todayIST() } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save conversion update');
    } finally { setLoading(false); }
  }

  if (!password) {
    return <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6"><div className="rounded-2xl bg-white border p-5"><h2 className="text-xl font-bold text-[#1A365D]">🔗 Lead → Deal Conversion</h2><p className="text-sm text-slate-500 mt-1">Move a lead through the sales journey with one click.</p><div className="flex gap-2 mt-4"><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="CRM password" className="border rounded-lg px-3 py-2 flex-1 max-w-sm" /><button onClick={() => void load()} className="rounded-lg bg-[#1A365D] px-4 py-2 text-white font-semibold">Open</button></div>{error && <p className="text-sm text-red-600 mt-3">{error}</p>}</div></section>;
  }

  return <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6"><div className="rounded-2xl bg-white border shadow-sm overflow-hidden"><div className="p-5 border-b flex items-center justify-between"><div><h2 className="text-xl font-bold text-[#1A365D]">🔗 Lead → Deal Conversion</h2><p className="text-sm text-slate-500 mt-1">One-click stage change + follow-up + activity history.</p></div><button onClick={() => void load()} disabled={loading} className="rounded-lg border px-3 py-2 text-sm font-semibold">{loading ? 'Loading…' : '↻ Refresh'}</button></div>{error && <div className="mx-4 mt-4 rounded-lg bg-red-50 text-red-700 p-3 text-sm">{error}</div>}<div className="p-4 space-y-3">{active.map(lead => { const m = meta[lead.id] || {}; const value = Number(String(m.dealValue || '').replace(/[^0-9.]/g, '')) || 0; const commission = value * (Number(m.sellerCommissionRate || 1) / 100); return <div key={lead.id} className="border rounded-xl p-3"><div className="flex flex-wrap justify-between gap-2"><div><b>{lead.name || 'Lead'}</b><div className="text-xs text-slate-500">{lead.property_type || 'Property'} · {lead.location || 'Location'} · {lead.budget || 'Budget'}</div></div><span className="text-xs font-semibold rounded-full border px-2 py-1">{m.priority || 'Warm'} · {m.status || 'New'}</span></div><div className="flex flex-wrap gap-2 mt-3"><button disabled={loading} onClick={() => void transition(lead, 'Contacted', 'Follow-up')} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">✅ Contacted</button><button disabled={loading} onClick={() => void transition(lead, 'Interested', 'Send Property Options')} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">👍 Interested</button><button disabled={loading} onClick={() => void transition(lead, 'Site Visit', 'Confirm Site Visit')} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">📅 Site Visit</button><button disabled={loading} onClick={() => void transition(lead, 'Negotiation', 'Follow-up')} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">🤝 Negotiation</button><button disabled={loading} onClick={() => void transition(lead, 'Closed', 'Handover / Commission')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">✅ Close Deal</button></div>{m.status === 'Closed' && <div className="mt-2 text-xs text-emerald-700">Commission workflow started: {value ? money(commission) : 'Deal value pending'} · {m.commissionStatus || 'Pending'}</div>}</div>})}{active.length === 0 && <div className="text-center text-sm text-slate-500 py-6">No active leads available.</div>}</div></div></section>;
}
