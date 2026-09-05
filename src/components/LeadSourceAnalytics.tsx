import { useMemo, useState } from 'react';

type Lead = { id: string; created_at: string; name: string; phone: string; form_name: string; lead_type: string; source?: string; utm_source?: string; utm_medium?: string };

const SOURCES = ['Website', 'WhatsApp', 'Meta', 'Google', 'Referral', '99acres', 'MagicBricks', 'Other'];

function normalizeSource(value: string) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.includes('whatsapp') || raw === 'wa') return 'WhatsApp';
  if (raw.includes('facebook') || raw.includes('instagram') || raw.includes('meta')) return 'Meta';
  if (raw.includes('google')) return 'Google';
  if (raw.includes('referral') || raw.includes('refer')) return 'Referral';
  if (raw.includes('99acres')) return '99acres';
  if (raw.includes('magicbricks')) return 'MagicBricks';
  if (raw.includes('website') || raw.includes('direct')) return 'Website';
  return '';
}

function sourceOf(lead: Lead) {
  const persisted = normalizeSource(lead.source || lead.utm_source || lead.utm_medium);
  if (persisted) return persisted;
  const raw = `${lead.form_name || ''} ${lead.lead_type || ''}`.toLowerCase();
  if (raw.includes('whatsapp') || raw.includes('wa')) return 'WhatsApp';
  if (raw.includes('meta') || raw.includes('facebook') || raw.includes('instagram')) return 'Meta';
  if (raw.includes('google')) return 'Google';
  if (raw.includes('referral') || raw.includes('refer')) return 'Referral';
  if (raw.includes('99acres')) return '99acres';
  if (raw.includes('magicbricks')) return 'MagicBricks';
  if (raw.includes('website') || raw.includes('property-lead') || raw.includes('callback')) return 'Website';
  return 'Other';
}

export default function LeadSourceAnalytics() {
  const [password, setPassword] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/leads', { headers: { Authorization: `Bearer ${password}` } });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Unable to load leads');
      setLeads(data.leads || []); setLoggedIn(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load leads'); }
    finally { setLoading(false); }
  }

  const counts = useMemo(() => SOURCES.reduce<Record<string, number>>((a, source) => { a[source] = leads.filter(l => sourceOf(l) === source).length; return a; }, {}), [leads]);
  const totalTracked = leads.length;
  const topSource = SOURCES.reduce((best, source) => counts[source] > counts[best] ? source : best, SOURCES[0]);
  const trackedWithExplicitSource = leads.filter(l => Boolean(normalizeSource(l.source || l.utm_source || l.utm_medium))).length;
  const coverage = totalTracked ? Math.round((trackedWithExplicitSource / totalTracked) * 100) : 0;

  if (!loggedIn) return <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4"><form onSubmit={e => { e.preventDefault(); void load(); }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Lead Source Analytics</h1><p className="text-gray-500 text-center mt-2">See where your enquiries are coming from.</p><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Dashboard password" className="w-full border rounded-xl px-4 py-3 mt-8" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Analytics'}</button></form></div>;

  return <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-center justify-between gap-3 mb-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Anjanay Heights CRM</p><h1 className="text-3xl font-bold text-[#1A365D] mt-1">📊 Lead Source Analytics</h1><p className="text-slate-600 mt-1">Track which acquisition channels are producing enquiries.</p></div><div className="flex gap-2"><a href="/admin" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">Dashboard</a><button onClick={() => void load()} className="rounded-lg bg-[#1A365D] text-white px-4 py-2 text-sm font-semibold">Refresh</button></div></div><div className="grid sm:grid-cols-3 gap-4 mb-6"><div className="bg-white rounded-2xl p-5 shadow-sm"><p className="text-slate-500 text-sm">Total enquiries</p><p className="text-3xl font-bold text-[#1A365D] mt-1">{totalTracked}</p></div><div className="bg-white rounded-2xl p-5 shadow-sm"><p className="text-slate-500 text-sm">Top source</p><p className="text-2xl font-bold text-[#1A365D] mt-1">{totalTracked ? topSource : '—'}</p></div><div className="bg-white rounded-2xl p-5 shadow-sm"><p className="text-slate-500 text-sm">Explicit source tracking</p><p className="text-2xl font-bold text-[#1A365D] mt-1">{coverage}%</p><p className="text-xs text-slate-400 mt-1">New leads save source + UTM data</p></div></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{SOURCES.map(source => <div key={source} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"><div className="flex items-center justify-between"><p className="font-semibold text-slate-800">{source}</p><span className="text-2xl font-bold text-[#1A365D]">{counts[source] || 0}</span></div><div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-[#1A365D]" style={{ width: `${totalTracked ? Math.min(100, Math.round((counts[source] / totalTracked) * 100)) : 0}%` }} /></div><p className="text-xs text-slate-500 mt-2">{totalTracked ? Math.round((counts[source] / totalTracked) * 100) : 0}% of enquiries</p></div>)}</div><div className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Next step</h2><p className="text-sm text-slate-600 mt-1">New enquiries now save a normalized source plus UTM campaign data when available. Use tagged campaign links for Meta, Google, WhatsApp and referrals so the CRM can attribute each enquiry automatically.</p><a href="/admin/leads-growth" className="inline-block mt-4 text-sm font-semibold text-[#1A365D]">Open Lead Generation Center →</a></div></div></div>;
}
