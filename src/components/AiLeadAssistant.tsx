import { useState } from 'react';

type Lead = { id: string; name: string; form_name: string; lead_type: string; property_type: string; location: string; budget: string; timeline: string; requirement: string; message: string };
type Property = { id: string; title: string; propertyType: string; location: string; price: string; area: string; status: string };

type Mode = 'analyze' | 'campaign' | 'followup';

export default function AiLeadAssistant() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [mode, setMode] = useState<Mode>('analyze');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runAssistant() {
    setLoading(true); setError(''); setText('');
    try {
      const [lr, pr, mr] = await Promise.all([
        fetch('/api/leads', { headers: { Authorization: `Bearer ${password}` } }),
        fetch('/api/properties', { headers: { Authorization: `Bearer ${password}` } }),
        fetch('/api/lead-meta', { headers: { Authorization: `Bearer ${password}` } })
      ]);
      if (!lr.ok) throw new Error('Unable to load leads. Check dashboard password.');
      const leadsData = await lr.json();
      const propertiesData = pr.ok ? await pr.json() : { properties: [] };
      const metaData = mr.ok ? await mr.json() : { meta: {} };
      const leads = (leadsData.leads || []).map((l: Lead) => ({ ...l, ...(metaData.meta?.[l.id] || {}) }));
      const properties = (propertiesData.properties || []).map((p: Property) => ({
        id: p.id, title: p.title, propertyType: p.propertyType, location: p.location,
        price: p.price, area: p.area, status: p.status
      }));
      const response = await fetch('/api/ai-lead-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ mode, leads, properties })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'AI request failed');
      setText(result.text || 'No response');
      setLoggedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
  }

  if (!loggedIn) return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
      <form onSubmit={e => { e.preventDefault(); void runAssistant(); }} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center"><div className="text-4xl">🤖</div><h1 className="text-3xl font-bold text-[#1A365D] mt-2">AI Lead Assistant</h1><p className="text-gray-500 mt-2">Gemini-powered sales assistant for Anjanay Heights</p></div>
        <label className="block mt-8 mb-2 font-semibold">Dashboard Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full border rounded-xl px-4 py-3" />
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <button type="submit" disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold">{loading ? 'Connecting AI...' : 'Open AI Assistant'}</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div><button onClick={() => { window.location.href = '/admin'; }} className="text-sm text-[#1A365D] font-semibold mb-2">← CRM Dashboard</button><h1 className="text-3xl font-bold text-[#1A365D]">🤖 AI Lead Assistant</h1><p className="text-gray-500 mt-1">Turn your existing leads into a daily sales action plan.</p></div>
          <button onClick={() => { setLoggedIn(false); setPassword(''); setText(''); }} className="bg-white border px-4 py-2 rounded-xl font-semibold">Logout</button>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-5">
          <button onClick={() => setMode('analyze')} className={`text-left rounded-2xl p-5 border-2 ${mode === 'analyze' ? 'border-[#1A365D] bg-white' : 'border-transparent bg-white'}`}><div className="text-2xl">🎯</div><p className="font-bold mt-2">Analyze Leads</p><p className="text-sm text-gray-500 mt-1">Find the top opportunities and today's priorities.</p></button>
          <button onClick={() => setMode('campaign')} className={`text-left rounded-2xl p-5 border-2 ${mode === 'campaign' ? 'border-[#1A365D] bg-white' : 'border-transparent bg-white'}`}><div className="text-2xl">📣</div><p className="font-bold mt-2">Get More Leads</p><p className="text-sm text-gray-500 mt-1">Create a 7-day WhatsApp, Meta and Google lead plan.</p></button>
          <button onClick={() => setMode('followup')} className={`text-left rounded-2xl p-5 border-2 ${mode === 'followup' ? 'border-[#1A365D] bg-white' : 'border-transparent bg-white'}`}><div className="text-2xl">💬</div><p className="font-bold mt-2">Follow-up Messages</p><p className="text-sm text-gray-500 mt-1">Generate ready-to-send WhatsApp follow-ups.</p></button>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 mb-5"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p className="font-bold text-lg text-[#1A365D]">{mode === 'analyze' ? 'Sales Manager' : mode === 'campaign' ? 'Lead Generation Planner' : 'WhatsApp Follow-up Writer'}</p><p className="text-sm text-gray-500">AI will use your CRM leads and available property inventory.</p></div><button onClick={() => void runAssistant()} disabled={loading} className="bg-[#1A365D] text-white px-6 py-3 rounded-xl font-semibold">{loading ? 'AI is working...' : 'Run AI'}</button></div>{error && <div className="mt-4 bg-red-50 text-red-700 rounded-xl p-3 text-sm">{error}</div>}</div>

        {text ? <div className="bg-white rounded-2xl shadow p-6"><h2 className="font-bold text-[#1A365D] text-xl mb-4">AI Recommendation</h2><div className="whitespace-pre-wrap leading-7 text-gray-800">{text}</div></div> : <div className="bg-white rounded-2xl border border-dashed p-10 text-center text-gray-500">Choose a mode and tap <strong>Run AI</strong>.</div>}
      </div>
    </div>
  );
}
