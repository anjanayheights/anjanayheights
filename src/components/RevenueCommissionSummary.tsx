import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string };
type Meta = { status?: string; dealValue?: string; sellerCommissionRate?: string; buyerCommissionRate?: string; commissionReceived?: string };
const amount = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const pct = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const money = (v: number) => `₹${v.toLocaleString('en-IN')}`;

export default function RevenueCommissionSummary() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const password = sessionStorage.getItem('anjanay-heights-crm-password') || '';
    if (!password) return;
    const headers = { Authorization: `Bearer ${password}` };
    Promise.all([
      fetch(`/api/leads?refresh=${Date.now()}`, { headers, cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/lead-meta?refresh=${Date.now()}`, { headers, cache: 'no-store' }).then(r => r.json())
    ]).then(([l, m]) => { setLeads(l.leads || []); setMeta(m.meta || {}); setReady(true); }).catch(() => setReady(false));
  }, []);
  const totals = useMemo(() => leads.filter(l => meta[l.id]?.status === 'Closed').reduce((s, l) => {
    const m = meta[l.id] || {}; const sale = amount(m.dealValue); const seller = sale * pct(m.sellerCommissionRate || '1') / 100; const buyer = sale * pct(m.buyerCommissionRate) / 100; const total = seller + buyer;
    return { sales: s.sales + sale, brokerage: s.brokerage + total, received: s.received + amount(m.commissionReceived), pending: s.pending + Math.max(0, total - amount(m.commissionReceived)) };
  }, { sales: 0, brokerage: 0, received: 0, pending: 0 }), [leads, meta]);
  if (!ready) return null;
  return <section className="max-w-7xl mx-auto px-4 md:px-8 pt-5"><div className="rounded-2xl border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2 mb-3"><div><h2 className="text-lg font-bold text-[#1A365D]">💰 Revenue & Commission Snapshot</h2><p className="text-sm text-gray-500">Closed deals automatically flow into revenue and brokerage totals.</p></div><button onClick={() => window.location.reload()} className="border rounded-lg px-3 py-2 text-sm font-semibold">Refresh</button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Closed Sales</p><p className="text-xl font-bold">{money(totals.sales)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Expected Brokerage</p><p className="text-xl font-bold">{money(totals.brokerage)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Commission Received</p><p className="text-xl font-bold">{money(totals.received)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Commission Pending</p><p className="text-xl font-bold">{money(totals.pending)}</p></div></div></div></section>;
}
