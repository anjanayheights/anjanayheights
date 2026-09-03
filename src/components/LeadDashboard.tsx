import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; created_at: string; name: string; phone: string; email: string; form_name: string; lead_type: string; property_type: string; location: string; budget: string; timeline: string; requirement: string; message: string };
type LeadMeta = { status: string; followUp: string; note: string; priority: string; nextAction: string; propertyType: string; location: string; budget: string; timeline: string };

const STATUSES = ['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost'];
const PRIORITIES = ['Hot', 'Warm', 'Cold'];
const NEXT_ACTIONS = ['Call', 'WhatsApp', 'Site Visit', 'Meeting', 'Send Property Options', 'Follow-up', 'No Action'];
const META_KEY = 'anjanay-heights-lead-meta-v2';
const OLD_META_KEY = 'anjanay-heights-lead-meta-v1';
const DEFAULT_META: LeadMeta = { status: 'New', followUp: '', note: '', priority: 'Warm', nextAction: 'Call', propertyType: '', location: '', budget: '', timeline: '' };

function readMeta(): Record<string, LeadMeta> {
  try {
    const current = JSON.parse(localStorage.getItem(META_KEY) || '{}');
    if (Object.keys(current).length) return current;
    return JSON.parse(localStorage.getItem(OLD_META_KEY) || '{}');
  } catch { return {}; }
}

function phoneKey(phone: string) { return (phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''); }
function whatsappPhone(phone: string) { const digits = (phone || '').replace(/\D/g, ''); return digits.length === 10 ? `91${digits}` : digits; }

