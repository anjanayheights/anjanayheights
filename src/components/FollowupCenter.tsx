import React, { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string; phone: string; location?: string; budget?: string; requirement?: string; created_at?: string };
type Meta = { status: string; followUp: string; note: string };

const today = () => new Date().toISOString().slice(0, 10);

export default function FollowupCenter() {
  const [password, setPassword] = useState(() => sessionStorage.getItem('crm_password') || '');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'today' | 'overdue'>('today');

  useEffect(() => {
    if (!password) return;
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${password}` };
        const [lr, mr] = await Promise.all([fetch('/api/leads', { headers }), fetch('/api/lead-meta', { headers })]);
        if (!lr.ok || !mr.ok) throw new Error('Unauthorized');
        const ld = await lr.json(); const md = await mr.json();
        setLeads(Array.isArray(ld.leads) ? ld.leads : []);
        setMeta(md.meta || {});
        sessionStorage.setItem('crm_password', password);
        setError('');
      } catch { setError('Password incorrect or CRM data could not be loaded.'); }
    };
    load();
  }, [password]);

  const rows = useMemo(() => {
    const d = today();
    return leads
      .map((lead) => ({ lead, m: meta[lead.id] || { status: 'New', followUp: '', note: '' } }))
      .filter(({ m }) => tab === 'today' ? m.followUp === d : Boolean(m.followUp && m.followUp < d && !['Closed', 'Lost'].includes(m.status)))
      .sort((a, b) => (a.m.followUp || '').localeCompare(b.m.followUp || ''));
  }, [leads, meta, tab]);

  if (!password) return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">CRM Follow-ups</h1><p className="mt-1 text-sm text-slate-600">Enter your CRM dashboard password.</p>
      <input autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') setPassword((e.target as HTMLInputElement).value); }} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Password" />
      <button onClick={() => setPassword(password)} className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Open Follow-ups</button>
      <a href="/admin" className="mt-4 block text-center text-sm font-semibold text-slate-600">Back to Dashboard</a>
    </div></div>
  );

  return <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-6xl">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Anjanay Heights CRM</p><h1 className="text-2xl font-bold text-slate-900">Follow-up Center</h1></div><div className="flex gap-2"><a href="/admin" className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold">Dashboard</a><a href="/admin/tools" className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold">CRM Tools</a></div></div>
    {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="mb-4 flex gap-2"><button onClick={() => setTab('today')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'today' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>Today</button><button onClick={() => setTab('overdue')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'overdue' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>Overdue</button></div>
    {rows.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center text-slate-500">No {tab === 'today' ? 'follow-ups scheduled for today' : 'overdue follow-ups'}.</div> : <div className="grid gap-3">{rows.map(({ lead, m }) => <div key={lead.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">{lead.name}</h2><p className="text-sm text-slate-600">{lead.phone}{lead.location ? ` · ${lead.location}` : ''}</p>{lead.budget && <p className="mt-1 text-sm text-slate-500">Budget: {lead.budget}</p>}</div><div className="flex gap-2"><a href={`tel:${lead.phone}`} className="rounded-lg border px-3 py-2 text-sm font-semibold">Call</a><a target="_blank" rel="noreferrer" href={`https://wa.me/${String(lead.phone).replace(/\D/g, '').length === 10 ? '91' : ''}${String(lead.phone).replace(/\D/g, '')}`} className="rounded-lg border px-3 py-2 text-sm font-semibold">WhatsApp</a></div></div><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">{m.status}</span><span className="rounded-full bg-slate-100 px-3 py-1">Follow-up: {m.followUp}</span></div>{m.note && <p className="mt-3 text-sm text-slate-700">{m.note}</p>}</div>)}</div>}
  </div></div>;
}
