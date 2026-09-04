import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string; phone: string };
type Meta = { status: string; dealValue?: string; sellerCommissionRate?: string; buyerCommissionRate?: string; commissionReceived?: string; commissionStatus?: string; commissionNotes?: string };

const amount = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const pct = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const money = (v: number) => `₹${v.toLocaleString('en-IN')}`;

export default function CommissionDashboard() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [selected, setSelected] = useState<Lead | null>(null);
  const [form, setForm] = useState<Meta>({ status: 'Closed', sellerCommissionRate: '', buyerCommissionRate: '', commissionReceived: '', commissionStatus: 'Pending', commissionNotes: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const getMeta = (id: string): Meta => meta[id] || { status: 'New' };

  async function load(p?: string) {
    const active = p || password || sessionStorage.getItem('anjanay-heights-crm-password') || '';
    if (!active) { setError('Please enter your dashboard password.'); return; }
    setPassword(active); setLoading(true); setError('');
    try {
      const q = `?refresh=${Date.now()}`;
      const headers = { Authorization: `Bearer ${active}`, 'Cache-Control': 'no-cache' };
      const [lr, mr] = await Promise.all([fetch(`/api/leads${q}`, { headers, cache: 'no-store' }), fetch(`/api/lead-meta${q}`, { headers, cache: 'no-store' })]);
      const l = await lr.json(); if (!lr.ok) throw new Error(l.error || 'Unable to load leads');
      const m = mr.ok ? await mr.json() : { meta: {} };
      setLeads(l.leads || []); setMeta(m.meta || {}); setLoggedIn(true); sessionStorage.setItem('anjanay-heights-crm-password', active);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load commission data'); }
    finally { setLoading(false); }
  }
  useEffect(() => { const saved = sessionStorage.getItem('anjanay-heights-crm-password'); if (saved) void load(saved); }, []);

  const closed = useMemo(() => leads.filter(l => getMeta(l.id).status === 'Closed'), [leads, meta]);
  const totals = useMemo(() => closed.reduce((s, l) => {
    const m = getMeta(l.id); const sale = amount(m.dealValue); const seller = sale * pct(m.sellerCommissionRate) / 100; const buyer = sale * pct(m.buyerCommissionRate) / 100; const total = seller + buyer; return { sales: s.sales + sale, brokerage: s.brokerage + total, received: s.received + amount(m.commissionReceived), pending: s.pending + Math.max(0, total - amount(m.commissionReceived)) };
  }, { sales: 0, brokerage: 0, received: 0, pending: 0 }), [closed, meta]);

  function open(lead: Lead) { const m = getMeta(lead.id); setSelected(lead); setForm({ ...m, commissionStatus: m.commissionStatus || 'Pending' }); }
  async function save() {
    if (!selected) return; setSaving(true); setError('');
    const next = { ...getMeta(selected.id), ...form };
    try {
      const r = await fetch('/api/lead-meta', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ leadId: selected.id, meta: next }) });
      if (!r.ok) { const x = await r.json().catch(() => ({})); throw new Error(x.error || 'Could not save commission'); }
      setMeta(v => ({ ...v, [selected.id]: next })); setSelected(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save commission'); }
    finally { setSaving(false); }
  }

  if (!loggedIn) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4"><form onSubmit={e => { e.preventDefault(); void load(password); }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Commission Dashboard</h1><p className="text-gray-500 text-center mt-2">Brokerage & collection tracking</p><label className="block mt-8 mb-2 font-semibold">Dashboard Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-xl px-4 py-3" placeholder="Enter password" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Dashboard'}</button></form></div>;

  return <div className="min-h-screen bg-[#F5F7FA] p-3 md:p-6"><div className="max-w-6xl mx-auto"><div className="flex flex-wrap justify-between items-center gap-3 mb-5"><div><h1 className="text-2xl md:text-3xl font-bold text-[#1A365D]">Commission & Brokerage</h1><p className="text-gray-500 mt-1">Track seller commission, buyer commission and collections</p></div><button onClick={() => void load(password)} disabled={loading} className="bg-[#1A365D] text-white px-4 py-2.5 rounded-xl font-semibold">{loading ? 'Refreshing...' : 'Refresh'}</button></div>{error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}<div className="grid md:grid-cols-4 gap-3 mb-5"><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Closed Sales</p><p className="text-2xl font-bold">{money(totals.sales)}</p></div><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Total Brokerage</p><p className="text-2xl font-bold">{money(totals.brokerage)}</p></div><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Received</p><p className="text-2xl font-bold">{money(totals.received)}</p></div><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold">{money(totals.pending)}</p></div></div><div className="bg-white border rounded-2xl overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50"><tr><th className="p-4">Lead</th><th className="p-4">Sale Value</th><th className="p-4">Seller %</th><th className="p-4">Buyer %</th><th className="p-4">Total Brokerage</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{closed.map(lead => { const m = getMeta(lead.id); const sale = amount(m.dealValue); const total = sale * (pct(m.sellerCommissionRate) + pct(m.buyerCommissionRate)) / 100; return <tr key={lead.id} className="border-t"><td className="p-4"><b>{lead.name || 'Unnamed Lead'}</b><div className="text-gray-500">{lead.phone}</div></td><td className="p-4">{money(sale)}</td><td className="p-4">{m.sellerCommissionRate || '—'}</td><td className="p-4">{m.buyerCommissionRate || '—'}</td><td className="p-4 font-semibold">{money(total)}</td><td className="p-4">{m.commissionStatus || 'Pending'}</td><td className="p-4"><button onClick={() => open(lead)} className="bg-[#1A365D] text-white px-3 py-2 rounded-lg font-semibold">Update</button></td></tr>})}</tbody></table>{closed.length === 0 && <div className="p-8 text-center text-gray-500">No closed deals yet.</div>}</div></div>{selected && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5"><h2 className="text-xl font-bold text-[#1A365D]">Commission — {selected.name}</h2><p className="text-sm text-gray-500 mt-1">{selected.phone}</p><label className="block mt-4 text-sm font-semibold">Seller commission %<input value={form.sellerCommissionRate || ''} onChange={e => setForm(v => ({ ...v, sellerCommissionRate: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="e.g. 1" /></label><label className="block mt-3 text-sm font-semibold">Buyer commission %<input value={form.buyerCommissionRate || ''} onChange={e => setForm(v => ({ ...v, buyerCommissionRate: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="e.g. 1" /></label><label className="block mt-3 text-sm font-semibold">Commission received<input value={form.commissionReceived || ''} onChange={e => setForm(v => ({ ...v, commissionReceived: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="e.g. 200000" /></label><label className="block mt-3 text-sm font-semibold">Collection status<select value={form.commissionStatus || 'Pending'} onChange={e => setForm(v => ({ ...v, commissionStatus: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2"><option>Pending</option><option>Partial</option><option>Received</option></select></label><label className="block mt-3 text-sm font-semibold">Commission notes<textarea value={form.commissionNotes || ''} onChange={e => setForm(v => ({ ...v, commissionNotes: e.target.value }))} rows={3} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Seller/buyer commission agreement, payment details..." /></label><div className="flex gap-2 mt-5"><button onClick={() => setSelected(null)} className="flex-1 border rounded-xl py-2.5 font-semibold">Cancel</button><button onClick={() => void save()} disabled={saving} className="flex-1 bg-[#1A365D] text-white rounded-xl py-2.5 font-semibold">{saving ? 'Saving...' : 'Save Commission'}</button></div></div></div>}</div>;
}