export default function LeadDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [meta, setMeta] = useState<Record<string, LeadMeta>>({});
  const [savingId, setSavingId] = useState('');

  useEffect(() => setMeta(readMeta()), []);

  function getMeta(id: string): LeadMeta { return { ...DEFAULT_META, ...(meta[id] || {}) }; }
  function cacheMeta(next: Record<string, LeadMeta>) { setMeta(next); localStorage.setItem(META_KEY, JSON.stringify(next)); }
  function effectiveLead(lead: Lead) {
    const m = getMeta(lead.id);
    return { propertyType: m.propertyType || lead.property_type || '', location: m.location || lead.location || '', budget: m.budget || lead.budget || '', timeline: m.timeline || lead.timeline || '' };
  }

  async function saveLeadMeta(id: string, patch: Partial<LeadMeta>) {
    const nextMeta = { ...getMeta(id), ...patch };
    const next = { ...meta, [id]: nextMeta };
    cacheMeta(next);
    setSavingId(id);
    setError('');
    try {
      const response = await fetch('/api/lead-meta', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ leadId: id, meta: nextMeta }) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || 'Cloud save failed'); }
    } catch (err) {
      setError(err instanceof Error ? `${err.message}. Local copy kept.` : 'Cloud save failed. Local copy kept.');
    } finally { setSavingId(''); }
  }

  async function loadLeads() {
    setLoading(true); setError('');
    try {
      const [leadsResponse, metaResponse] = await Promise.all([
        fetch('/api/leads', { headers: { Authorization: `Bearer ${password}` } }),
        fetch('/api/lead-meta', { headers: { Authorization: `Bearer ${password}` } })
      ]);
      const leadsResult = await leadsResponse.json();
      if (!leadsResponse.ok) throw new Error(leadsResult.error || 'Unable to load leads');
      let serverMeta: Record<string, LeadMeta> = {};
      if (metaResponse.ok) { const result = await metaResponse.json(); serverMeta = result.meta || {}; }
      const merged = { ...readMeta(), ...serverMeta };
      setLeads(leadsResult.leads || []); cacheMeta(merged); setLoggedIn(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load leads'); }
    finally { setLoading(false); }
  }

  function handleLogin(e: React.FormEvent) { e.preventDefault(); if (!password.trim()) { setError('Please enter your dashboard password.'); return; } void loadLeads(); }

  const today = new Date().toISOString().slice(0, 10);
  const duplicatePhones = useMemo(() => { const counts: Record<string, number> = {}; leads.forEach(l => { const p = phoneKey(l.phone); if (p) counts[p] = (counts[p] || 0) + 1; }); return counts; }, [leads]);
  const statusCounts = useMemo(() => STATUSES.reduce<Record<string, number>>((a, s) => { a[s] = leads.filter(l => getMeta(l.id).status === s).length; return a; }, {}), [leads, meta]);
  const priorityCounts = useMemo(() => PRIORITIES.reduce<Record<string, number>>((a, p) => { a[p] = leads.filter(l => getMeta(l.id).priority === p).length; return a; }, {}), [leads, meta]);
  const followUpToday = leads.filter(l => { const m = getMeta(l.id); return m.followUp === today && !['Closed', 'Lost'].includes(m.status); }).length;
  const overdue = leads.filter(l => { const m = getMeta(l.id); return m.followUp && m.followUp < today && !['Closed', 'Lost'].includes(m.status); }).length;
  const active = leads.filter(l => !['Closed', 'Lost'].includes(getMeta(l.id).status)).length;
  const progressed = leads.filter(l => !['New', 'Lost'].includes(getMeta(l.id).status)).length;
  const conversion = leads.length ? Math.round((statusCounts.Closed / leads.length) * 100) : 0;
  const duplicateCount = Object.values(duplicatePhones).filter(n => n > 1).length;
  const todayWork = leads.filter(l => { const m = getMeta(l.id); return !['Closed', 'Lost'].includes(m.status) && (m.followUp === today || (m.status === 'New' && m.nextAction !== 'No Action')); }).length;

  const filteredLeads = useMemo(() => leads.filter(lead => {
    const m = getMeta(lead.id); const e = effectiveLead(lead);
    const haystack = [lead.name, lead.phone, lead.email, lead.form_name, lead.lead_type, e.propertyType, e.location, e.budget, e.timeline, lead.requirement, lead.message, m.note, m.nextAction, m.priority].join(' ').toLowerCase();
    const matchesSearch = search === '__OVERDUE__' ? Boolean(m.followUp && m.followUp < today && !['Closed', 'Lost'].includes(m.status)) : haystack.includes(search.toLowerCase());
    return matchesSearch && (statusFilter === 'All' || m.status === statusFilter) && (priorityFilter === 'All' || m.priority === priorityFilter);
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [leads, meta, search, statusFilter, priorityFilter, today]);

  function whatsappMessage(lead: Lead) {
    const e = effectiveLead(lead);
    const details = [e.propertyType && `Property: ${e.propertyType}`, e.location && `Location: ${e.location}`, e.budget && `Budget: ${e.budget}`].filter(Boolean).join('\n');
    return `Hi ${lead.name || 'there'}, thank you for your enquiry with Anjanay Heights.\n\n${details ? details + '\n\n' : ''}I would be happy to help you with suitable property options. Please let me know a convenient time to speak.\n\nRegards,\nAnjanay Heights`;
  }

  function openWhatsApp(lead: Lead) { window.open(`https://wa.me/${whatsappPhone(lead.phone)}?text=${encodeURIComponent(whatsappMessage(lead))}`, '_blank', 'noopener,noreferrer'); }
  function exportCsv() {
    const rows = filteredLeads.map(lead => { const m = getMeta(lead.id); const e = effectiveLead(lead); return [lead.name, lead.phone, lead.email, lead.form_name, lead.lead_type, e.propertyType, e.location, e.budget, e.timeline, m.priority, m.status, m.nextAction, m.followUp, m.note, lead.message || lead.requirement]; });
    const csv = [['Name','Phone','Email','Source','Lead Type','Property','Location','Budget','Timeline','Priority','Status','Next Action','Follow-up','Note','Requirement / Message'], ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); const a = document.createElement('a'); a.href = url; a.download = `anjanay-heights-leads-${today}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  if (!loggedIn) return <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4"><form onSubmit={handleLogin} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Anjanay Heights</h1><p className="text-gray-500 text-center mt-2">Lead Management Dashboard</p><label className="block mt-8 mb-2 font-semibold">Dashboard Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full border rounded-xl px-4 py-3" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button type="submit" disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Dashboard'}</button></form></div>;

  return <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8"><div className="max-w-7xl mx-auto">
    <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-8"><div><h1 className="text-3xl font-bold text-[#1A365D]">Anjanay Heights</h1><p className="text-gray-500 mt-1">Lead Management Dashboard</p></div><div className="flex flex-wrap gap-2"><button onClick={exportCsv} className="bg-white border border-[#1A365D] text-[#1A365D] px-4 py-3 rounded-xl font-semibold">Export CSV</button><button onClick={() => { setLoggedIn(false); setPassword(''); }} className="bg-white border text-gray-700 px-4 py-3 rounded-xl font-semibold">Logout</button><button onClick={() => void loadLeads()} disabled={loading} className="bg-[#1A365D] text-white px-5 py-3 rounded-xl font-semibold">{loading ? 'Refreshing...' : 'Refresh Leads'}</button></div></div>
    {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">{error}</div>}
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6"><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Total</p><p className="text-2xl font-bold text-[#1A365D]">{leads.length}</p></div>{STATUSES.slice(0,5).map(s => <button key={s} onClick={() => { setStatusFilter(s); setPriorityFilter('All'); setSearch(''); }} className="text-left bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">{s}</p><p className="text-2xl font-bold text-[#1A365D]">{statusCounts[s] || 0}</p></button>)}<button onClick={() => { setStatusFilter('Closed'); setPriorityFilter('All'); setSearch(''); }} className="text-left bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Closed</p><p className="text-2xl font-bold text-[#1A365D]">{statusCounts.Closed || 0}</p></button></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"><button onClick={() => { setSearch(today); setStatusFilter('All'); setPriorityFilter('All'); }} className="bg-white rounded-2xl p-4 shadow text-left"><p className="text-gray-500 text-sm">Follow-up today</p><p className="text-2xl font-bold text-[#1A365D]">{followUpToday}</p></button><button onClick={() => { setSearch('__OVERDUE__'); setStatusFilter('All'); setPriorityFilter('All'); }} className="bg-white rounded-2xl p-4 shadow text-left"><p className="text-gray-500 text-sm">Overdue</p><p className="text-2xl font-bold text-[#1A365D]">{overdue}</p></button><button onClick={() => { setSearch(''); setStatusFilter('All'); setPriorityFilter('All'); }} className="bg-white rounded-2xl p-4 shadow text-left"><p className="text-gray-500 text-sm">Today's work</p><p className="text-2xl font-bold text-[#1A365D]">{todayWork}</p></button><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Active leads</p><p className="text-2xl font-bold text-[#1A365D]">{active}</p></div></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Conversion</p><p className="text-2xl font-bold text-[#1A365D]">{conversion}%</p><p className="text-xs text-gray-400">Closed / total</p></div><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Progressed</p><p className="text-2xl font-bold text-[#1A365D]">{progressed}</p><p className="text-xs text-gray-400">Past New stage</p></div><button onClick={() => { setSearch(''); setStatusFilter('All'); setPriorityFilter('All'); }} className="bg-white rounded-2xl p-4 shadow text-left"><p className="text-gray-500 text-sm">Duplicate phones</p><p className="text-2xl font-bold text-[#1A365D]">{duplicateCount}</p><p className="text-xs text-gray-400">Click to review in lead cards</p></button><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Hot leads</p><p className="text-2xl font-bold text-[#1A365D]">{priorityCounts.Hot || 0}</p><p className="text-xs text-gray-400">Hot priority</p></div></div>
    <div className="grid grid-cols-3 gap-3 mb-5">{PRIORITIES.map(p => <button key={p} onClick={() => { setPriorityFilter(p); setStatusFilter('All'); setSearch(''); }} className="bg-white rounded-2xl p-4 shadow text-left"><p className="text-gray-500 text-sm">{p} priority</p><p className="text-2xl font-bold text-[#1A365D]">{priorityCounts[p] || 0}</p></button>)}</div>
    <div className="bg-white rounded-2xl shadow p-4 mb-6 grid md:grid-cols-[1fr_auto_auto_auto] gap-3"><input value={search === '__OVERDUE__' ? '' : search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, location, budget..." className="w-full border rounded-xl px-4 py-3" /><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-xl px-3 py-3"><option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select><select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="border rounded-xl px-3 py-3"><option>All</option>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select><button onClick={() => { setSearch(''); setStatusFilter('All'); setPriorityFilter('All'); }} className="border rounded-xl px-4 py-3 font-semibold">Clear Filters</button></div>
    <p className="text-sm text-gray-500 mb-3">Showing {filteredLeads.length} of {leads.length} leads</p>
    <div className="space-y-5">{filteredLeads.map(lead => { const m = getMeta(lead.id); const e = effectiveLead(lead); const isDuplicate = phoneKey(lead.phone) && duplicatePhones[phoneKey(lead.phone)] > 1; return <div key={lead.id} className="bg-white rounded-2xl shadow p-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3"><div><div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold text-[#1A365D]">{lead.name || 'Unnamed lead'}</h2><span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">{m.priority}</span>{isDuplicate && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Duplicate phone</span>}</div><p className="text-gray-500 text-sm mt-1">{lead.lead_type || lead.form_name} · {new Date(lead.created_at).toLocaleString('en-IN')}</p></div><div className="flex gap-2"><button onClick={() => window.location.href = `tel:${lead.phone}`} className="bg-[#1A365D] text-white px-4 py-2 rounded-xl font-semibold">Call</button><button onClick={() => openWhatsApp(lead)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold">WhatsApp Follow-up</button></div></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-5"><div><p className="text-xs text-gray-400">PHONE</p><p className="font-semibold">{lead.phone}</p></div><div><p className="text-xs text-gray-400">LEAD TYPE</p><p>{lead.lead_type || '—'}</p></div><div><p className="text-xs text-gray-400">ORIGINAL REQUIREMENT / MESSAGE</p><p>{lead.message || lead.requirement || '—'}</p></div></div>
      <div className="mt-5 border-t pt-5"><p className="font-bold text-[#1A365D] mb-3">Lead Requirement Details <span className="font-normal text-sm text-gray-500">(editable)</span></p><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3"><label className="text-sm font-semibold">Property Type<input value={e.propertyType} onChange={ev => void saveLeadMeta(lead.id, { propertyType: ev.target.value })} placeholder="e.g. 2 BHK / Villa" className="mt-1 w-full border rounded-xl px-3 py-2 font-normal" /></label><label className="text-sm font-semibold">Location<input value={e.location} onChange={ev => void saveLeadMeta(lead.id, { location: ev.target.value })} placeholder="e.g. Central Noida" className="mt-1 w-full border rounded-xl px-3 py-2 font-normal" /></label><label className="text-sm font-semibold">Budget<input value={e.budget} onChange={ev => void saveLeadMeta(lead.id, { budget: ev.target.value })} placeholder="e.g. 1.5 Cr" className="mt-1 w-full border rounded-xl px-3 py-2 font-normal" /></label><label className="text-sm font-semibold">Timeline<input value={e.timeline} onChange={ev => void saveLeadMeta(lead.id, { timeline: ev.target.value })} placeholder="e.g. Immediate / 1 month" className="mt-1 w-full border rounded-xl px-3 py-2 font-normal" /></label></div>{savingId === lead.id && <p className="text-xs text-gray-500 mt-2">Saving...</p>}</div>
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3 mt-5"><label className="text-sm font-semibold">PRIORITY<select value={m.priority} onChange={e2 => void saveLeadMeta(lead.id, { priority: e2.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 font-normal">{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></label><label className="text-sm font-semibold">STATUS<select value={m.status} onChange={e2 => void saveLeadMeta(lead.id, { status: e2.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 font-normal">{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label><label className="text-sm font-semibold">NEXT ACTION<select value={m.nextAction} onChange={e2 => void saveLeadMeta(lead.id, { nextAction: e2.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 font-normal">{NEXT_ACTIONS.map(a => <option key={a}>{a}</option>)}</select></label><label className="text-sm font-semibold">FOLLOW-UP DATE<input type="date" value={m.followUp} onChange={e2 => void saveLeadMeta(lead.id, { followUp: e2.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 font-normal" /></label><label className="text-sm font-semibold md:col-span-2 lg:col-span-1">NOTE<input value={m.note} onChange={e2 => void saveLeadMeta(lead.id, { note: e2.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 font-normal" /></label></div>
    </div>; })}</div>
  </div></div>;
}
