import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name?: string; phone?: string; status?: string };
type HistoryItem = { id?: string; action: string; at: string };
type Meta = {
  status?: string;
  priority?: string;
  followUp?: string;
  nextAction?: string;
  lastContactAt?: string;
  lastContactChannel?: 'Call' | 'WhatsApp';
  callOutcome?: string;
  commissionDueDate?: string;
  commissionReceived?: number | string;
  dealValue?: number | string;
  sellerCommissionRate?: number | string;
  buyerCommissionRate?: number | string;
  commissionStatus?: string;
  history?: HistoryItem[];
};

const todayIST = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

const addDays = (date: string, days: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const activityId = (action: string) => `action-${action.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const nextStep = (status: string, today: string) => {
  switch (status) {
    case 'Interested': return { action: 'Confirm Site Visit', date: addDays(today, 2) };
    case 'Site Visit': return { action: 'Follow-up', date: addDays(today, 2) };
    case 'Negotiation': return { action: 'Follow-up', date: addDays(today, 1) };
    case 'Contacted': return { action: 'Follow-up', date: addDays(today, 1) };
    default: return { action: 'Follow-up', date: addDays(today, 1) };
  }
};

const stageMessage = (lead: Lead) => {
  const name = lead.name || 'there';
  switch (lead.status) {
    case 'Interested': return `Hello ${name}, thank you for your interest. I wanted to confirm a convenient time for your site visit. Please share your preferred day and time.`;
    case 'Site Visit': return `Hello ${name}, following up after your site visit. Please let me know your feedback and if you would like to discuss the next steps.`;
    case 'Negotiation': return `Hello ${name}, following up on our property discussion. Please let me know if you would like to proceed or discuss the offer further.`;
    case 'Contacted': return `Hello ${name}, following up regarding your property requirement. Please let me know a convenient time to connect.`;
    default: return `Hello ${name}, thank you for your property enquiry. Please let me know a convenient time to connect.`;
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
      if (!leadRes.ok || !metaRes.ok) throw new Error('Unable to load CRM data');
      const leadJson = await leadRes.json();
      const metaJson = await metaRes.json();
      setLeads(Array.isArray(leadJson) ? leadJson : (leadJson.leads || []));
      setMeta(metaJson?.meta || metaJson || {});
      sessionStorage.setItem('anjanay-heights-crm-password', password);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load Action Center');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (password) void load(); }, []);
  const today = todayIST();

  const salesActions = useMemo(() => leads
    .map((lead) => ({ lead, meta: meta[lead.id] || {} }))
    .filter(({ lead, meta: m }) => lead.status !== 'Closed' && lead.status !== 'Lost' &&
      ((m.followUp && m.followUp <= today) || m.priority === 'Hot' || m.priority === 'Very Hot' || m.nextAction === 'Follow-up' || m.nextAction === 'Confirm Site Visit'))
    .sort((a, b) => {
      const rank = (v?: string) => v === 'Very Hot' ? 0 : v === 'Hot' ? 1 : v === 'Warm' ? 2 : 3;
      return rank(a.meta.priority) - rank(b.meta.priority) || (a.meta.followUp || '9999').localeCompare(b.meta.followUp || '9999');
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

  const pendingAmount = (m: Meta) => Math.max(0, (Number(m.dealValue) || 0) * (Number(m.sellerCommissionRate ?? 1) + Number(m.buyerCommissionRate ?? 0)) / 100 - (Number(m.commissionReceived) || 0));
  const overdue = commissions.filter(({ meta: m }) => m.commissionDueDate && m.commissionDueDate < today);
  const dueToday = commissions.filter(({ meta: m }) => m.commissionDueDate === today);

  const save = async (id: string, patch: Partial<Meta>) => {
    const previous = meta[id] || {};
    setMeta((current) => ({ ...current, [id]: { ...previous, ...patch } }));
    try {
      const response = await fetch('/api/lead-meta', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ id, meta: patch }),
      });
      if (!response.ok) throw new Error('Unable to save CRM action');
    } catch (error) {
      setMeta((current) => ({ ...current, [id]: previous }));
      throw error;
    }
  };

  const logContact = async (lead: Lead, channel: 'Call' | 'WhatsApp', outcome?: string) => {
    const current = meta[lead.id] || {};
    const now = new Date().toISOString();
    const status = outcome === 'Connected' ? 'Contacted' : lead.status || 'New';
    const next = outcome === 'No Answer' || outcome === 'Busy' || outcome === 'Not Reachable'
      ? { action: 'Call', date: addDays(today, 1) }
      : outcome === 'Callback Requested'
        ? { action: 'Follow-up', date: addDays(today, 1) }
        : nextStep(status, today);
    const action = outcome ? `${channel} - ${outcome}` : channel;
    try {
      await save(lead.id, {
        status,
        nextAction: next.action,
        followUp: next.date,
        lastContactAt: now,
        lastContactChannel: channel,
        ...(outcome ? { callOutcome: outcome } : {}),
        history: [...(current.history || []), { id: activityId(action), action, at: now }],
      });
      setMessage(`${lead.name || 'Lead'}: ${action}. Next: ${next.action} on ${next.date}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save contact action'); }
  };

  const call = (lead: Lead) => {
    if (lead.phone) window.open(`tel:${lead.phone}`);
    void logContact(lead, 'Call');
  };

  const whatsapp = (lead: Lead, customMessage?: string) => {
    if (!lead.phone) { setMessage('No phone number available for WhatsApp'); return; }
    const text = customMessage || stageMessage(lead);
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    void logContact(lead, 'WhatsApp');
  };

  const pipelineAction = async (lead: Lead, action: string, status: string) => {
    const current = meta[lead.id] || {};
    const next = nextStep(status, today);
    try {
      await save(lead.id, { status, nextAction: next.action, followUp: next.date, history: [...(current.history || []), { id: activityId(action), action, at: new Date().toISOString() }] });
      setMessage(`${lead.name || 'Lead'} → ${status}. Next: ${next.action} on ${next.date}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update lead'); }
  };

  const setToday = (lead: Lead) => void save(lead.id, { followUp: today, nextAction: 'Follow-up' }).then(() => setMessage(`${lead.name || 'Lead'} added to today.`)).catch((e) => setMessage(e instanceof Error ? e.message : 'Unable to update lead'));

  if (!password) return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6"><div className="rounded-2xl bg-white border p-5">
      <h2 className="text-xl font-bold text-[#1A365D]">🎯 Today’s Action Center</h2><p className="text-sm text-slate-500 mt-1">Daily sales + commission actions in one place.</p>
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="CRM password" className="mt-4 w-full max-w-sm border rounded-lg px-3 py-2" />
      <button onClick={() => void load()} className="mt-2 rounded-lg bg-[#1A365D] px-4 py-2 text-white font-semibold">Open Action Center</button>
    </div></section>
  );

  return <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6"><div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
    <div className="p-5 border-b flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[#1A365D]">🎯 Today’s Action Center</h2><p className="text-sm text-slate-500 mt-1">Call / WhatsApp → outcome → automatic next follow-up.</p></div><button onClick={() => void load()} className="rounded-lg border px-3 py-2 text-sm font-semibold">{loading ? 'Loading…' : '↻ Refresh'}</button></div>
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
      {salesActions.length > 0 && <div><div className="flex items-center justify-between gap-2 mb-2"><h3 className="font-bold text-[#1A365D]">🔥 Priority Sales Actions</h3><span className="text-xs text-slate-500">{overdueSales.length} overdue · {dueTodaySales.length} today</span></div>
        {salesActions.slice(0, 12).map(({ lead, meta: m }) => <div key={lead.id} className="border rounded-xl p-3 mb-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><b>{lead.name || 'Lead'}</b><div className="text-xs text-slate-500">{m.priority || 'Normal'} · {lead.status || 'New'} · Next: {m.nextAction || 'Follow-up'} · {m.followUp || 'Due today'}</div>{m.lastContactAt && <div className="text-xs text-slate-400">Last: {m.lastContactChannel || 'Contact'}{m.callOutcome ? ` · ${m.callOutcome}` : ''}</div>}</div><div className="text-xs font-semibold text-slate-600">1-click workflow</div></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => call(lead)} className="rounded-lg bg-[#1A365D] px-3 py-2 text-xs text-white">📞 Call</button>
            <button onClick={() => whatsapp(lead)} className="rounded-lg border px-3 py-2 text-xs">💬 WhatsApp</button>
            <button onClick={() => void logContact(lead, 'Call', 'Connected')} className="rounded-lg border px-3 py-2 text-xs">✅ Connected</button>
            <button onClick={() => void logContact(lead, 'Call', 'No Answer')} className="rounded-lg border px-3 py-2 text-xs">📵 No Answer</button>
            <button onClick={() => void logContact(lead, 'Call', 'Busy')} className="rounded-lg border px-3 py-2 text-xs">⏳ Busy</button>
            <button onClick={() => void logContact(lead, 'Call', 'Not Reachable')} className="rounded-lg border px-3 py-2 text-xs">🚫 Not Reachable</button>
            <button onClick={() => void logContact(lead, 'Call', 'Callback Requested')} className="rounded-lg border px-3 py-2 text-xs">🔁 Callback</button>
            <button onClick={() => void pipelineAction(lead, 'Interested', 'Interested')} className="rounded-lg border px-3 py-2 text-xs">👍 Interested</button>
            <button onClick={() => void pipelineAction(lead, 'Site Visit', 'Site Visit')} className="rounded-lg border px-3 py-2 text-xs">📅 Site Visit</button>
            <button onClick={() => void pipelineAction(lead, 'Negotiation', 'Negotiation')} className="rounded-lg border px-3 py-2 text-xs">🤝 Negotiation</button>
            <button onClick={() => setToday(lead)} className="rounded-lg border px-3 py-2 text-xs">🔄 Follow-up Today</button>
          </div>
        </div>)}
      </div>}

      {commissions.length > 0 && <div><h3 className="font-bold text-[#1A365D] mb-2">💰 Commission Collection Actions</h3>{commissions.map(({ lead, meta: m }) => <div key={lead.id} className="border rounded-xl p-3 mb-2 flex flex-wrap items-center justify-between gap-2">
        <div><b>{lead.name || 'Closed Deal'}</b><div className="text-xs text-slate-500">{m.commissionDueDate || 'No due date'} · Pending {money(pendingAmount(m))}</div></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => whatsapp(lead, `Hello ${lead.name || ''}, this is a follow-up regarding the pending commission/payment of ${money(pendingAmount(m))}. Please let me know the expected payment date.`)} className="rounded-lg bg-[#1A365D] px-3 py-2 text-xs text-white">💬 Collection Follow-up</button><button onClick={() => setToday(lead)} className="rounded-lg border px-3 py-2 text-xs">📅 Add to Today</button><button onClick={() => void save(lead.id, { commissionReceived: Number(m.dealValue || 0) * (Number(m.sellerCommissionRate ?? 1) + Number(m.buyerCommissionRate ?? 0)) / 100, commissionStatus: 'Received' }).then(() => setMessage(`${lead.name || 'Deal'} marked as received.`)).catch((e) => setMessage(e instanceof Error ? e.message : 'Unable to update commission'))} className="rounded-lg border px-3 py-2 text-xs">✅ Mark Received</button></div>
      </div>)}</div>}

      {!salesActions.length && !commissions.length && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">✅ No urgent sales or commission collection actions right now.</div>}
    </div>
  </div></section>;
}
