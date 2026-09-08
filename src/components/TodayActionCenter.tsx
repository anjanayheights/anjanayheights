import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name?: string; phone?: string; status?: string };
type HistoryItem = { id?: string; action: string; at: string };
type Meta = {
  priority?: string;
  followUp?: string;
  nextAction?: string;
  commissionDueDate?: string;
  commissionReceived?: number | string;
  dealValue?: number | string;
  sellerCommissionRate?: number | string;
  buyerCommissionRate?: number | string;
  commissionStatus?: string;
  history?: HistoryItem[];
};

const todayIST = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

const addDays = (date: string, days: number) => {
  const [y, m, d] = date.split('-').map(Number);
  const value = new Date(Date.UTC(y, m - 1, d + days));
  return value.toISOString().slice(0, 10);
};

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const activityId = (action: string) => `action-${action.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const nextStep = (status: string, today: string) => {
  switch (status) {
    case 'Contacted': return { action: 'Follow-up', date: addDays(today, 1) };
    case 'Interested': return { action: 'Confirm Site Visit', date: addDays(today, 2) };
    case 'Site Visit': return { action: 'Follow-up', date: addDays(today, 2) };
    case 'Negotiation': return { action: 'Follow-up', date: addDays(today, 1) };
    default: return { action: 'Follow-up', date: addDays(today, 1) };
  }
};

export default function TodayActionCenter() {
  const [password, setPassword] = useState(sessionStorage.getItem('anjanay-heights-crm-password') || '');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!password) return;
    setLoading(true); setMessage('');
    try {
      const headers = { Authorization: `Bearer ${password}` };
      const [leadRes, metaRes] = await Promise.all([
        fetch('/api/leads', { headers, cache: 'no-store' }),
        fetch('/api/lead-meta', { headers, cache: 'no-store' }),
      ]);
      const leadJson = await leadRes.json();
      const metaJson = await metaRes.json();
      setLeads(Array.isArray(leadJson) ? leadJson : (leadJson.leads || []));
      setMeta(metaJson?.meta || metaJson || {});
      sessionStorage.setItem('anjanay-heights-crm-password', password);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load Action Center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (password) void load(); }, []);

  const today = todayIST();

  const salesActions = useMemo(() => leads
    .map((lead) => ({ lead, meta: meta[lead.id] || {} }))
    .filter(({ lead, meta: m }) =>
      lead.status !== 'Closed' && lead.status !== 'Lost' &&
      ((m.followUp && m.followUp <= today) || m.priority === 'Hot' || m.priority === 'Very Hot' || m.nextAction === 'Follow-up' || m.nextAction === 'Confirm Site Visit')
    )
    .sort((a, b) => {
      const priorityRank = (value?: string) => value === 'Very Hot' ? 0 : value === 'Hot' ? 1 : value === 'Warm' ? 2 : 3;
      return priorityRank(a.meta.priority) - priorityRank(b.meta.priority) || (a.meta.followUp || '9999').localeCompare(b.meta.followUp || '9999');
    }), [leads, meta, today]);

  const overdueSales = salesActions.filter(({ meta: m }) => !!m.followUp && m.followUp < today);
  const dueTodaySales = salesActions.filter(({ meta: m }) => !m.followUp || m.followUp === today);
  const futureSales = salesActions.filter(({ meta: m }) => !!m.followUp && m.followUp > today);

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
    const previous = meta[id] || {};
    const next = { ...previous, ...patch };
    setMeta((current) => ({ ...current, [id]: next }));
    try {
      const response = await fetch('/api/lead-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ id, meta: patch }),
      });
      if (!response.ok) throw new Error('Unable to save CRM action');
    } catch (error) {
      setMeta((current) => ({ ...current, [id]: previous }));
      throw error;
    }
  };

  const pipelineAction = async (lead: Lead, action: string, status: string) => {
    const current = meta[lead.id] || {};
    const next = nextStep(status, today);
    const history = [...(current.history || []), { id: activityId(action), action, at: new Date().toISOString() }];
    try {
      await save(lead.id, { status, nextAction: next.action, followUp: next.date, history });
      setMessage(`${lead.name || 'Lead'} → ${status}. Next follow-up: ${next.action} on ${next.date}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update lead');
    }
  };

  const call = async (lead: Lead, m: Meta) => {
    if (lead.phone) window.open(`tel:${lead.phone}`);
    const next = nextStep('Contacted', today);
    try {
      await save(lead.id, {
        nextAction: next.action,
        followUp: next.date,
        history: [...(m.history || []), { id: activityId('Call'), action: 'Call', at: new Date().toISOString() }],
      });
      setMessage(`${lead.name || 'Lead'} called. Next follow-up set for ${next.date}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save call action');
    }
  };

  const whatsapp = async (lead: Lead, message: string) => {
    if (!lead.phone) return;
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    try {
      const next = nextStep('Contacted', today);
      await save(lead.id, { nextAction: next.action, followUp: next.date, history: [...(meta[lead.id]?.history || []), { id: activityId('WhatsApp'), action: 'WhatsApp', at: new Date().toISOString() }] });
      setMessage(`${lead.name || 'Lead'} WhatsApp follow-up logged. Next follow-up: ${next.date}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save WhatsApp action');
    }
  };

  if (!password) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        <div className="rounded-2xl bg-white border p-5">
          <h2 className="text-xl font-bold text-[#1A365D]">🎯 Today’s Action Center</h2>
          <p className="text-sm text-slate-500 mt-1">Daily sales + commission actions in one place.</p>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="CRM password" className="mt-4 w-full max-w-sm border rounded-lg px-3 py-2" />
          <button onClick={() => void load()} className="mt-2 rounded-lg bg-[#1A365D] px-4 py-2 text-white font-semibold">Open Action Center</button>
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
            <p className="text-sm text-slate-500 mt-1">Priority → action → automatic next follow-up.</p>
          </div>
          <button onClick={() => void load()} className="rounded-lg border px-3 py-2 text-sm font-semibold">{loading ? 'Loading…' : '↻ Refresh'}</button>
        </div>

        {message && <div className="px-5 py-3 text-sm font-medium text-slate-600 bg-slate-50 border-b">{message}</div>}

        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 p-4 bg-slate-50">
          <div className="rounded-xl bg-white border p-3"><b>{overdueSales.length}</b><div className="text-xs text-slate-500">Overdue leads</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{dueTodaySales.length}</b><div className="text-xs text-slate-500">Due today</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{futureSales.length}</b><div className="text-xs text-slate-500">Upcoming</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{salesActions.length}</b><div className="text-xs text-slate-500">Sales actions</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{overdue.length}</b><div className="text-xs text-slate-500">Overdue commission</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{dueToday.length}</b><div className="text-xs text-slate-500">Commission today</div></div>
          <div className="rounded-xl bg-white border p-3"><b>{money(commissions.reduce((sum, item) => sum + pendingAmount(item.meta), 0))}</b><div className="text-xs text-slate-500">Pending commission</div></div>
        </div>

        <div className="p-4 space-y-6">
          {salesActions.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-[#1A365D]">🔥 Priority Sales Actions</h3>
                <span className="text-xs text-slate-500">{overdueSales.length} overdue · {dueTodaySales.length} today</span>
              </div>
              {salesActions.slice(0, 12).map(({ lead, meta: m }) => (
                <div key={lead.id} className="border rounded-xl p-3 mb-2 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <b>{lead.name || 'Lead'}</b>
                      <div className="text-xs text-slate-500">{m.priority || 'Normal'} · {lead.status || 'New'} · Next: {m.nextAction || 'Follow-up'} · {m.followUp || 'Due today'}</div>
                    </div>
                    <div className="text-xs font-semibold text-slate-600">1-click + auto next step</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void call(lead, m)} className="rounded-lg bg-[#1A365D] px-3 py-2 text-xs text-white">📞 Call</button>
                    <button onClick={() => void whatsapp(lead, `Hello ${lead.name || ''}, following up regarding your property requirement. Please let me know a convenient time to connect.`)} className="rounded-lg border px-3 py-2 text-xs">💬 WhatsApp</button>
                    <button onClick={() => void pipelineAction(lead, 'Contacted', 'Contacted')} className="rounded-lg border px-3 py-2 text-xs">✅ Contacted</button>
                    <button onClick={() => void pipelineAction(lead, 'Interested', 'Interested')} className="rounded-lg border px-3 py-2 text-xs">👍 Interested</button>
                    <button onClick={() => void pipelineAction(lead, 'Site Visit', 'Site Visit')} className="rounded-lg border px-3 py-2 text-xs">📅 Site Visit</button>
                    <button onClick={() => void pipelineAction(lead, 'Negotiation', 'Negotiation')} className="rounded-lg border px-3 py-2 text-xs">🤝 Negotiation</button>
                    <button onClick={() => void save(lead.id, { followUp: today, nextAction: 'Follow-up' }).then(() => setMessage(`${lead.name || 'Lead'} added to today.`)).catch((e) => setMessage(e instanceof Error ? e.message : 'Unable to update lead'))} className="rounded-lg border px-3 py-2 text-xs">🔄 Follow-up Today</button>
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
                  <div>
                    <b>{lead.name || 'Closed Deal'}</b>
                    <div className="text-xs text-slate-500">{m.commissionDueDate || 'No due date'} · Pending {money(pendingAmount(m))}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void whatsapp(lead, `Hello ${lead.name || ''}, this is a follow-up regarding the pending commission/payment of ${money(pendingAmount(m))}. Please let me know the expected payment date.`)} className="rounded-lg bg-[#1A365D] px-3 py-2 text-xs text-white">💬 Collection Follow-up</button>
                    <button onClick={() => void save(lead.id, { followUp: today, nextAction: 'Follow-up' }).then(() => setMessage(`${lead.name || 'Lead'} added to today.`)).catch((e) => setMessage(e instanceof Error ? e.message : 'Unable to update lead'))} className="rounded-lg border px-3 py-2 text-xs">📅 Add to Today</button>
                    <button onClick={() => void save(lead.id, { commissionReceived: Number(m.dealValue || 0) * (Number(m.sellerCommissionRate ?? 1) + Number(m.buyerCommissionRate ?? 0)) / 100, commissionStatus: 'Received' }).then(() => setMessage(`${lead.name || 'Deal'} marked as received.`)).catch((e) => setMessage(e instanceof Error ? e.message : 'Unable to update commission'))} className="rounded-lg border px-3 py-2 text-xs">✅ Mark Received</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!salesActions.length && !commissions.length && (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
              ✅ No urgent sales or commission collection actions right now.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
