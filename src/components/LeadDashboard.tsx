import { useEffect, useMemo, useState } from 'react';

type Lead = {
  id: string; created_at: string; name: string; phone: string; email: string; form_name: string;
  lead_type: string; property_type: string; location: string; budget: string; timeline: string; requirement: string; message: string;
};
type LeadMeta = { status: string; followUp: string; note: string };
const STATUSES = ['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost'];
const META_KEY = 'anjanay-heights-lead-meta-v1';
const DEFAULT_META: LeadMeta = { status: 'New', followUp: '', note: '' };
function readMeta(): Record<string, LeadMeta> { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch { return {}; } }
function buildWhatsAppMessage(lead: Lead) {
  const name = lead.name || 'there';
  const details = [lead.property_type && `Property: ${lead.property_type}`, lead.location && `Location: ${lead.location}`, lead.budget && `Budget: ${lead.budget}`].filter(Boolean).join('\n');
  return `Hi ${name}, thank you for your enquiry with Anjanay Heights.\n\n${details ? `${details}\n\n` : ''}I would be happy to help you with suitable property options. Please let me know a convenient time to speak.\n\nRegards,\nAnjanay Heights`;
}
export default function LeadDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]); const [password, setPassword] = useState(''); const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState('All');
  const [meta, setMeta] = useState<Record<string, LeadMeta>>({}); const [savingId, setSavingId] = useState('');
  useEffect(() => setMeta(readMeta()), []);
  function cacheMeta(next: Record<string, LeadMeta>) { setMeta(next); localStorage.setItem(META_KEY, JSON.stringify(next)); }
  function getMeta(id: string): LeadMeta { return meta[id] || DEFAULT_META; }
  async function saveLeadMeta(id: string, nextMeta: LeadMeta) {
    const next = { ...meta, [id]: nextMeta }; cacheMeta(next); setSavingId(id);
    try {
      const response = await fetch('/api/lead-meta', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ leadId: id, meta: nextMeta }) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || 'Cloud save failed'); }
    } catch (err) { setError(err instanceof Error ? `${err.message}. Local copy kept.` : 'Cloud save failed. Local copy kept.'); }
    finally { setSavingId(''); }
  }
  function updateLeadMeta(id: string, patch: Partial<LeadMeta>) { void saveLeadMeta(id, { ...getMeta(id), ...patch }); }
  async function loadLeads() {
    setLoading(true); setError('');
    try {
      const [leadsResponse, metaResponse] = await Promise.all([
        fetch('/api/leads', { headers: { Authorization: `Bearer ${password}` } }),
        fetch('/api/lead-meta', { headers: { Authorization: `Bearer ${password}` } }),
      ]);
      const leadsResult = await leadsResponse.json(); if (!leadsResponse.ok) throw new Error(leadsResult.error || 'Unable to load leads');
      let serverMeta: Record<string, LeadMeta> = {};
      if (metaResponse.ok) { const metaResult = await metaResponse.json(); serverMeta = metaResult.meta || {}; }
      const localMeta = readMeta(); const mergedMeta = { ...localMeta, ...serverMeta };
      setLeads(leadsResult.leads || []); cacheMeta(mergedMeta); setLoggedIn(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load leads'); }
    finally { setLoading(false); }
  }
  function handleLogin(event: React.FormEvent) { event.preventDefault(); if (!password.trim()) { setError('Please enter your dashboard password.'); return; } void loadLeads(); }
  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const haystack = [lead.name, lead.phone, lead.email, lead.form_name, lead.lead_type, lead.property_type, lead.location, lead.budget, lead.timeline, lead.requirement, lead.message, getMeta(lead.id).note].join(' ').toLowerCase();
    return haystack.includes(search.toLowerCase()) && (statusFilter === 'All' || getMeta(lead.id).status === statusFilter);
  }), [leads, search, statusFilter, meta]);
  const statusCounts = STATUSES.reduce<Record<string, number>>((acc, status) => { acc[status] = leads.filter((lead) => getMeta(lead.id).status === status).length; return acc; }, {});
  if (!loggedIn) return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4"><form onSubmit={handleLogin} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-3xl font-bold text-[#1A365D] text-center">Anjanay Heights</h1><p className="text-gray-500 text-center mt-2">Lead Management Dashboard</p>
      <label className="block mt-8 mb-2 font-semibold">Dashboard Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full border rounded-xl px-4 py-3" />
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button type="submit" disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Dashboard'}</button>
    </form></div>
  );
  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8"><div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-8"><div><h1 className="text-3xl font-bold text-[#1A365D]">Anjanay Heights</h1><p className="text-gray-500 mt-1">Lead Management Dashboard</p></div><button onClick={() => void loadLeads()} className="bg-[#1A365D] text-white px-5 py-3 rounded-xl font-semibold">Refresh Leads</button></div>
      {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6"><div className="bg-white rounded-2xl p-4 shadow"><p className="text-gray-500 text-sm">Total</p><p className="text-2xl font-bold text-[#1A365D]">{leads.length}</p></div>{STATUSES.map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`text-left bg-white rounded-2xl p-4 shadow ${statusFilter === status ? 'ring-2 ring-[#1A365D]' : ''}`}><p className="text-gray-500 text-sm">{status}</p><p className="text-2xl font-bold text-[#1A365D]">{statusCounts[status] || 0}</p></button>)}</div>
      <div className="bg-white rounded-2xl shadow p-4 mb-6 grid md:grid-cols-[1fr_auto] gap-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, location, budget..." className="w-full border rounded-xl px-4 py-3" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-xl px-4 py-3 bg-white"><option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      {filteredLeads.length === 0 ? <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">No leads found.</div> : <div className="space-y-4">{filteredLeads.map((lead) => {
        const current = getMeta(lead.id); const whatsappUrl = lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(buildWhatsAppMessage(lead))}` : '';
        return <div key={lead.id} className="bg-white rounded-2xl shadow p-5"><div className="flex flex-col lg:flex-row lg:justify-between gap-4"><div><h2 className="text-xl font-bold text-[#1A365D]">{lead.name || 'Unknown Lead'}</h2><p className="text-gray-500 text-sm">{lead.form_name || 'Lead'} · {new Date(lead.created_at).toLocaleString('en-IN')}</p></div><div className="flex flex-wrap gap-2">{lead.phone && <a href={`tel:${lead.phone}`} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">Call</a>}{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">WhatsApp Follow-up</a>}</div></div>
          <div className="grid md:grid-cols-3 gap-4 mt-5"><div><p className="text-xs text-gray-400">PHONE</p><p className="font-semibold">{lead.phone || '-'}</p></div><div><p className="text-xs text-gray-400">LEAD TYPE</p><p className="font-semibold">{lead.lead_type || '-'}</p></div><div><p className="text-xs text-gray-400">PROPERTY</p><p className="font-semibold">{lead.property_type || '-'}</p></div><div><p className="text-xs text-gray-400">LOCATION</p><p className="font-semibold">{lead.location || '-'}</p></div><div><p className="text-xs text-gray-400">BUDGET</p><p className="font-semibold">{lead.budget || '-'}</p></div><div><p className="text-xs text-gray-400">TIMELINE</p><p className="font-semibold">{lead.timeline || '-'}</p></div><div className="md:col-span-3"><p className="text-xs text-gray-400">REQUIREMENT / MESSAGE</p><p className="font-semibold">{lead.requirement || lead.message || '-'}</p></div></div>
          <div className="mt-5 pt-5 border-t grid md:grid-cols-3 gap-3"><div><label className="text-xs font-semibold text-gray-500">STATUS</label><select value={current.status} onChange={(e) => updateLeadMeta(lead.id, { status: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2 bg-white">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div><div><label className="text-xs font-semibold text-gray-500">FOLLOW-UP DATE</label><input type="date" value={current.followUp} onChange={(e) => updateLeadMeta(lead.id, { followUp: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></div><div><label className="text-xs font-semibold text-gray-500">NOTE {savingId === lead.id ? '(Saving...)' : ''}</label><input value={current.note} onChange={(e) => updateLeadMeta(lead.id, { note: e.target.value })} placeholder="Call result / next action" className="mt-1 w-full border rounded-lg px-3 py-2" /></div></div>
        </div>;
      })}</div>}
    </div></div>
  );
}
