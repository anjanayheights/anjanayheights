import { useEffect, useState } from 'react';

type Lead = { id: string; created_at: string; name: string; phone: string; email?: string; lead_type: string; property_type: string; location: string; budget: string; timeline: string; requirement: string; message: string };

const emptyForm = { name: '', phone: '', propertyType: '', location: '', budget: '', timeline: 'Urgent', requirement: '' };

export default function BuyerRequirements() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/leads', { headers: { Authorization: `Bearer ${password}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load requirements');
      setLeads((data.leads || []).filter((lead: Lead) => String(lead.lead_type || '').toLowerCase().includes('buyer')));
      setLoggedIn(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load requirements'); }
    finally { setLoading(false); }
  }

  async function addRequirement(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, phone: form.phone, lead_type: 'Buyer Requirement',
          property_type: form.propertyType, location: form.location, budget: form.budget,
          timeline: form.timeline, requirement: form.requirement,
          message: form.requirement,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save requirement');
      setForm(emptyForm); setMessage('Buyer requirement saved successfully.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save requirement'); }
    finally { setSaving(false); }
  }

  useEffect(() => { if (loggedIn) void load(); }, [loggedIn]);

  if (!loggedIn) return <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4"><form onSubmit={(e) => { e.preventDefault(); if (password.trim()) setLoggedIn(true); }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"><h1 className="text-3xl font-bold text-[#1A365D]">Buyer Requirements</h1><p className="text-gray-500 mt-2">Anjanay Heights CRM</p><label className="block mt-8 mb-2 font-semibold">Dashboard Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-xl px-4 py-3" placeholder="Enter password" />{error && <p className="text-red-600 text-sm mt-3">{error}</p>}<button disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Loading...' : 'Open Requirements'}</button></form></div>;

  return <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8"><div className="max-w-6xl mx-auto"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6"><div><h1 className="text-3xl font-bold text-[#1A365D]">🎯 Buyer Requirements</h1><p className="text-gray-500">Separate buyer demand from property inventory and closed deals.</p></div><button onClick={() => void load()} className="bg-[#1A365D] text-white px-5 py-3 rounded-xl font-semibold">Refresh</button></div>
    <form onSubmit={addRequirement} className="bg-white rounded-2xl shadow p-5 mb-6"><h2 className="text-xl font-bold text-[#1A365D] mb-4">Add Buyer Requirement</h2><div className="grid md:grid-cols-2 gap-3">{[['name','Buyer / Company Name'],['phone','Mobile Number'],['propertyType','Property Type / Requirement'],['location','Preferred Location'],['budget','Budget'],['timeline','Timeline']].map(([key,label]) => <input key={key} required={['name','phone','propertyType','location'].includes(key)} value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={label} className="border rounded-xl px-4 py-3" />)}<textarea value={form.requirement} onChange={e => setForm({ ...form, requirement: e.target.value })} placeholder="Detailed requirement" className="border rounded-xl px-4 py-3 md:col-span-2 min-h-24" /></div><button disabled={saving} className="mt-4 bg-[#1A365D] text-white rounded-xl px-6 py-3 font-semibold">{saving ? 'Saving...' : 'Save Buyer Requirement'}</button>{message && <span className="ml-3 text-green-700 text-sm">{message}</span>}{error && <p className="text-red-600 text-sm mt-3">{error}</p>}</form>
    <div className="space-y-4">{leads.map(lead => <div key={lead.id} className="bg-white rounded-2xl shadow p-5"><div className="flex flex-col md:flex-row md:justify-between gap-3"><div><h3 className="text-xl font-bold text-[#1A365D]">{lead.name} <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-1 ml-2">BUYER</span></h3><p className="text-gray-600 mt-1">📞 {lead.phone}</p></div><div className="text-left md:text-right"><p className="font-bold">{lead.property_type}</p><p className="text-gray-600">{lead.location}</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4"><div><p className="text-xs text-gray-500">Budget</p><p className="font-semibold">{lead.budget || 'Not specified'}</p></div><div><p className="text-xs text-gray-500">Timeline</p><p className="font-semibold">{lead.timeline || 'Not specified'}</p></div><div><p className="text-xs text-gray-500">Requirement</p><p className="font-semibold">{lead.requirement || lead.message || '—'}</p></div><div><p className="text-xs text-gray-500">Received</p><p className="font-semibold">{new Date(lead.created_at).toLocaleDateString('en-IN')}</p></div></div></div>)}{!leads.length && <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">No buyer requirements yet.</div>}</div>
  </div></div>;
}
