import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name?: string };
type Meta = { status?: string; dealValue?: string | number; closingProbability?: string | number; followUp?: string };

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

export default function SalesPerformanceSnapshot() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const password = sessionStorage.getItem('anjanay-heights-crm-password');
    if (!password) return;
    const headers = { Authorization: `Bearer ${password}` };
    Promise.all([
      fetch(`/api/leads?_refresh=${Date.now()}`, { headers, cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/lead-meta?_refresh=${Date.now()}`, { headers, cache: 'no-store' }).then(r => r.json())
    ]).then(([l, m]) => {
      setLeads(l.leads || []);
      setMeta(m.meta || {});
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const stats = useMemo(() => {
    let pipeline = 0;
    let closed = 0;
    let weighted = 0;
    let due = 0;
    const t = todayIST();
    leads.forEach(l => {
      const m = meta[l.id] || {};
      const value = Number(String(m.dealValue || '').replace(/[^0-9.]/g, '')) || 0;
      const status = m.status || 'New';
      if (status === 'Closed') closed += value;
      if (!['Closed', 'Lost'].includes(status)) {
        pipeline += value;
        const probability = Math.min(100, Math.max(0, Number(m.closingProbability) || 25));
        weighted += value * probability / 100;
      }
      if (!['Closed', 'Lost'].includes(status) && String(m.followUp || '').slice(0, 10) === t) due++;
    });
    return { pipeline, closed, weighted, due };
  }, [leads, meta]);

  if (!loaded || !leads.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
      <div className="rounded-2xl bg-white border shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#1A365D]">📊 Sales Performance & Forecast</h2>
            <p className="text-sm text-slate-500 mt-1">Live snapshot from current CRM lead and deal data.</p>
          </div>
          <span className="text-xs font-semibold rounded-full border px-3 py-1">Forecast = probability-weighted pipeline</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="rounded-xl border p-4"><p className="text-xs text-slate-500">Active pipeline</p><b className="text-xl">{money(stats.pipeline)}</b></div>
          <div className="rounded-xl border p-4"><p className="text-xs text-slate-500">Weighted forecast</p><b className="text-xl text-[#1A365D]">{money(stats.weighted)}</b></div>
          <div className="rounded-xl border p-4"><p className="text-xs text-slate-500">Closed sales</p><b className="text-xl text-emerald-700">{money(stats.closed)}</b></div>
          <div className="rounded-xl border p-4"><p className="text-xs text-slate-500">Follow-ups today</p><b className="text-xl">{stats.due}</b></div>
        </div>
      </div>
    </section>
  );
}
