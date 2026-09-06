import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string; phone: string };
type Meta = { status?: string; dealValue?: string; sellerCommissionRate?: string; buyerCommissionRate?: string; commissionReceived?: string; commissionStatus?: string; sellerPaymentDate?: string; sellerPaymentMode?: string; sellerReceiptNo?: string; buyerPaymentDate?: string; buyerPaymentMode?: string; buyerReceiptNo?: string };
const amount = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const pct = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const money = (v: number) => `₹${v.toLocaleString('en-IN')}`;

export default function CommissionCollectionTracker() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<'All'|'Pending'|'Partial'|'Received'>('All');
  const load = async () => {
    const password = sessionStorage.getItem('anjanay-heights-crm-password') || '';
    if (!password) return;
    const headers = { Authorization: `Bearer ${password}`, 'Cache-Control': 'no-cache' };
    try {
      const [lr, mr] = await Promise.all([
        fetch(`/api/leads?refresh=${Date.now()}`, { headers, cache: 'no-store' }).then(r => r.json()),
        fetch(`/api/lead-meta?refresh=${Date.now()}`, { headers, cache: 'no-store' }).then(r => r.json())
      ]);
      setLeads(lr.leads || []); setMeta(mr.meta || {}); setReady(true);
    } catch { setReady(false); }
  };
  useEffect(() => { void load(); }, []);
  const rows = useMemo(() => leads.filter(l => meta[l.id]?.status === 'Closed').map(lead => {
    const m = meta[lead.id] || {};
    const sale = amount(m.dealValue);
    const expected = sale * (pct(m.sellerCommissionRate || '1') + pct(m.buyerCommissionRate)) / 100;
    const received = amount(m.commissionReceived);
    const status = m.commissionStatus || (received >= expected && expected > 0 ? 'Received' : received > 0 ? 'Partial' : 'Pending');
    return { lead, m, expected, received, pending: Math.max(0, expected - received), status };
  }).filter(r => filter === 'All' || r.status === filter), [leads, meta, filter]);
  const totals = useMemo(() => rows.reduce((s, r) => ({ expected: s.expected+r.expected, received: s.received+r.received, pending: s.pending+r.pending }), {expected:0,received:0,pending:0}), [rows]);
  if (!ready) return null;
  return <section className="max-w-7xl mx-auto px-4 md:px-8 pt-5"><div className="rounded-2xl border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-[#1A365D]">🧾 Commission Collection Tracker</h2><p className="text-sm text-gray-500">Track expected, received and pending brokerage after every closed deal.</p></div><button onClick={() => void load()} className="border rounded-lg px-3 py-2 text-sm font-semibold">Refresh</button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4"><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Expected</p><p className="text-xl font-bold">{money(totals.expected)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Received</p><p className="text-xl font-bold">{money(totals.received)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold">{money(totals.pending)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Collection Rate</p><p className="text-xl font-bold">{totals.expected ? Math.round(totals.received/totals.expected*100) : 0}%</p></div></div><div className="flex flex-wrap gap-2 mt-4">{(['All','Pending','Partial','Received'] as const).map(x => <button key={x} onClick={() => setFilter(x)} className={`px-3 py-2 rounded-lg text-sm font-semibold ${filter===x?'bg-[#1A365D] text-white':'border bg-white'}`}>{x}</button>)}</div><div className="mt-4 space-y-2">{rows.map(r => <div key={r.lead.id} className="border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">{r.lead.name || 'Unnamed Lead'}</p><p className="text-xs text-gray-500">{r.lead.phone}</p></div><div className="text-sm">Expected <b>{money(r.expected)}</b></div><div className="text-sm">Received <b>{money(r.received)}</b></div><div className="text-sm">Pending <b>{money(r.pending)}</b></div><span className="text-xs rounded-full border px-2 py-1 font-semibold">{r.status}</span></div>)}{rows.length===0 && <p className="text-sm text-gray-500 py-4 text-center">No closed deals in this filter.</p>}</div></div></section>;
}
