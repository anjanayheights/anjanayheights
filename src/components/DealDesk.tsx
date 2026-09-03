import { useEffect, useMemo, useState } from 'react';

type Lead = { id: string; name: string; phone: string; property_type: string; location: string; budget: string };
type Meta = { status: string; priority: string; dealValue?: string; customerOffer?: string; expectedClosingDate?: string; closingProbability?: string; negotiationNotes?: string; closedDate?: string; closedProperty?: string; finalRemarks?: string };

const EMPTY: Meta = { status: 'Negotiation', priority: 'Warm', dealValue: '', customerOffer: '', expectedClosingDate: '', closingProbability: '50%', negotiationNotes: '', closedDate: '', closedProperty: '', finalRemarks: '' };

export default function DealDesk() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [tab, setTab] = useState<'Negotiation' | 'Closed'>('Negotiation');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [form, setForm] = useState<Meta>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const getMeta = (id: string): Meta => ({ ...EMPTY, ...(meta[id] || {}) });

  async function load(p?: string) {
    const active = p || password || sessionStorage.getItem('anjanay-heights-crm-password') || '';
    if (!active) { setError('Please enter your dashboard password.'); return; }
    setPassword(active); setLoading(true); setError('');
    try {
      const q = `?refresh=${Date.now()}`;
      const headers = { Authorization: `Bearer ${active}`, 'Cache-Control': 'no-cache' };
      const [lr, mr] = await Promise.all([fetch(`/api/leads${q}`, { headers, cache: 'no-store' }), fetch(`/api/lead-meta${q}`, { headers, cache: 'no-store' })]);
      const l = await lr.json();
      if (!lr.ok) throw new Error(l.error || 'Unable to load leads');
      const m = mr.ok ? await mr.json() : { meta: {} };
      setLeads(l.leads || []); setMeta(m.meta || {}); setLoggedIn(true); sessionStorage.setItem('anjanay-heights-crm-password', active);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load deals'); }
    finally { setLoading(false); }
  }

  useEffect(() => { const saved = sessionStorage.getItem('anjanay-heights-crm-password'); if (saved) void load(saved); }, []);

  const filtered = useMemo(() => leads.filter(l => getMeta(l.id).status === tab), [leads, meta, tab]);
  const negotiationValue = leads.filter(l => getMeta(l.id).status === 'Negotiation').reduce((sum, l) => sum + (Number(String(getMeta(l.id).dealValue || '').replace(/[^0-9.]/g, '')) || 0), 0);
  const closedValue = leads.filter(l => getMeta(l.id).status === 'Closed').reduce((sum, l) => sum + (Number(String(getMeta(l.id).dealValue || '').replace(/[^0-9.]/g, '')) || 0), 0);

  function open(lead: Lead) { const m = getMeta(lead.id); setSelected(lead); setForm({ ...EMPTY, ...m }); }

  async function save() {
    if (!selected) return;
    const next = { ...getMeta(selected.id), ...form, status: tab };
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/lead-meta', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ leadId: selected.id, meta: next }) });
      if (!r.ok) { const x = await r.json().catch(() => ({})); throw new Error(x.error || 'Could not save deal'); }
      setMeta(v => ({ ...v, [selected.id]: next })); setSelected(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save deal'); }
    finally { setSaving(false); }
  }

  if (!loggedIn) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4"><form onSubmit={e => { e.preventDefault(); void load(password); }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"><h1 className="text-3xl font-bold text-[#1A365D] text-center">Deal Desk</h1><p className="text-gray-500 text-center mt-2">Negotiation & Closed Deals</p><label className="block mt-8 mb-2 font-semibold">Dashboard Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-xl px-4 py-3" placeholder="Enter password" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Deal Desk'}</button></form></div>;

  return <div className="min-h-screen bg-[#F5F7FA] p-3 md:p-6"><div className="max-w-6xl mx-auto"><div className="flex flex-wrap justify-between items-center gap-3 mb-5"><div><h1 className="text-2xl md:text-3xl font-bold text-[#1A365D]">Deal Desk</h1><p className="text-gray-500 mt-1">Track negotiation value and closed sales</p></div><div className="flex gap-2"><button onClick={() => void load(password)} disabled={loading} className="bg-[#1A365D] text-white px-4 py-2.5 rounded-xl font-semibold">{loading ? 'Refreshing...' : 'Refresh'}</button><button onClick={() => { window.location.href = '/admin/pipeline'; }} className="bg-white border px-4 py-2.5 rounded-xl font-semibold">Pipeline</button></div></div>{error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}<div className="grid md:grid-cols-3 gap-3 mb-5"><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Negotiation Deals</p><p className="text-2xl font-bold">{leads.filter(l => getMeta(l.id).status === 'Negotiation').length}</p><p className="text-xs text-gray-500 mt-1">₹{negotiationValue.toLocaleString('en-IN')}</p></div><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Closed Deals</p><p className="text-2xl font-bold">{leads.filter(l => getMeta(l.id).status === 'Closed').length}</p><p className="text-xs text-gray-500 mt-1">₹{closedValue.toLocaleString('en-IN')}</p></div><div className="bg-white rounded-2xl border p-4"><p className="text-sm text-gray-500">Pipeline Potential</p><p className="text-2xl font-bold">₹{(negotiationValue + closedValue).toLocaleString('en-IN')}</p><p className="text-xs text-gray-500 mt-1">Negotiation + Closed</p></div></div><div className="flex gap-2 mb-4"><button onClick={() => setTab('Negotiation')} className={`px-4 py-2 rounded-xl font-semibold ${tab === 'Negotiation' ? 'bg-[#1A365D] text-white' : 'bg-white border'}`}>Negotiation ({leads.filter(l => getMeta(l.id).status === 'Negotiation').length})</button><button onClick={() => setTab('Closed')} className={`px-4 py-2 rounded-xl font-semibold ${tab === 'Closed' ? 'bg-[#1A365D] text-white' : 'bg-white border'}`}>Closed ({leads.filter(l => getMeta(l.id).status === 'Closed').length})</button></div><div className="grid md:grid-cols-2 gap-3">{filtered.map(lead => { const m = getMeta(lead.id); return <article key={lead.id} className="bg-white border rounded-2xl p-4"><div className="flex justify-between gap-3"><div><h2 className="font-bold text-lg">{lead.name || 'Unnamed Lead'}</h2><p className="text-sm text-[#1A365D] font-semibold">{lead.phone}</p></div><span className="text-xs border rounded-full px-2 py-1">{m.closingProbability || '50%'}</span></div><p className="text-sm text-gray-600 mt-3">{lead.property_type || 'Property'} · {lead.location || 'Location'} · Budget ₹{lead.budget || '—'}</p>{m.dealValue && <p className="text-sm font-semibold mt-2">Deal Value: ₹{m.dealValue}</p>}{m.customerOffer && <p className="text-sm text-gray-600 mt-1">Customer Offer: ₹{m.customerOffer}</p>}{m.expectedClosingDate && <p className="text-xs text-gray-500 mt-1">Expected closing: {m.expectedClosingDate}</p>}<button onClick={() => open(lead)} className="w-full mt-4 bg-[#1A365D] text-white rounded-xl py-2.5 font-semibold">{tab === 'Negotiation' ? 'Update Negotiation' : 'View / Update Deal'}</button></article>})}</div>{filtered.length === 0 && <div className="bg-white border rounded-2xl p-8 text-center text-gray-500">No {tab.toLowerCase()} deals yet.</div>}</div>{selected && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto"><h2 className="text-xl font-bold text-[#1A365D]">{tab} — {selected.name}</h2><p className="text-sm text-gray-500 mt-1">{selected.phone}</p>{tab === 'Negotiation' ? <><label className="block mt-4 text-sm font-semibold">Deal value<input value={form.dealValue || ''} onChange={e => setForm(v => ({ ...v, dealValue: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="e.g. 14500000" /></label><label className="block mt-3 text-sm font-semibold">Customer offer<input value={form.customerOffer || ''} onChange={e => setForm(v => ({ ...v, customerOffer: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><label className="block mt-3 text-sm font-semibold">Expected closing date<input type="date" value={form.expectedClosingDate || ''} onChange={e => setForm(v => ({ ...v, expectedClosingDate: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><label className="block mt-3 text-sm font-semibold">Closing probability<select value={form.closingProbability || '50%'} onChange={e => setForm(v => ({ ...v, closingProbability: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2"><option>25%</option><option>50%</option><option>75%</option><option>90%</option></select></label><label className="block mt-3 text-sm font-semibold">Negotiation notes<textarea value={form.negotiationNotes || ''} onChange={e => setForm(v => ({ ...v, negotiationNotes: e.target.value }))} rows={4} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Offer, objections, next commitment..." /></label></> : <><label className="block mt-4 text-sm font-semibold">Final deal value<input value={form.dealValue || ''} onChange={e => setForm(v => ({ ...v, dealValue: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><label className="block mt-3 text-sm font-semibold">Closing date<input type="date" value={form.closedDate || ''} onChange={e => setForm(v => ({ ...v, closedDate: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><label className="block mt-3 text-sm font-semibold">Property sold<input value={form.closedProperty || ''} onChange={e => setForm(v => ({ ...v, closedProperty: e.target.value }))} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><label className="block mt-3 text-sm font-semibold">Final remarks<textarea value={form.finalRemarks || ''} onChange={e => setForm(v => ({ ...v, finalRemarks: e.target.value }))} rows={4} className="mt-1 w-full border rounded-lg px-3 py-2" /></label></>}<div className="flex gap-2 mt-5"><button onClick={() => setSelected(null)} className="flex-1 border rounded-xl py-2.5 font-semibold">Cancel</button><button onClick={() => void save()} disabled={saving} className="flex-1 bg-[#1A365D] text-white rounded-xl py-2.5 font-semibold">{saving ? 'Saving...' : 'Save'}</button></div></div></div>}</div>;
}
