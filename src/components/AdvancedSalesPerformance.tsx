import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name?: string; source?: string; createdAt?: string };
type Meta = { status?: string; dealValue?: string | number; closingProbability?: string | number; followUp?: string };

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const pct = (n: number) => `${Math.round(n)}%`;

export default function AdvancedSalesPerformance() {
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
    const stages = ['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost'];
    const counts: Record<string, number> = Object.fromEntries(stages.map(s => [s, 0]));
    const sources: Record<string, { leads: number; qualified: number; closed: number; value: number }> = {};
    let active = 0, qualified = 0, closed = 0, closedValue = 0, pipeline = 0, weighted = 0;

    leads.forEach(l => {
      const m = meta[l.id] || {};
      const status = m.status || 'New';
      const value = Number(String(m.dealValue || '').replace(/[^0-9.]/g, '')) || 0;
      counts[status] = (counts[status] || 0) + 1;
      const source = String(l.source || 'Unknown').trim() || 'Unknown';
      if (!sources[source]) sources[source] = { leads: 0, qualified: 0, closed: 0, value: 0 };
      sources[source].leads++;
      if (['Interested', 'Site Visit', 'Negotiation', 'Closed'].includes(status)) { qualified++; sources[source].qualified++; }
      if (status === 'Closed') { closed++; closedValue += value; sources[source].closed++; sources[source].value += value; }
      if (!['Closed', 'Lost'].includes(status)) {
        active++;
        pipeline += value;
        const probability = Math.min(100, Math.max(0, Number(m.closingProbability) || 25));
        weighted += value * probability / 100;
      }
    });

    const total = leads.length;
    const stageRates = stages.slice(0, -1).map((stage, i) => {
      const next = stages[i + 1];
      const from = counts[stage] || 0;
      const to = counts[next] || 0;
      return { stage, next, rate: from ? Math.min(100, (to / from) * 100) : 0 };
    });
    const sourceRows = Object.entries(sources).map(([source, x]) => ({ source, ...x, closeRate: x.leads ? x.closed / x.leads * 100 : 0 })).sort((a, b) => b.closed - a.closed || b.qualified - a.qualified || b.leads - a.leads);
    const topSource = [...sourceRows].sort((a, b) => b.qualified - a.qualified || b.leads - a.leads)[0];
    const bestCloser = sourceRows.find(x => x.closed > 0);
    return { total, active, qualified, closed, closedValue, pipeline, weighted, counts, stageRates, sourceRows, topSource, bestCloser, closeRate: total ? closed / total * 100 : 0 };
  }, [leads, meta]);

  if (!loaded || !leads.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
      <div className="rounded-2xl bg-white border shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#1A365D]">🚀 Advanced Sales Performance</h2>
            <p className="text-sm text-slate-500 mt-1">Conversion, source quality and forecast intelligence from live CRM data.</p>
          </div>
          <span className="text-xs font-semibold rounded-full border px-3 py-1">Live CRM view</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="rounded-xl border p-4"><p className="text-xs text-slate-500">Active leads</p><b className="text-xl">{stats.active}</b></div>
          <div className="rounded-xl border p-4"><p className="text-xs text-slate-500">Qualified</p><b className="text-xl">{stats.qualified}</b></div>
          <div className="rounded-xl border p-4"><p className="text-xs text-slate-500">Close rate</p><b className="text-xl text-emerald-700">{pct(stats.closeRate)}</b></div>
          <div className="rounded-xl border p-4"><p className="text-xs text-slate-500">Pipeline</p><b className="text-xl">{money(stats.pipeline)}</b></div>
          <div className="rounded-xl border p-4"><p className="text-xs text-slate-500">Weighted forecast</p><b className="text-xl text-[#1A365D]">{money(stats.weighted)}</b></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="rounded-xl border p-4">
            <h3 className="font-bold text-[#1A365D]">Stage conversion</h3>
            <div className="mt-3 space-y-2">{stats.stageRates.map(x => <div key={x.stage} className="flex items-center justify-between text-sm"><span>{x.stage} → {x.next}</span><b>{pct(x.rate)}</b></div>)}</div>
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-bold text-[#1A365D]">Source performance</h3>
            <div className="mt-3 space-y-2">{stats.sourceRows.slice(0, 5).map(x => <div key={x.source} className="flex items-center justify-between text-sm"><span>{x.source} · {x.leads} leads</span><b>{x.closed} closed</b></div>)}</div>
            <p className="text-xs text-slate-500 mt-3">Top qualified source: <b>{stats.topSource?.source || '—'}</b> · Best closing source: <b>{stats.bestCloser?.source || '—'}</b></p>
          </div>
        </div>
      </div>
    </section>
  );
}
