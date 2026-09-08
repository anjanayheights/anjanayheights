import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string };
type Meta = { status?: string; dealValue?: string; sellerCommissionRate?: string; buyerCommissionRate?: string; commissionReceived?: string };
const amount = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const pct = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const money = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;
const rate = (v: number, base: number) => base ? `${Math.round((v / base) * 100)}%` : '0%';

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

  const stats = useMemo(() => {
    const stages = ['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost'];
    const counts = Object.fromEntries(stages.map(s => [s, 0])) as Record<string, number>;
    let pipelineValue = 0;
    let closedSales = 0;
    let expectedBrokerage = 0;
    let received = 0;
    leads.forEach(l => {
      const m = meta[l.id] || {};
      const status = m.status || 'New';
      counts[status] = (counts[status] || 0) + 1;
      const sale = amount(m.dealValue);
      const brokerage = sale * (pct(m.sellerCommissionRate || '1') + pct(m.buyerCommissionRate)) / 100;
      if (status === 'Closed') {
        closedSales += sale;
        expectedBrokerage += brokerage;
        received += amount(m.commissionReceived);
      } else if (!['Lost'].includes(status)) {
        pipelineValue += sale;
      }
    });
    const pending = Math.max(0, expectedBrokerage - received);
    const conversion = rate(counts.Closed, Math.max(1, leads.length - counts.Lost));
    const visitRate = rate(counts['Site Visit'] + counts.Negotiation + counts.Closed, Math.max(1, leads.length - counts.Lost));
    return { counts, pipelineValue, closedSales, expectedBrokerage, received, pending, conversion, visitRate };
  }, [leads, meta]);

  if (!ready) return null;
  return <section className="max-w-7xl mx-auto px-4 md:px-8 pt-5"><div className="rounded-2xl border bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3"><div><h2 className="text-lg font-bold text-[#1A365D]">💰 Sales, Revenue & Commission Intelligence</h2><p className="text-sm text-gray-500">Live funnel, pipeline value and closed-deal brokerage from CRM data.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => { window.location.href = '/admin/revenue'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">💰 Revenue</button><button onClick={() => { window.location.href = '/admin/commission'; }} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">🧾 Commission</button><button onClick={() => { window.location.href = '/admin/deals'; }} className="rounded-lg border border-[#1A365D] px-3 py-2 text-sm font-semibold text-[#1A365D]">🤝 Deal Desk</button><button onClick={() => window.location.reload()} className="border rounded-lg px-3 py-2 text-sm font-semibold">Refresh</button></div></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Active Pipeline</p><p className="text-xl font-bold">{money(stats.pipelineValue)}</p><p className="text-[11px] text-gray-400">{stats.counts.New + stats.counts.Contacted + stats.counts.Interested + stats.counts['Site Visit'] + stats.counts.Negotiation} active</p></div>
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Closed Sales</p><p className="text-xl font-bold">{money(stats.closedSales)}</p><p className="text-[11px] text-gray-400">{stats.counts.Closed} closed · {stats.conversion} conversion</p></div>
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Expected Brokerage</p><p className="text-xl font-bold">{money(stats.expectedBrokerage)}</p><p className="text-[11px] text-gray-400">Received {money(stats.received)}</p></div>
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Commission Pending</p><p className="text-xl font-bold">{money(stats.pending)}</p><p className="text-[11px] text-gray-400">Collection follow-up required</p></div>
    </div>
    <div className="mt-4 rounded-xl border bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2 mb-2"><p className="text-sm font-bold text-[#1A365D]">Sales Funnel</p><p className="text-xs text-gray-500">Lead → Site Visit/Nego: {stats.visitRate}</p></div><div className="grid grid-cols-3 md:grid-cols-7 gap-2">{['New','Contacted','Interested','Site Visit','Negotiation','Closed','Lost'].map(stage => <div key={stage} className="rounded-lg bg-gray-50 px-2 py-2 text-center"><p className="text-[11px] text-gray-500 truncate">{stage}</p><p className="text-lg font-bold">{stats.counts[stage]}</p></div>)}</div></div>
  </div></section>;
}
