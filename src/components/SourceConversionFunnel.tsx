import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; created_at: string; name: string; form_name: string; lead_type: string; source?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string };
type Meta = { status?: string };

const CRM_SESSION_KEY = 'anjanay-heights-crm-password';
const STAGES = ['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost'];
const META_KEY = 'anjanay-heights-lead-meta-v2';
const OLD_META_KEY = 'anjanay-heights-lead-meta-v1';

function sourceOf(l: Lead) {
  const raw = String(l.source || l.utm_source || l.utm_medium || l.form_name || l.lead_type || '').toLowerCase();
  if (raw.includes('whatsapp') || raw === 'wa') return 'WhatsApp';
  if (raw.includes('facebook') || raw.includes('instagram') || raw.includes('meta')) return 'Meta';
  if (raw.includes('google')) return 'Google';
  if (raw.includes('referral') || raw.includes('refer')) return 'Referral';
  if (raw.includes('99acres')) return '99acres';
  if (raw.includes('magicbricks')) return 'MagicBricks';
  if (raw.includes('website') || raw.includes('property-lead') || raw.includes('callback')) return 'Website';
  return 'Other';
}

function readLocalMeta(): Record<string, Meta> {
  try {
    const current = JSON.parse(localStorage.getItem(META_KEY) || '{}');
    if (Object.keys(current).length) return current;
    return JSON.parse(localStorage.getItem(OLD_META_KEY) || '{}');
  } catch {
    return {};
  }
}

function pct(value: number, base: number) {
  return base > 0 ? Math.round((value / base) * 100) : 0;
}

