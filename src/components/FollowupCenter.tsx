import React, { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string; phone: string; location?: string; budget?: string; requirement?: string; created_at?: string };
type Meta = { status: string; followUp: string; note: string; priority?: string; nextAction?: string };
type Tab = 'today' | 'overdue' | 'upcoming' | 'siteVisits';

const dateKey = (d = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')?.value || '';
  const m = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  return `${y}-${m}-${day}`;
};
function addDays(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return dateKey(d); }
function waPhone(phone: string) { const d = String(phone || '').replace(/\D/g, ''); if (!d) return ''; if (d.length === 10) return `91${d}`; return d; }
function waMessage(lead: Lead) { return `Hi ${lead.name || 'there'}, this is Anjanay Heights regarding your property enquiry.${lead.location ? `\n\nLocation: ${lead.location}` : ''}${lead.budget ? `\nBudget: ${lead.budget}` : ''}\n\nPlease let me know a convenient time to speak.`; }
function waLink(lead: Lead) { const phone = waPhone(lead.phone); if (!phone) return ''; return `https://wa.me/${phone}?text=${encodeURIComponent(waMessage(lead))}`; }

export default function FollowupCenter() {
  const [password, setPassword] = useState(() => sessionStorage.getItem('crm_password') || '');
  const [leads, setLeads] = useState<Lead[]>([]); const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [error, setError] = useState(''); const [tab, setTab] = useState<Tab>('today'); const [saving, setSaving] = useState(''); const [loading, setLoading] = useState(false); const [loggedIn, setLoggedIn] = useState(false);

  async function load() {
    if (!password.trim()) { setError('Please enter your CRM dashboard password.'); return; }
    setLoading(true); setError('');
    try {
      const headers = { Authorization: `Bearer ${password.trim()}` };
      const lr = await fetch('/api/leads', { headers, cache: 'no-store' });
      const leadData = await lr.json().catch(() => ({}));
      if (!lr.ok) throw new Error(leadData?.error === 'Unauthorized' ? 'Password incorrect.' : 'CRM data could not be loaded.');
      const mr = await fetch('/api/lead-meta', { headers, cache: 'no-store' });
      const metaData = await mr.json().catch(() => ({}));
      setLeads(Array.isArray(leadData.leads) ? leadData.leads : []);
      setMeta(mr.ok && metaData?.meta ? metaData.meta : {});
      sessionStorage.setItem('crm_password', password.trim());
      setLoggedIn(true); setError('');
    } catch (err) { setLoggedIn(false); setError(err instanceof Error ? err.message : 'CRM data could not be loaded.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (password) void load(); }, []);

  async function updateMeta(id: string, patch: Partial<Meta>) {
    const next = { ...(meta[id] || { status: 'New', followUp: '', note: '', priority: 'Warm', nextAction: 'Call' }), ...patch };
    setMeta(prev => ({ ...prev, [id]: next })); setSaving(id); setError('');
    try {
      const r = await fetch('/api/lead-meta', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ leadId: id, meta: next }) });
      if (!r.ok) throw new Error();
    } catch { setError('Could not save follow-up change.'); }
    finally { setSaving(''); }
  }
  function openWhatsApp(lead: Lead) { const url = waLink(lead); if (!url) return; void updateMeta(lead.id, { status: 'Contacted', nextAction: 'WhatsApp' }); window.open(url, '_blank', 'noopener,noreferrer'); }
  function schedule(id: string, days: number, action = 'Follow-up') { void updateMeta(id, { status: 'Contacted', followUp: addDays(days), nextAction: action }); }
  function scheduleSiteVisit(id: string, days = 1) { void updateMeta(id, { status: 'Site Visit', followUp: addDays(days), nextAction: 'Site Visit' }); }

  const today = dateKey();
  const rows = useMemo(() => leads.map(lead => ({ lead, m: meta[lead.id] || { status: 'New', followUp: '', note: '', priority: 'Warm', nextAction: 'Call' } }))
    .filter(({ m }) => {
      if (tab === 'siteVisits') return m.status === 'Site Visit' && !!m.followUp;
      if (!m.followUp || ['Closed', 'Lost'].includes(m.status)) return false;
      if (tab === 'today') return m.followUp === today;
      if (tab === 'overdue') return m.followUp < today;
      return m.followUp > today;
    })
    .sort((a,b) => { const pa = a.m.priority === 'Hot' ? 0 : a.m.priority === 'Warm' ? 1 : 2; const pb = b.m.priority === 'Hot' ? 0 : b.m.priority === 'Warm' ? 1 : 2; return pa - pb || a.m.followUp.localeCompare(b.m.followUp); }), [leads, meta, tab, today]);

  const counts = useMemo(() => leads.reduce((a,l) => {
    const m = meta[l.id] || { status: 'New', followUp: '' };
    if (m.status === 'Site Visit' && m.followUp) a.siteVisits++;
    if (m.followUp && !['Closed','Lost'].includes(m.status)) {
      if (m.followUp === today) a.today++; else if (m.followUp < today) a.overdue++; else a.upcoming++;
    }
    return a;
  }, { today: 0, overdue: 0, upcoming: 0, siteVisits: 0 }), [leads, meta, today]);

  if (!loggedIn) return <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm"><h1 className="text-xl font-bold text-slate-900">CRM Follow-ups</h1><p className="mt-1 text-sm text-slate-600">Enter your CRM dashboard password.</p><form onSubmit={e => { e.preventDefault(); void load(); }}><input autoFocus type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Password"/><button type="submit" disabled={loading} className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50">{loading ? 'Loading…' : 'Open Follow-ups'}</button></form><a href="/admin" className="mt-4 block text-center text-sm font-semibold text-slate-600">Back to Dashboard</a>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}</div></div>;

  return <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-6xl"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Anjanay Heights CRM</p><h1 className="text-2xl font-bold text-slate-900">Follow-up Center</h1><p className="text-sm text-slate-500 mt-1">Never miss a scheduled lead follow-up.</p></div><div className="flex gap-2"><button onClick={() => void load()} disabled={loading} className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold">{loading ? 'Refreshing…' : 'Refresh'}</button><a href="/admin" className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold">Dashboard</a></div></div>
    {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><button onClick={() => setTab('today')} className={`rounded-2xl p-4 text-left shadow-sm ${tab === 'today' ? 'bg-slate-900 text-white' : 'bg-white'}`}><p className="text-sm opacity-70">Today</p><p className="text-2xl font-bold">{counts.today}</p></button><button onClick={() => setTab('overdue')} className={`rounded-2xl p-4 text-left shadow-sm ${tab === 'overdue' ? 'bg-slate-900 text-white' : 'bg-white'}`}><p className="text-sm opacity-70">Overdue</p><p className="text-2xl font-bold">{counts.overdue}</p></button><button onClick={() => setTab('upcoming')} className={`rounded-2xl p-4 text-left shadow-sm ${tab === 'upcoming' ? 'bg-slate-900 text-white' : 'bg-white'}`}><p className="text-sm opacity-70">Upcoming</p><p className="text-2xl font-bold">{counts.upcoming}</p></button><button onClick={() => setTab('siteVisits')} className={`rounded-2xl p-4 text-left shadow-sm ${tab === 'siteVisits' ? 'bg-slate-900 text-white' : 'bg-white'}`}><p className="text-sm opacity-70">Site Visits</p><p className="text-2xl font-bold">{counts.siteVisits}</p></button></div>
    {rows.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center text-slate-500">No {tab === 'today' ? 'follow-ups scheduled for today' : tab === 'overdue' ? 'overdue follow-ups' : tab === 'upcoming' ? 'upcoming follow-ups' : 'site visits scheduled'}.</div> : <div className="grid gap-3">{rows.map(({ lead, m }) => <div key={lead.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{lead.name || 'Unnamed lead'}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{m.priority || 'Warm'}</span></div><p className="text-sm text-slate-600">{lead.phone}{lead.location ? ` · ${lead.location}` : ''}</p>{lead.budget && <p className="mt-1 text-sm text-slate-500">Budget: {lead.budget}</p>}</div><div className="flex flex-wrap gap-2">{lead.phone && <a href={`tel:${lead.phone}`} onClick={() => void updateMeta(lead.id, { status: 'Contacted', nextAction: 'Call' })} className="rounded-lg border px-3 py-2 text-sm font-semibold">Call</a>}{waLink(lead) && <button onClick={() => openWhatsApp(lead)} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white">WhatsApp</button>}<button onClick={() => scheduleSiteVisit(lead.id, 1)} disabled={saving === lead.id} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">Site Visit</button><a href={`/admin/matches?lead=${encodeURIComponent(lead.id)}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Matches</a></div></div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">{m.status}</span><span className="rounded-full bg-slate-100 px-3 py-1">Follow-up: {m.followUp}</span><span className="rounded-full bg-slate-100 px-3 py-1">Next: {m.nextAction || 'Call'}</span></div>{m.note && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{m.note}</p>}<div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3"><label className="text-xs font-semibold text-slate-500">Next follow-up</label><input type="date" value={m.followUp || ''} onChange={e => void updateMeta(lead.id, { followUp: e.target.value })} className="rounded-lg border px-2 py-2 text-sm"/><select value={m.nextAction || 'Call'} onChange={e => void updateMeta(lead.id, { nextAction: e.target.value })} className="rounded-lg border px-2 py-2 text-sm bg-white"><option>Call</option><option>WhatsApp</option><option>Site Visit</option><option>Meeting</option><option>Send Property Options</option><option>Follow-up</option><option>No Action</option></select><button onClick={() => schedule(lead.id, 1)} disabled={saving === lead.id} className="rounded-lg border px-3 py-2 text-sm font-semibold">Tomorrow</button><button onClick={() => schedule(lead.id, 3)} disabled={saving === lead.id} className="rounded-lg border px-3 py-2 text-sm font-semibold">3 Days</button><button onClick={() => schedule(lead.id, 7)} disabled={saving === lead.id} className="rounded-lg border px-3 py-2 text-sm font-semibold">7 Days</button><button disabled={saving === lead.id} onClick={() => void updateMeta(lead.id, { status: 'Contacted', followUp: '' })} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving === lead.id ? 'Saving…' : 'Complete'}</button></div></div>)}</div>}
  </div></div>;
}
