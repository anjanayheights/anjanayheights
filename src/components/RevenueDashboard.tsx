import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string; phone: string; property_type: string; location: string; budget: string };
type Meta = { status: string; dealValue?: string; closingProbability?: string; closedDate?: string; expectedClosingDate?: string; closedProperty?: string };

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const amount = (value?: string) => Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
const probability = (value?: string) => Math.min(100, Math.max(0, Number(String(value || '50').replace(/[^0-9.]/g, '')) || 50));
const today = () => new Date().toISOString().slice(0, 10);
const effectiveClosedDate = (m: Meta) => m.closedDate || (m.status === 'Closed' ? today() : '');

export default function RevenueDashboard() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(p?: string) {
    const active = p || password || sessionStorage.getItem('anjanay-heights-crm-password') || '';
    if (!active) { setError('Please enter your dashboard password.'); return; }
    setLoading(true); setError(''); setPassword(active);
    try {
      const q = `?refresh=${Date.now()}`;
      const headers = { Authorization: `Bearer ${active}`, 'Cache-Control': 'no-cache' };
      const [lr, mr] = await Promise.all([fetch(`/api/leads${q}`, { headers, cache: 'no-store' }), fetch(`/api/lead-meta${q}`, { headers, cache: 'no-store' })]);
      const l = await lr.json();
      if (!lr.ok) throw new Error(l.error || 'Unable to load leads');
      const m = mr.ok ? await mr.json() : { meta: {} };
      setLeads(l.leads || []); setMeta(m.meta || {}); setLoggedIn(true);
      sessionStorage.setItem('anjanay-heights-crm-password', active);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load revenue data'); }
    finally { setLoading(false); }
  }

  useEffect(() => { const saved = sessionStorage.getItem('anjanay-heights-crm-password'); if (saved) void load(saved); }, []);

  const rows = useMemo(() => leads.map(lead => ({ lead, meta: meta[lead.id] || {} })).filter(x => x.meta.status === 'Negotiation' || x.meta.status === 'Closed'), [leads, meta]);
  const negotiation = rows.filter(x => x.meta.status === 'Negotiation');
  const closed = rows.filter(x => x.meta.status === 'Closed');
  const negotiationValue = negotiation.reduce((s, x) => s + amount(x.meta.dealValue), 0);
  const closedValue = closed.reduce((s, x) => s + amount(x.meta.dealValue), 0);
  const weighted = negotiation.reduce((s, x) => s + amount(x.meta.dealValue) * probability(x.meta.closingProbability) / 100, 0);
  const conversionRate = leads.length ? (closed.length / leads.length) * 100 : 0;
  const now = new Date();
  const month = now.getMonth(); const year = now.getFullYear();
  const monthlyClosed = closed.filter(x => { const d = new Date(effectiveClosedDate(x.meta)); return !Number.isNaN(d.getTime()) && d.getMonth() === month && d.getFullYear() === year; });
  const monthlyValue = monthlyClosed.reduce((s, x) => s + amount(x.meta.dealValue), 0);

  const monthlyTrend = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const d = new Date(year, month - (5 - index), 1);
    const value = closed.filter(x => { const cd = new Date(effectiveClosedDate(x.meta)); return !Number.isNaN(cd.getTime()) && cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear(); }).reduce((s, x) => s + amount(x.meta.dealValue), 0);
    return { label: d.toLocaleDateString('en-IN', { month: 'short' }), value };
  }), [closed, month, year]);
  const maxTrend = Math.max(...monthlyTrend.map(x => x.value), 1);

  if (!loggedIn) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4"><form onSubmit={e => { e.preventDefault(); void load(password); }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Sales Revenue</h1><p className="text-gray-500 text-center mt-2">Revenue & pipeline dashboard</p><label className="block mt-8 mb-2 font-semibold">Dashboard Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-xl px-4 py-3" placeholder="Enter password" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Sales Revenue'}</button></form></div>;

  return <div className="min-h-screen bg-[#F5F7FA] p-3 md:p-6"><div className="max-w-6xl mx-auto"><div className="flex flex-wrap justify-between items-center gap-3 mb-5"><div><h1 className="text-2xl md:text-3xl font-bold text-[#1A365D]">Sales Revenue Dashboard</h1><p className="text-gray-500 mt-1">Closed sales, negotiation pipeline and expected revenue</p></div><div className="flex gap-2"><button onClick={() => void load(password)} disabled={loading} className="bg-[#1A365D] text-white px-4 py-2.5 rounded-xl font-semibold">{loading ? 'Refreshing...' : 'Refresh'}</button><button onClick={() => { window.location.href = '/admin/deals'; }} className="bg-white border px-4 py-2.5 rounded-xl font-semibold">Deal Desk</button></div></div>{error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}<div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5"><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Total Closed Sales</p><p className="text-2xl font-bold mt-1">{money(closedValue)}</p><p className="text-xs text-gray-500 mt-1">{closed.length} closed deals</p></div><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">This Month</p><p className="text-2xl font-bold mt-1">{money(monthlyValue)}</p><p className="text-xs text-gray-500 mt-1">{monthlyClosed.length} closed this month</p></div><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Negotiation Pipeline</p><p className="text-2xl font-bold mt-1">{money(negotiationValue)}</p><p className="text-xs text-gray-500 mt-1">{negotiation.length} active deals</p></div><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Weighted Expected Revenue</p><p className="text-2xl font-bold mt-1">{money(weighted)}</p><p className="text-xs text-gray-500 mt-1">Probability-adjusted</p></div><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Conversion Rate</p><p className="text-2xl font-bold mt-1">{conversionRate.toFixed(1)}%</p><p className="text-xs text-gray-500 mt-1">Closed ÷ total leads</p></div></div><div className="grid lg:grid-cols-2 gap-5 mb-5"><div className="bg-white rounded-2xl border p-4"><div className="mb-4"><h2 className="font-bold text-lg text-[#1A365D]">Monthly Sales Trend</h2><p className="text-sm text-gray-500">Closed deal value — last 6 months</p></div><div className="h-56 flex items-end gap-3 border-b border-gray-100 px-2 pt-4">{monthlyTrend.map(item => <div key={item.label} className="flex-1 h-full flex flex-col justify-end items-center gap-2"><span className="text-xs text-gray-500">{item.value ? money(item.value) : '₹0'}</span><div className="w-full max-w-12 bg-[#1A365D] rounded-t-lg" style={{ height: `${Math.max(item.value ? (item.value / maxTrend) * 75 : 4, 4)}%` }} /><span className="text-xs font-semibold text-gray-600">{item.label}</span></div>)}</div></div><div className="bg-white rounded-2xl border p-4"><div className="mb-4"><h2 className="font-bold text-lg text-[#1A365D]">Sales Summary</h2><p className="text-sm text-gray-500">Negotiation + closed performance</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Active Negotiations</p><p className="text-xl font-bold">{negotiation.length}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Closed Deals</p><p className="text-xl font-bold">{closed.length}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Potential + Closed</p><p className="text-xl font-bold">{money(negotiationValue + closedValue)}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Tracked Leads</p><p className="text-xl font-bold">{leads.length}</p></div></div></div></div><div className="bg-white rounded-2xl border p-4 mb-5"><div className="flex justify-between items-center mb-4"><div><h2 className="font-bold text-lg text-[#1A365D]">Revenue Snapshot</h2><p className="text-sm text-gray-500">Current sales position</p></div><span className="text-sm font-semibold">Total tracked: {money(negotiationValue + closedValue)}</span></div><div className="grid md:grid-cols-3 gap-3"><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Closed Revenue</p><p className="text-xl font-bold">{money(closedValue)}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Expected from Negotiations</p><p className="text-xl font-bold">{money(weighted)}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Overall Conversion</p><p className="text-xl font-bold">{conversionRate.toFixed(1)}%</p></div></div></div><div className="bg-white rounded-2xl border overflow-hidden"><div className="p-4 border-b"><h2 className="font-bold text-lg text-[#1A365D]">Deal Performance</h2></div>{rows.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500 border-b"><th className="p-4">Lead</th><th className="p-4">Stage</th><th className="p-4">Deal Value</th><th className="p-4">Probability</th><th className="p-4">Closing Date</th></tr></thead><tbody>{rows.map(({ lead, meta: m }) => <tr key={lead.id} className="border-b last:border-0"><td className="p-4"><p className="font-semibold">{lead.name || 'Unnamed Lead'}</p><p className="text-xs text-gray-500">{lead.phone}</p></td><td className="p-4"><span className="border rounded-full px-2 py-1 text-xs">{m.status}</span></td><td className="p-4 font-semibold">{amount(m.dealValue) ? money(amount(m.dealValue)) : '—'}</td><td className="p-4">{m.status === 'Closed' ? '100%' : `${probability(m.closingProbability)}%`}</td><td className="p-4">{effectiveClosedDate(m) || m.expectedClosingDate || '—'}</td></tr>)}</tbody></table></div> : <div className="p-8 text-center text-gray-500">No negotiation or closed deals yet.</div>}</div></div></div>;
}