export default function SourceConversionFunnel() {
  const [password, setPassword] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(token = password) {
    const auth = token.trim();
    if (!auth) return;
    setLoading(true);
    setError('');
    try {
      const refresh = Date.now();
      const [lr, mr] = await Promise.all([
        fetch(`/api/leads?_refresh=${refresh}`, { headers: { Authorization: `Bearer ${auth}`, 'Cache-Control': 'no-cache' }, cache: 'no-store' }),
        fetch(`/api/lead-meta?_refresh=${refresh}`, { headers: { Authorization: `Bearer ${auth}`, 'Cache-Control': 'no-cache' }, cache: 'no-store' })
      ]);
      const l = await lr.json().catch(() => ({}));
      if (!lr.ok) throw new Error(l.error || 'Unable to load leads');
      const m = mr.ok ? await mr.json() : {};
      setLeads(l.leads || []);
      setMeta({ ...readLocalMeta(), ...(m.meta || {}) });
      setPassword(auth);
      setLoggedIn(true);
      sessionStorage.setItem(CRM_SESSION_KEY, auth);
    } catch (e) {
      sessionStorage.removeItem(CRM_SESSION_KEY);
      setLoggedIn(false);
      setError(e instanceof Error ? e.message : 'Unable to load funnel');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = sessionStorage.getItem(CRM_SESSION_KEY) || '';
    if (stored) void load(stored);
  }, []);

  const groups = useMemo(() => {
    const map: Record<string, { name: string; total: number; stages: Record<string, number> }> = {};
    leads.forEach((lead) => {
      const source = sourceOf(lead);
      if (!map[source]) map[source] = { name: source, total: 0, stages: Object.fromEntries(STAGES.map((stage) => [stage, 0])) };
      map[source].total += 1;
      const status = meta[lead.id]?.status || 'New';
      if (status in map[source].stages) map[source].stages[status] += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [leads, meta]);

  const totals = useMemo(() => Object.fromEntries(STAGES.map((stage) => [stage, leads.filter((lead) => (meta[lead.id]?.status || 'New') === stage).length])), [leads, meta]);
  const totalClosed = totals.Closed || 0;
  const totalLost = totals.Lost || 0;
  const totalQualified = (totals.Interested || 0) + (totals['Site Visit'] || 0) + (totals.Negotiation || 0) + totalClosed;
  const sourceWinner = groups[0];
  const bestCloser = [...groups].sort((a, b) => pct(b.stages.Closed, b.total) - pct(a.stages.Closed, a.total))[0];

  if (!loggedIn) return <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4"><form onSubmit={(e) => { e.preventDefault(); void load(); }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Source Conversion Funnel</h1><p className="text-gray-500 text-center mt-2">See which sources move leads toward closure.</p><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="CRM password" className="w-full border rounded-xl px-4 py-3 mt-8" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Funnel'}</button></form></div>;

  return <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Anjanay Heights CRM</p><h1 className="text-3xl font-bold text-[#1A365D] mt-1">📈 Source Conversion Funnel</h1><p className="text-slate-600 mt-1">Know which lead sources actually produce site visits, negotiations and closures.</p></div><div className="flex gap-2"><a href="/admin" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">Dashboard</a><a href="/admin/source-analytics" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">Source Analytics</a><button onClick={() => void load()} disabled={loading} className="rounded-lg bg-[#1A365D] text-white px-4 py-2 text-sm font-semibold">{loading ? 'Refreshing...' : 'Refresh'}</button></div></div>

    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">{STAGES.map((stage, index) => { const count = totals[stage] || 0; const previous = index === 0 ? leads.length : totals[STAGES[index - 1]] || 0; return <div key={stage} className="bg-white rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">{stage}</p><p className="text-2xl font-bold text-[#1A365D] mt-1">{count}</p><p className="text-[11px] text-slate-400 mt-1">{index === 0 ? 'All enquiries' : `${pct(count, previous)}% from ${STAGES[index - 1]}`}</p></div>; })}</div>

    <div className="grid md:grid-cols-3 gap-4 mb-6"><div className="bg-white rounded-2xl p-5 shadow-sm"><p className="text-xs uppercase tracking-wide text-slate-500">Overall close rate</p><p className="text-3xl font-bold text-[#1A365D] mt-1">{pct(totalClosed, leads.length)}%</p><p className="text-sm text-slate-500 mt-1">{totalClosed} closed from {leads.length} enquiries</p></div><div className="bg-white rounded-2xl p-5 shadow-sm"><p className="text-xs uppercase tracking-wide text-slate-500">Qualified pipeline</p><p className="text-3xl font-bold text-[#1A365D] mt-1">{totalQualified}</p><p className="text-sm text-slate-500 mt-1">Interested → Closed, excluding lost</p></div><div className="bg-white rounded-2xl p-5 shadow-sm"><p className="text-xs uppercase tracking-wide text-slate-500">Top source by volume</p><p className="text-2xl font-bold text-[#1A365D] mt-1">{sourceWinner?.name || '—'}</p><p className="text-sm text-slate-500 mt-1">{sourceWinner ? `${sourceWinner.total} enquiries` : 'No enquiries yet'}</p></div></div>

    {bestCloser && <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-slate-500">Best closing source</p><h2 className="text-xl font-bold text-slate-900 mt-1">{bestCloser.name}</h2><p className="text-sm text-slate-500 mt-1">{bestCloser.stages.Closed} closed from {bestCloser.total} enquiries</p></div><div className="text-right"><p className="text-3xl font-bold text-[#1A365D]">{pct(bestCloser.stages.Closed, bestCloser.total)}%</p><p className="text-xs text-slate-500">close rate</p></div></div></div>}

    <div className="space-y-4">{groups.map((group) => { const active = Math.max(0, group.total - group.stages.Closed - group.stages.Lost); const siteVisitRate = pct(group.stages['Site Visit'] + group.stages.Negotiation + group.stages.Closed, group.total); const negotiationRate = pct(group.stages.Negotiation + group.stages.Closed, group.total); const closeRate = pct(group.stages.Closed, group.total); return <div key={group.name} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-lg text-slate-900">{group.name}</h2><p className="text-sm text-slate-500">{group.total} enquiries · {active} active · {group.stages.Lost} lost</p></div><div className="grid grid-cols-3 gap-4 text-right"><div><p className="text-[11px] text-slate-500">Site visit+</p><p className="font-bold text-slate-900">{siteVisitRate}%</p></div><div><p className="text-[11px] text-slate-500">Negotiation+</p><p className="font-bold text-slate-900">{negotiationRate}%</p></div><div><p className="text-[11px] text-slate-500">Closed</p><p className="text-xl font-bold text-[#1A365D]">{closeRate}%</p></div></div></div><div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">{STAGES.map((stage) => <div key={stage} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{stage}</p><p className="font-bold text-slate-900 mt-1">{group.stages[stage] || 0}</p></div>)}</div><div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-[#1A365D]" style={{ width: `${Math.min(100, closeRate)}%` }} /></div></div>; })}</div>

    {!groups.length && <div className="bg-white rounded-2xl p-8 text-center text-slate-500">No enquiries found.</div>}
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Next business action</h2><p className="text-sm text-slate-600 mt-1">Put more budget and follow-up effort behind sources that reach Site Visit, Negotiation and Closed—not just sources that generate enquiries.</p><div className="flex flex-wrap gap-2 mt-4"><a href="/admin/campaign-performance" className="rounded-lg bg-[#1A365D] text-white px-4 py-2 text-sm font-semibold">Campaign Performance →</a><a href="/admin/followup-automation" className="rounded-lg border px-4 py-2 text-sm font-semibold">Follow-up Automation →</a></div></div>
  </div></div>;
}
