import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name?: string; phone?: string; status?: string };
type HistoryItem = { action: string; at: string };
type Meta = {
  priority?: string;
  followUp?: string;
  nextAction?: string;
  commissionDueDate?: string;
  commissionReceived?: number | string;
  dealValue?: number | string;
  sellerCommissionRate?: number | string;
  buyerCommissionRate?: number | string;
  history?: HistoryItem[];
};

const todayIST = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function TodayActionCenter() {
  const [password, setPassword] = useState(sessionStorage.getItem('anjanay-heights-crm-password') || '');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${password}` };
      const [leadRes, metaRes] = await Promise.all([
        fetch('/api/leads', { headers }),
        fetch('/api/lead-meta', { headers }),
      ]);
      const leadJson = await leadRes.json();
      const metaJson = await metaRes.json();
      setLeads(Array.isArray(leadJson) ? leadJson : (leadJson.leads || []));
      setMeta(metaJson?.meta || metaJson || {});
      sessionStorage.setItem('anjanay-heights-crm-password', password);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (password) load(); }, []);

  const today = todayIST();
  const salesActions = useMemo(() => leads
    .map((lead) => ({ lead, meta: meta[lead.id] || {} }))
    .filter(({ lead, meta: m }) =>
      lead.status !== 'Closed' && lead.status !== 'Lost' &&
      ((m.followUp && m.followUp <= today) || m.priority === 'Hot' || m.priority === 'Very Hot' || m.nextAction === 'Follow-up')
    )
    .sort((a, b) => (a.meta.followUp || '9999').localeCompare(b.meta.followUp || '9999')),
  [leads, meta, today]);

  const commissions = useMemo(() => leads
    .map((lead) => ({ lead, meta: meta[lead.id] || {} }))
    .filter(({ lead, meta: m }) => {
      const deal = Number(m.dealValue) || 0;
      const expected = deal * (Number(m.sellerCommissionRate ?? 1) + Number(m.buyerCommissionRate ?? 0)) / 100;
      return lead.status === 'Closed' && deal > 0 && (Number(m.commissionReceived) || 0) < expected;
    }), [leads, meta]);

  const pendingAmount = (m: Meta) => Math.max(0,
    (Number(m.dealValue) || 0) * (Number(m.sellerCommissionRate ?? 1) + Number(m.buyerCommissionRate ?? 0)) / 100 - (Number(m.commissionReceived) || 0)
  );
  const overdue = commissions.filter(({ meta: m }) => m.commissionDueDate && m.commissionDueDate < today);
  const dueToday = commissions.filter(({ meta: m }) => m.commissionDueDate === today);
  const upcoming = commissions.filter(({ meta: m }) => m.commissionDueDate && m.commissionDueDate > today);

  const save = async (id: string, patch: Partial<Meta>) => {
    const next = { ...(meta[id] || {}), ...patch };
    setMeta((current) => ({ ...current, [id]: next }));
    await fetch('/api/lead-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
      body: JSON.stringify({ id, meta: next }),
    });
  };

  const call = (lead: Lead, m: Meta) => {
    if (lead.phone) window.open(`tel:${lead.phone}`);
    save(lead.id, {
      nextAction: 'Call',
      history: [...(m.history || []), { action: 'Call', at: new Date().toISOString() }],
    });
  };

  const whatsapp = (lead: Lead, message: string) => {
    if (!lead.phone) return;
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!password) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        <div className="rounded-2xl bg-white border p-5">
          <h2 className="text-xl font-bold text-[#1A365D]">🎯 Today’s Action Center</h2>
          <p className="text-sm text-slate-500 mt-1">Daily sales + commission actions in one place.</p>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="CRM password" className="mt-4 w-full max-w-sm border rounded-lg px-3 py-2" />
          <button onClick={load} className="mt-2 rounded-lg bg-[#1A365D] px-4 py-2 text-white font-semibold">Open Action Center</button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
      <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1A365D]">🎯 Today’s Action Center</h2>
            <p className="text-sm text-slate-500 mt-1">Sales follow-ups and commission collection, prioritized for today.</p>
          </div>
          <button onClick={load} className="rounded-lg border px-3 py-2 text-sm font-semibold">{loading ? 'Loading…' : '↻ Refresh'}</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-50">
          <div className="rounded-xl bg-white border p-3"><b>{salesActions.length}</b><div className="text-xs text-slate-500">Sales actions</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{overdue.length}</b><div className="text-xs text-slate-500">Overdue commission</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{dueToday.length}</b><div className="text-xs text-slate-500">Commission today</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{upcoming.length}</b><div className="text-xs text-slate-500">Upcoming collection</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{money(commissions.reduce((sum, item) => sum + pendingAmount(item.meta), 0))}</b><div className="text-xs text-slate-500">Total pending</div></div>
        </div>

        <div className="p-4 space-y-6">
          {salesActions.length > 0 && (
            <div>
              <h3 className="font-bold text-[#1A365D] mb-2">🔥 Priority Sales Actions</h3>
              {salesActions.slice(0, 10).map(({ lead, meta: m }) => (
                <div key={lead.id} className="border rounded-xl p-3 mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div><b>{lead.name || 'Lead'}</b><div className="text-xs text-slate-500">{m.priority || 'Normal'} · {m.nextAction || 'Follow-up'} · {m.followUp || 'Due today'}</div></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => call(lead, m)} className="rounded-lg bg-[#1A365D] px-3 py-2 text-xs text-white">📞 Call</button>
                    <button onClick={() => whatsapp(lead, `Hello ${lead.name || ''}, following up regarding your property requirement. Please let me know a convenient time to connect.`)} className="rounded-lg border px-3 py-2 text-xs">💬 WhatsApp</button>
                    <button onClick={() => save(lead.id, { followUp: today, nextAction: 'Follow-up' })} className="rounded-lg border px-3 py-2 text-xs">📅 Today</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {commissions.length > 0 && (
            <div>
              <h3 className="font-bold text-[#1A365D] mb-2">💰 Commission Collection Actions</h3>
              {commissions.map(({ lead, meta: m }) => (
                <div key={lead.id} className="border rounded-xl p-3 mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div><b>{lead.name || 'Closed Deal'}</b><div className="text-xs text-slate-500">{m.commissionDueDate || 'No due date'} · Pending {money(pendingAmount(m))}</div></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => whatsapp(lead, `Hello ${lead.name || ''}, this is a follow-up regarding the pending commission/payment of ${money(pendingAmount(m))}. Please let me know the expected payment date.`)} className="rounded-lg bg-[#1A365D] px-3 py-2 text-xs text-white">💬 Collection Follow-up</button>
                    <button onClick={() => save(lead.id, { followUp: today, nextAction: 'Follow-up' })} className="rounded-lg border px-3 py-2 text-xs">📅 Add to Today</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
