import { useEffect, useMemo, useState } from 'react';

type Property = {
  id: string; title: string; propertyType: string; location: string; price: string;
  minBudget: number | null; maxBudget: number | null; area: string; bedrooms: string;
  status: 'Available' | 'Hold' | 'Sold' | 'Inactive'; description: string; createdAt: string;
};

const EMPTY: Omit<Property, 'id' | 'createdAt'> = {
  title: '', propertyType: 'Flat', location: '', price: '', minBudget: null, maxBudget: null,
  area: '', bedrooms: '', status: 'Available', description: ''
};
const TYPES = ['Flat', 'Villa', 'Plot', 'Commercial Land', 'Shop', 'Office', 'Hospital', 'Other'];
const STATUSES = ['Available', 'Hold', 'Sold', 'Inactive'] as const;

function shareProperty(p: Property) {
  const lines = [
    `🏠 ${p.title}`,
    p.propertyType && `Type: ${p.propertyType}`,
    p.location && `Location: ${p.location}`,
    p.price && `Price: ${p.price}`,
    p.area && `Area: ${p.area}`,
    p.bedrooms && `Bedrooms: ${p.bedrooms}`,
    p.description && `Details: ${p.description}`,
    '',
    'Anjanay Heights',
    'Please contact us for more details or site visit.'
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank', 'noopener,noreferrer');
}

export default function PropertyInventory() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(token = password) {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/properties', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to load inventory');
      setProperties(d.properties || []); setLoggedIn(true);
    } catch (e: any) { setError(e.message || 'Unable to load inventory'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (password) load(password); }, []);

  async function save() {
    if (!form.title.trim() || !form.location.trim()) { setError('Property title and location are required.'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/properties', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ action: 'upsert', ...(editing ? { id: editing } : {}), ...form }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to save property');
      setProperties(d.properties || []); setForm(EMPTY); setEditing(null);
    } catch (e: any) { setError(e.message || 'Unable to save property'); }
    finally { setLoading(false); }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this property from inventory?')) return;
    const r = await fetch('/api/properties', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ action: 'delete', id }) });
    const d = await r.json(); if (r.ok) setProperties(d.properties || []); else setError(d.error || 'Unable to delete');
  }

  const filtered = useMemo(() => properties.filter(p => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || `${p.title} ${p.propertyType} ${p.location} ${p.price} ${p.area} ${p.bedrooms} ${p.description}`.toLowerCase().includes(q);
    return matchesSearch && (typeFilter === 'All' || p.propertyType === typeFilter) && (statusFilter === 'All' || p.status === statusFilter);
  }), [properties, search, typeFilter, statusFilter]);

  if (!loggedIn) return <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-7"><div className="text-xs font-bold tracking-[0.2em] text-[#1A365D] uppercase">Anjanay Heights</div><h1 className="text-2xl font-bold mt-2">Property Inventory</h1><p className="text-gray-500 text-sm mt-2">Private CRM inventory. Add your real listings here before using property matching.</p><input type="password" placeholder="Dashboard password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} className="w-full border rounded-xl px-4 py-3 mt-5"/><button onClick={() => load()} disabled={!password || loading} className="w-full mt-3 rounded-xl bg-[#1A365D] text-white py-3 font-semibold">{loading ? 'Opening…' : 'Open Inventory'}</button>{error && <p className="text-red-600 text-sm mt-3">{error}</p>}</div></div>;

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  return <div className="min-h-screen bg-[#F9F9F7] text-[#1A1A1A] p-4 md:p-8"><div className="max-w-7xl mx-auto"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><button onClick={() => window.location.href='/admin'} className="text-sm text-[#1A365D] font-semibold">← CRM Dashboard</button><h1 className="text-3xl font-bold mt-2">Property Inventory</h1><p className="text-gray-500">{properties.length} properties · {properties.filter(p => p.status === 'Available').length} available · {properties.filter(p => p.status === 'Hold').length} on hold</p></div><div className="flex flex-col md:flex-row gap-2 w-full md:w-auto"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search property / location / area…" className="border rounded-xl px-4 py-3 w-full md:w-72 bg-white"/><select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="border rounded-xl px-4 py-3 bg-white"><option>All</option>{TYPES.map(x=><option key={x}>{x}</option>)}</select><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="border rounded-xl px-4 py-3 bg-white"><option>All</option>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></div></div>

<div className="grid lg:grid-cols-[380px_1fr] gap-6 mt-6"><div className="bg-white rounded-2xl shadow-sm border p-5 h-fit"><h2 className="font-bold text-lg">{editing ? 'Edit property' : 'Add property'}</h2><div className="space-y-3 mt-4">
<input placeholder="Property title *" value={form.title} onChange={e => set('title',e.target.value)} className="field"/><select value={form.propertyType} onChange={e=>set('propertyType',e.target.value)} className="field">{TYPES.map(x=><option key={x}>{x}</option>)}</select><input placeholder="Location *" value={form.location} onChange={e=>set('location',e.target.value)} className="field"/><input placeholder="Price / asking price" value={form.price} onChange={e=>set('price',e.target.value)} className="field"/><div className="grid grid-cols-2 gap-2"><input type="number" placeholder="Min budget ₹" value={form.minBudget ?? ''} onChange={e=>set('minBudget',e.target.value === '' ? null : Number(e.target.value))} className="field"/><input type="number" placeholder="Max budget ₹" value={form.maxBudget ?? ''} onChange={e=>set('maxBudget',e.target.value === '' ? null : Number(e.target.value))} className="field"/></div><div className="grid grid-cols-2 gap-2"><input placeholder="Area" value={form.area} onChange={e=>set('area',e.target.value)} className="field"/><input placeholder="Bedrooms" value={form.bedrooms} onChange={e=>set('bedrooms',e.target.value)} className="field"/></div><select value={form.status} onChange={e=>set('status',e.target.value as Property['status'])} className="field">{STATUSES.map(x=><option key={x}>{x}</option>)}</select><textarea placeholder="Description / notes" value={form.description} onChange={e=>set('description',e.target.value)} className="field min-h-24"/><button onClick={save} disabled={loading} className="w-full rounded-xl bg-[#1A365D] text-white py-3 font-semibold">{loading ? 'Saving…' : editing ? 'Update Property' : 'Add Property'}</button>{editing && <button onClick={()=>{setEditing(null);setForm(EMPTY)}} className="w-full mt-2 rounded-xl border py-3">Cancel</button>}{error && <p className="text-red-600 text-sm">{error}</p>}</div></div>

<div className="space-y-3">{filtered.length === 0 ? <div className="bg-white border rounded-2xl p-10 text-center text-gray-500">No properties match the current filters. Add your first real listing from the form.</div> : filtered.map(p=><div key={p.id} className="bg-white border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-lg">{p.title}</h3><span className="text-xs px-2 py-1 rounded-full bg-gray-100">{p.status}</span><span className="text-xs px-2 py-1 rounded-full bg-gray-100">{p.propertyType}</span></div><p className="text-[#1A365D] font-semibold mt-1">{p.location}</p><p className="text-sm text-gray-600 mt-1">{p.price || 'Price not set'}{p.area ? ` · ${p.area}` : ''}{p.bedrooms ? ` · ${p.bedrooms}` : ''}</p>{p.description && <p className="text-sm text-gray-500 mt-2">{p.description}</p>}</div><div className="flex gap-2 flex-wrap"><button onClick={()=>shareProperty(p)} disabled={p.status !== 'Available'} className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">WhatsApp Share</button><button onClick={()=>{setEditing(p.id);setForm({...p});window.scrollTo({top:0,behavior:'smooth'})}} className="border rounded-lg px-3 py-2 text-sm">Edit</button><button onClick={()=>remove(p.id)} className="border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm">Delete</button></div></div>)}</div></div></div><style>{`.field{width:100%;border:1px solid #d1d5db;border-radius:12px;padding:11px 13px;background:white}`}</style></div>;
}
