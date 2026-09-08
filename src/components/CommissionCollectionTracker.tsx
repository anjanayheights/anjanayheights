import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string; phone: string };
type Meta = { status?: string; dealValue?: string; sellerCommissionRate?: string; buyerCommissionRate?: string; commissionReceived?: string; commissionStatus?: string; commissionDueDate?: string; sellerPaymentDate?: string; sellerPaymentMode?: string; sellerReceiptNo?: string; buyerPaymentDate?: string; buyerPaymentMode?: string; buyerReceiptNo?: string };
const amount = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const pct = (v?: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const money = (v: number) => `₹${v.toLocaleString('en-IN')}`;
const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const dueState = (date?: string, status?: string) => { if (status === 'Received') return 'Received'; if (!date) return 'No due date'; const today = todayIST(); return date < today ? 'Overdue' : date === today ? 'Due Today' : 'Upcoming'; };
const waNumber = (phone: string) => String(phone || '').replace(/\D/g, '').replace(/^0+/, '').replace(/^91(?!\d{10}$)/, '');

export default function CommissionCollectionTracker() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<'All'|'Overdue'|'Due Today'|'Upcoming'|'Pending'|'Partial'|'Received'>('All');
  const [saving, setSaving] = useState<string | null>(null);
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
  const save = async (id: string, patch: Partial<Meta>) => {
    const password = sessionStorage.getItem('anjanay-heights-crm-password') || '';
    if (!password) return;
    setSaving(id);
    try {
      const res = await fetch('/api/lead-meta', { method: 'POST', headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: id, meta: patch }) });
      if (!res.ok) throw new Error('save failed');
      setMeta(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
    } catch { alert('Payment details save nahi ho paye. Please try again.'); }
    finally { setSaving(null); }
  };
  const rows = useMemo(() => leads.filter(l => meta[l.id]?.status === 'Closed').map(lead => {
    const m = meta[lead.id] || {};
    const sale = amount(m.dealValue);
    const expected = sale * (pct(m.sellerCommissionRate || '1') + pct(m.buyerCommissionRate)) / 100;
    const received = amount(m.commissionReceived);
    const status = m.commissionStatus || (received >= expected && expected > 0 ? 'Received' : received > 0 ? 'Partial' : 'Pending');
    const due = dueState(m.commissionDueDate, status);
    return { lead, m, expected, received, pending: Math.max(0, expected - received), status, due };
  }).filter(r => ['Pending','Partial','Received'].includes(filter) ? r.status === filter : filter === 'All' ? true : r.due === filter), [leads, meta, filter]);
  const totals = useMemo(() => rows.reduce((s, r) => ({ expected: s.expected+r.expected, received: s.received+r.received, pending: s.pending+r.pending }), {expected:0,received:0,pending:0}), [rows]);
  const allClosed = useMemo(() => leads.filter(l => meta[l.id]?.status === 'Closed').map(lead => {
    const m = meta[lead.id] || {}; const sale = amount(m.dealValue); const expected = sale * (pct(m.sellerCommissionRate || '1') + pct(m.buyerCommissionRate)) / 100; const received = amount(m.commissionReceived); const status = m.commissionStatus || (received >= expected && expected > 0 ? 'Received' : received > 0 ? 'Partial' : 'Pending'); return { lead, m, expected, received, due: dueState(m.commissionDueDate, status) };
  }), [leads, meta]);
  const overdueAmount = allClosed.reduce((sum, r) => sum + (r.due === 'Overdue' ? Math.max(0, r.expected - r.received) : 0), 0);
  const todayAmount = allClosed.reduce((sum, r) => sum + (r.due === 'Due Today' ? Math.max(0, r.expected - r.received) : 0), 0);
  const upcomingAmount = allClosed.reduce((sum, r) => sum + (r.due === 'Upcoming' ? Math.max(0, r.expected - r.received) : 0), 0);
  const sendFollowup = (lead: Lead, pending: number) => { const phone = waNumber(lead.phone); if (!phone) return alert('Lead ka valid WhatsApp number nahi hai.'); const text = `Hello ${lead.name || 'Sir/Madam'}, commission payment of ${money(pending)} is pending. Kindly share the payment update. Thank you - Anjanay Heights`; window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank'); };
  if (!ready) return null;
  return <section className="max-w-7xl mx-auto px-4 md:px-8 pt-5"><div className="rounded-2xl border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-[#1A365D]">🧾 Commission Collection Tracker</h2><p className="text-sm text-gray-500">Track expected, received and pending brokerage after every closed deal.</p></div><button onClick={() => void load()} className="border rounded-lg px-3 py-2 text-sm font-semibold">Refresh</button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4"><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Expected</p><p className="text-xl font-bold">{money(totals.expected)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Received</p><p className="text-xl font-bold">{money(totals.received)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold">{money(totals.pending)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Overdue Pending</p><p className="text-xl font-bold">{money(overdueAmount)}</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4"><button onClick={() => setFilter('Overdue')} className="rounded-xl border p-3 text-left"><p className="text-xs text-gray-500">🔴 Overdue</p><p className="text-lg font-bold">{money(overdueAmount)}</p></button><button onClick={() => setFilter('Due Today')} className="rounded-xl border p-3 text-left"><p className="text-xs text-gray-500">🟡 Due Today</p><p className="text-lg font-bold">{money(todayAmount)}</p></button><button onClick={() => setFilter('Upcoming')} className="rounded-xl border p-3 text-left"><p className="text-xs text-gray-500">🟢 Upcoming</p><p className="text-lg font-bold">{money(upcomingAmount)}</p></button></div><div className="flex flex-wrap gap-2 mt-4">{(['All','Overdue','Due Today','Upcoming','Pending','Partial','Received'] as const).map(x => <button key={x} onClick={() => setFilter(x)} className={`px-3 py-2 rounded-lg text-sm font-semibold ${filter===x?'bg-[#1A365D] text-white':'border bg-white'}`}>{x}</button>)}</div><div className="mt-4 space-y-3">{rows.map(r => <div key={r.lead.id} className={`border rounded-xl p-3 ${r.due==='Overdue' ? 'border-red-300 bg-red-50/30' : r.due==='Due Today' ? 'border-amber-300 bg-amber-50/30' : ''}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold">{r.lead.name || 'Unnamed Lead'}</p><p className="text-xs text-gray-500">{r.lead.phone}</p></div><div className="text-sm">Expected <b>{money(r.expected)}</b></div><div className="text-sm">Received <b>{money(r.received)}</b></div><div className="text-sm">Pending <b>{money(r.pending)}</b></div><span className={`text-xs rounded-full border px-2 py-1 font-semibold ${r.due==='Overdue'?'border-red-300 text-red-700':r.due==='Due Today'?'border-amber-300 text-amber-700':'border-gray-300'}`}>{r.due}</span><span className="text-xs rounded-full border px-2 py-1 font-semibold">{r.status}</span></div><div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-3"><label className="text-xs font-semibold text-gray-600">Payment due date<input type="date" value={r.m.commissionDueDate || ''} onChange={e => void save(r.lead.id, { commissionDueDate: e.target.value })} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm font-normal" /></label><label className="text-xs font-semibold text-gray-600">Commission received<input inputMode="decimal" value={r.m.commissionReceived || ''} onChange={e => void save(r.lead.id, { commissionReceived: e.target.value, commissionStatus: amount(e.target.value) >= r.expected && r.expected > 0 ? 'Received' : amount(e.target.value) > 0 ? 'Partial' : 'Pending' })} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm font-normal" placeholder="₹ amount" /></label><label className="text-xs font-semibold text-gray-600">Payment mode<input value={r.m.sellerPaymentMode || ''} onChange={e => void save(r.lead.id, { sellerPaymentMode: e.target.value })} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm font-normal" placeholder="UPI / Bank / Cash" /></label><label className="text-xs font-semibold text-gray-600">Receipt no.<input value={r.m.sellerReceiptNo || ''} onChange={e => void save(r.lead.id, { sellerReceiptNo: e.target.value })} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm font-normal" placeholder="Receipt / ref no." /></label><label className="text-xs font-semibold text-gray-600">Payment date<input type="date" value={r.m.sellerPaymentDate || ''} onChange={e => void save(r.lead.id, { sellerPaymentDate: e.target.value })} className="mt-1 w-full border rounded-lg px-2 py-2 text-sm font-normal" /></label></div><div className="flex flex-wrap gap-2 mt-3"><button disabled={saving===r.lead.id} onClick={() => void save(r.lead.id, { commissionStatus: 'Received', commissionReceived: String(r.expected), sellerPaymentDate: r.m.sellerPaymentDate || todayIST() })} className="rounded-lg bg-[#1A365D] text-white px-3 py-2 text-sm font-semibold disabled:opacity-50">{saving===r.lead.id ? 'Saving…' : '✅ Mark Full Received'}</button><button disabled={saving===r.lead.id} onClick={() => void save(r.lead.id, { commissionStatus: 'Pending', commissionReceived: '0' })} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">🔴 Mark Pending</button>{r.pending > 0 && <button onClick={() => sendFollowup(r.lead, r.pending)} className="rounded-lg border border-[#1A365D] px-3 py-2 text-sm font-semibold text-[#1A365D]">💬 WhatsApp Follow-up</button>}</div></div>)}{rows.length===0 && <p className="text-sm text-gray-500 py-4 text-center">No commission records in this filter.</p>}</div></div></section>;
}
