import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name?: string; phone?: string };
type Meta = { status?: string; priority?: string; followUp?: string; nextAction?: string; dealValue?: string; sellerCommissionRate?: string; buyerCommissionRate?: string; commissionReceived?: string };

const num = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const money = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const daysFromToday = (date?: string) => {
  if (!date) return 9999;
  const a = new Date(`${today()}T00:00:00+05:30`).getTime();
  const b = new Date(`${date}T00:00:00+05:30`).getTime();
  return Math.round((b - a) / 86400000);
};

export default function ManagementDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const password = sessionStorage.getItem('anjanay-heights-crm-password') || '';
    if (!password) return;
    const headers = { Authorization: `Bearer ${password}` };
    Promise.all([
      fetch(`/api/leads?refresh=${Date.now()}`, { headers, cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/lead-meta?refresh=${Date.now()}`, { headers, cache: 'no-store' }).then(r => r.json()),
    ]).then(([l, m]) => { setLeads(l.leads || []); setMeta(m.meta || {}); setReady(true); }).catch(() => setReady(false));
  }, []);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let pipeline = 0, closed = 0, expected = 0, received = 0;
    let overdue = 0, todayDue = 0, highPriority = 0;
    leads.forEach(lead => {
      const m = meta[lead.id] || {};
      const status = m.status || 'New';
      counts[status] = (counts[status] || 0) + 1;
      const sale = num(m.dealValue);
      const brokerage = sale * (num(m.sellerCommissionRate || '1') + num(m.buyerCommissionRate)) / 100;
      if (status === 'Closed') { closed += sale; expected += brokerage; received += num(m.commissionReceived); }
      else if (status !== 'Lost') pipeline += sale;
      const d = daysFromToday(m.followUp);
      if (d < 0 && !['Closed', 'Lost'].includes(status)) overdue += 1;
      if (d === 0 && !['Closed', 'Lost'].includes(status)) todayDue += 1;
      if (m.priority === 'High' || m.priority === 'Urgent') highPriority += 1;
    });
    const active = leads.length - (counts.Lost || 0) - (counts.Closed || 0);
    const qualified = (counts.Interested || 0) + (counts['Site Visit'] || 0) + (counts.Negotiation || 0) + (counts.Closed || 0);
    const closeRate = active + (counts.Closed || 0) ? Math.round(((counts.Closed || 0) / Math.max(1, active + (counts.Closed || 0))) * 100) : 0;
    return { counts, pipeline, closed, expected, received, pending: Math.max(0, expected - received), overdue, todayDue, highPriority, active, qualified, closeRate };
  }, [leads, meta]);

  if (!ready) return null;
  const open = (path: string) => { window.location.href = path; };

  return <section className="max-w-7xl mx-auto px-4 md:px-8 pt-5">
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="bg-[#1A365D] text-white p-5 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-wider opacity-75">Management cockpit</p><h2 className="text-2xl font-bold">📊 Business Control Dashboard</h2><p className="text-sm opacity-80 mt-1">One screen for sales, follow-ups, deals and commission collection.</p></div>
        <button onClick={() => window.location.reload()} className="rounded-lg bg-white/15 border border-white/25 px-3 py-2 text-sm font-semibold">↻ Refresh</button>
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Active Leads', stats.active, '👥'], ['High Priority', stats.highPriority, '🔥'], ['Follow-up Due', stats.todayDue, '📅'], ['Overdue', stats.overdue, '⚠️']].map(([label, value, icon]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-gray-500">{icon} {label}</p><p className="text-2xl font-bold text-[#1A365D] mt-1">{value}</p></div>)}
      </div>
      <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border p-3"><p className="text-xs text-gray-500">Pipeline Value</p><p className="text-xl font-bold">{money(stats.pipeline)}</p><p className="text-[11px] text-gray-400">Active non-lost leads</p></div>
        <div className="rounded-xl border p-3"><p className="text-xs text-gray-500">Closed Sales</p><p className="text-xl font-bold">{money(stats.closed)}</p><p className="text-[11px] text-gray-400">{stats.counts.Closed || 0} closed · {stats.closeRate}% close rate</p></div>
        <div className="rounded-xl border p-3"><p className="text-xs text-gray-500">Commission Received</p><p className="text-xl font-bold text-emerald-700">{money(stats.received)}</p><p className="text-[11px] text-gray-400">Expected {money(stats.expected)}</p></div>
        <div className="rounded-xl border p-3"><p className="text-xs text-gray-500">Commission Pending</p><p className="text-xl font-bold text-amber-700">{money(stats.pending)}</p><p className="text-[11px] text-gray-400">Collection action required</p></div>
      </div>
      <div className="px-4 pb-4"><div className="rounded-xl border p-4"><div className="flex justify-between items-center mb-3"><h3 className="font-bold text-[#1A365D]">Pipeline Health</h3><span className="text-xs text-gray-500">Qualified: {stats.qualified}</span></div><div className="grid grid-cols-3 md:grid-cols-7 gap-2">{['New','Contacted','Interested','Site Visit','Negotiation','Closed','Lost'].map(s => <div key={s} className="rounded-lg bg-slate-50 p-2 text-center"><p className="text-[11px] text-gray-500 truncate">{s}</p><p className="text-lg font-bold">{stats.counts[s] || 0}</p></div>)}</div></div></div>
      <div className="px-4 pb-5 flex flex-wrap gap-2">
        <button onClick={() => open('/admin/workspace')} className="rounded-lg bg-green-700 text-white px-3 py-2 text-sm font-semibold">🎯 Sales Control</button>
        <button onClick={() => open('/admin/daily-followups')} className="rounded-lg bg-[#1A365D] text-white px-3 py-2 text-sm font-semibold">📅 Follow-ups</button>
        <button onClick={() => open('/admin/deals')} className="rounded-lg bg-emerald-700 text-white px-3 py-2 text-sm font-semibold">🤝 Deals</button>
        <button onClick={() => open('/admin/commission')} className="rounded-lg border border-emerald-700 text-emerald-700 px-3 py-2 text-sm font-semibold">🧾 Commission</button>
        <button onClick={() => open('/admin/source-funnel')} className="rounded-lg border border-[#1A365D] text-[#1A365D] px-3 py-2 text-sm font-semibold">📈 Source Funnel</button>
      </div>
    </div>
  </section>;
}
