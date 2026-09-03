import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; created_at: string; name: string; phone: string; email: string; lead_type: string; property_type: string; location: string; budget: string; timeline: string; requirement: string; message: string };
type LeadMeta = { status: string; followUp: string; note: string; priority: string; nextAction: string; propertyType: string; location: string; budget: string; timeline: string; visitDate: string; visitTime: string; visitedProperty: string; visitFeedback: string; visitInterest: string; dealValue: string; closingProbability: string };

const STAGES = ['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost'];
const DEFAULT_META: LeadMeta = { status: 'New', followUp: '', note: '', priority: 'Warm', nextAction: 'Call', propertyType: '', location: '', budget: '', timeline: '', requirement: '', visitDate: '', visitTime: '', visitedProperty: '', visitFeedback: '', visitInterest: '', dealValue: '', closingProbability: '' } as LeadMeta;

export default function SalesPipeline() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, LeadMeta>>({});
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState('');
  const [error, setError] = useState('');
  const [visitLead, setVisitLead] = useState<Lead | null>(null);
  const [visitForm, setVisitForm] = useState({ visitDate: '', visitTime: '', visitedProperty: '', visitFeedback: '', visitInterest: 'Interested', dealValue: '', closingProbability: '50%' });

  function getMeta(id: string): LeadMeta { return { ...DEFAULT_META, ...(meta[id] || {}) }; }

  async function load(passwordOverride?: string) {
    const activePassword = passwordOverride || password || sessionStorage.getItem('anjanay-heights-crm-password') || '';
    if (!activePassword) { setLoggedIn(false); setError('Please enter your dashboard password.'); return; }
    setPassword(activePassword);
    setLoading(true); setError('');
    try {
      const cacheBust = `?refresh=${Date.now()}`;
      const headers = { Authorization: `Bearer ${activePassword}`, 'Cache-Control': 'no-cache' };
      const [lr, mr] = await Promise.all([
        fetch(`/api/leads${cacheBust}`, { headers, cache: 'no-store' }),
        fetch(`/api/lead-meta${cacheBust}`, { headers, cache: 'no-store' })
      ]);
      const l = await lr.json();
      if (!lr.ok) throw new Error(l.error || 'Unable to load leads');
      const m = mr.ok ? await mr.json() : { meta: {} };
      setLeads(l.leads || []); setMeta(m.meta || {}); setLoggedIn(true);
      sessionStorage.setItem('anjanay-heights-crm-password', activePassword);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load pipeline'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('anjanay-heights-crm-password');
    if (saved) void load(saved);
  }, []);

  async function saveMeta(leadId: string, next: LeadMeta) {
    const response = await fetch('/api/lead-meta', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ leadId, meta: next }) });
    if (!response.ok) { const r = await response.json().catch(() => ({})); throw new Error(r.error || 'Could not save lead details'); }
  }

  function openVisitForm(lead: Lead) {
    const m = getMeta(lead.id);
    setVisitLead(lead);
    setVisitForm({ visitDate: m.visitDate || '', visitTime: m.visitTime || '', visitedProperty: m.visitedProperty || m.propertyType || lead.property_type || '', visitFeedback: m.visitFeedback || '', visitInterest: m.visitInterest || 'Interested', dealValue: m.dealValue || '', closingProbability: m.closingProbability || '50%' });
  }

  async function saveSiteVisit() {
    if (!visitLead) return;
    const current = getMeta(visitLead.id);
    if (!visitForm.visitDate || !visitForm.visitedProperty) { setError('Please enter the visit date and property visited.'); return; }
    const next = { ...current, ...visitForm, status: 'Site Visit', nextAction: 'Follow-up' };
    setMoving(visitLead.id); setError('');
    setMeta(prev => ({ ...prev, [visitLead.id]: next }));
    try { await saveMeta(visitLead.id, next); setVisitLead(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save site visit'); setMeta(prev => ({ ...prev, [visitLead.id]: current })); }
    finally { setMoving(''); }
  }

  async function moveLead(lead: Lead, status: string) {
    if (moving) return;
    if (status === 'Site Visit') { openVisitForm(lead); return; }
    const current = getMeta(lead.id);
    const nextAction = status === 'Closed' || status === 'Lost' ? 'No Action' : status === 'Negotiation' ? 'Follow-up' : status === 'New' ? 'Call' : 'Follow-up';
    const next = { ...current, status, nextAction };
    setMoving(lead.id); setError('');
    setMeta(prev => ({ ...prev, [lead.id]: next }));
    try { await saveMeta(lead.id, next); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update stage'); setMeta(prev => ({ ...prev, [lead.id]: current })); }
    finally { setMoving(''); }
  }

  const columns = useMemo(() => STAGES.map(stage => ({ stage, leads: leads.filter(l => getMeta(l.id).status === stage) })), [leads, meta]);

  if (!loggedIn) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4"><form onSubmit={e => { e.preventDefault(); if (!password.trim()) return setError('Please enter your dashboard password.'); sessionStorage.setItem('anjanay-heights-crm-password', password); void load(password); }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Sales Pipeline</h1><p className="text-gray-500 text-center mt-2">Anjanay Heights CRM</p><label className="block mt-8 mb-2 font-semibold">Dashboard Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full border rounded-xl px-4 py-3" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button type="submit" disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Pipeline'}</button></form></div>;

  return <div className="min-h-screen bg-[#F5F7FA] p-3 md:p-6"><div className="max-w-[1600px] mx-auto"><div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h1 className="text-2xl md:text-3xl font-bold text-[#1A365D]">Sales Pipeline</h1><p className="text-gray-500 mt-1">Lead → Contacted → Interested → Site Visit → Negotiation → Closed</p></div><div className="flex gap-2"><button type="button" onClick={() => void load(password)} disabled={loading} className="bg-[#1A365D] text-white px-4 py-2.5 rounded-xl font-semibold disabled:opacity-60">{loading ? 'Refreshing...' : 'Refresh'}</button><button type="button" onClick={() => { window.location.href = '/admin'; }} className="bg-white border px-4 py-2.5 rounded-xl font-semibold">Leads</button></div></div>{error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}<div className="overflow-x-auto pb-4"><div className="grid grid-cols-7 gap-3 min-w-[1260px]">{columns.map(({ stage, leads: stageLeads }) => <section key={stage} className="bg-white rounded-2xl shadow-sm border min-h-[430px]"><div className="px-3 py-3 border-b flex items-center justify-between"><h2 className="font-bold text-[#1A365D] text-sm">{stage}</h2><span className="bg-slate-100 rounded-full px-2.5 py-1 text-xs font-bold">{stageLeads.length}</span></div><div className="p-2 space-y-2">{stageLeads.map(lead => { const m = getMeta(lead.id); const property = m.propertyType || lead.property_type; const location = m.location || lead.location; const budget = m.budget || lead.budget; return <article key={lead.id} className="border rounded-xl p-3 bg-slate-50"><div className="flex items-start justify-between gap-2"><div><p className="font-bold text-gray-900">{lead.name || 'Unnamed Lead'}</p><a href={`tel:${lead.phone}`} className="text-xs text-[#1A365D] font-semibold">{lead.phone}</a></div><span className="text-[10px] font-bold rounded-full bg-white border px-2 py-1">{m.priority}</span></div>{(property || location || budget) && <p className="text-xs text-gray-600 mt-2">{property}{property && location ? ' · ' : ''}{location}{budget ? ` · ₹${budget}` : ''}</p>}{m.followUp && <p className="text-[11px] text-gray-500 mt-2">Follow-up: {m.followUp}</p>}{m.status === 'Site Visit' && m.visitDate && <div className="mt-2 rounded-lg bg-white border px-2 py-2 text-[11px] text-gray-600"><b>Visit:</b> {m.visitDate}{m.visitTime ? ` · ${m.visitTime}` : ''}{m.visitedProperty ? ` · ${m.visitedProperty}` : ''}<br />Interest: {m.visitInterest || '—'}{m.closingProbability ? ` · Closing probability: ${m.closingProbability}` : ''}</div>}<div className="mt-3 grid grid-cols-2 gap-1.5"><a href={`https://wa.me/${lead.phone.replace(/\D/g, '').length === 10 ? `91${lead.phone.replace(/\D/g, '')}` : lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-center rounded-lg bg-green-600 text-white py-1.5 text-[11px] font-bold">WhatsApp</a><select value={m.status} onChange={e => void moveLead(lead, e.target.value)} disabled={moving === lead.id} className="border rounded-lg px-1 text-[11px] font-semibold bg-white"><option value={m.status}>{moving === lead.id ? 'Saving...' : 'Move stage'}</option>{STAGES.filter(s => s !== m.status).map(s => <option key={s} value={s}>{s}</option>)}</select></div>{m.status === 'Site Visit' && <button type="button" onClick={() => openVisitForm(lead)} className="w-full mt-1.5 border rounded-lg bg-white py-1.5 text-[11px] font-semibold">Edit Visit Details</button>}</article>})}</div></section>)}</div></div></div>{visitLead && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between mb-4"><div><h2 className="text-xl font-bold text-[#1A365D]">Site Visit Details</h2><p className="text-sm text-gray-500">{visitLead.name} · {visitLead.phone}</p></div><button type="button" onClick={() => setVisitLead(null)} className="text-gray-500 text-xl">×</button></div><div className="grid md:grid-cols-2 gap-3"><label className="text-sm font-semibold">Visit date<input type="date" value={visitForm.visitDate} onChange={e => setVisitForm(v => ({ ...v, visitDate: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" /></label><label className="text-sm font-semibold">Visit time<input type="time" value={visitForm.visitTime} onChange={e => setVisitForm(v => ({ ...v, visitTime: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" /></label></div><label className="block text-sm font-semibold mt-3">Property visited<input value={visitForm.visitedProperty} onChange={e => setVisitForm(v => ({ ...v, visitedProperty: e.target.value }))} placeholder="e.g. 2 BHK, Central Noida" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" /></label><label className="block text-sm font-semibold mt-3">Customer feedback<textarea value={visitForm.visitFeedback} onChange={e => setVisitForm(v => ({ ...v, visitFeedback: e.target.value }))} rows={3} placeholder="What did the customer like/dislike?" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" /></label><div className="grid md:grid-cols-2 gap-3 mt-3"><label className="text-sm font-semibold">Interest<select value={visitForm.visitInterest} onChange={e => setVisitForm(v => ({ ...v, visitInterest: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal"><option>Interested</option><option>Highly Interested</option><option>Maybe</option><option>Not Interested</option></select></label><label className="text-sm font-semibold">Deal value<input value={visitForm.dealValue} onChange={e => setVisitForm(v => ({ ...v, dealValue: e.target.value }))} placeholder="₹" className="mt-1 w-full border rounded-lg px-3 py-2 font-normal" /></label></div><label className="block text-sm font-semibold mt-3">Closing probability<select value={visitForm.closingProbability} onChange={e => setVisitForm(v => ({ ...v, closingProbability: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2 font-normal"><option>25%</option><option>50%</option><option>75%</option><option>90%</option></select></label><div className="flex gap-2 mt-5"><button type="button" onClick={() => setVisitLead(null)} className="flex-1 border rounded-xl py-2.5 font-semibold">Cancel</button><button type="button" onClick={() => void saveSiteVisit()} disabled={moving === visitLead.id} className="flex-1 bg-[#1A365D] text-white rounded-xl py-2.5 font-semibold">{moving === visitLead.id ? 'Saving...' : 'Save Site Visit'}</button></div></div></div>}</div>;
}
