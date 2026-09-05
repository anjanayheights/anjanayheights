import { useState } from 'react';

type Lead = { id: string; name: string; form_name: string; lead_type: string; property_type: string; location: string; budget: string; timeline: string; requirement: string; message: string };
type Property = { id: string; title: string; propertyType: string; location: string; price: string; area: string; status: string };
type Mode = 'analyze' | 'campaign' | 'followup';
type Stage = 'idle' | 'checking' | 'loading' | 'ai';

async function readJson(response: Response) {
  const raw = await response.text();
  try { return raw ? JSON.parse(raw) : {}; } catch { return { error: raw || `HTTP ${response.status}` }; }
}

const buttonClass = 'relative z-[100] pointer-events-auto cursor-pointer touch-manipulation select-none active:scale-[0.99] transition-transform';

export default function AiLeadAssistant() {
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [mode, setMode] = useState<Mode>('analyze');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<Stage>('idle');

  function handleButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, action: () => void) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); }
  }

  async function checkPassword() {
    const enteredPassword = password.trim();
    if (!enteredPassword) { setError('Please enter the dashboard password.'); return; }
    setLoading(true); setStage('checking'); setError('');
    try {
      const response = await fetch('/api/auth', { method: 'GET', headers: { Authorization: `Bearer ${enteredPassword}`, Accept: 'application/json' }, cache: 'no-store' });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error || `Password check failed (HTTP ${response.status})`);
      setLoggedIn(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to verify dashboard password.'); }
    finally { setLoading(false); setStage('idle'); }
  }

  async function runAssistant() {
    if (loading) return;
    setLoading(true); setStage('loading'); setError(''); setText('');
    try {
      const headers = { Authorization: `Bearer ${password}`, Accept: 'application/json' };
      const [lr, pr, mr] = await Promise.all([
        fetch('/api/leads', { headers, cache: 'no-store' }),
        fetch('/api/properties', { headers, cache: 'no-store' }),
        fetch('/api/lead-meta', { headers, cache: 'no-store' })
      ]);
      const leadsData = await readJson(lr); const propertiesData = await readJson(pr); const metaData = await readJson(mr);
      if (!lr.ok) throw new Error(`CRM leads API failed: ${leadsData.error || `HTTP ${lr.status}`}`);
      if (!pr.ok) throw new Error(`Property API failed: ${propertiesData.error || `HTTP ${pr.status}`}`);
      if (!mr.ok) throw new Error(`Lead metadata API failed: ${metaData.error || `HTTP ${mr.status}`}`);
      const leads = (leadsData.leads || []).map((l: Lead) => ({ ...l, ...(metaData.meta?.[l.id] || {}) }));
      const properties = (propertiesData.properties || []).map((p: Property) => ({ id: p.id, title: p.title, propertyType: p.propertyType, location: p.location, price: p.price, area: p.area, status: p.status }));
      setStage('ai');
      const response = await fetch('/api/ai-lead-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}`, Accept: 'application/json' }, body: JSON.stringify({ mode, leads, properties }), cache: 'no-store' });
      const result = await readJson(response);
      if (!response.ok) throw new Error(`AI API failed: ${result.error || `HTTP ${response.status}`}`);
      setText(result.text || 'No AI response generated.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong while running AI.'); }
    finally { setLoading(false); setStage('idle'); }
  }

  const selectMode = (nextMode: Mode) => {
    if (loading) return;
    setError('');
    setText('');
    setMode(nextMode);
  };

  if (!loggedIn) return (
    <div className="relative z-0 isolate min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
      <form onSubmit={e => { e.preventDefault(); void checkPassword(); }} className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center"><div className="text-4xl">🤖</div><h1 className="text-3xl font-bold text-[#1A365D] mt-2">AI Lead Assistant</h1><p className="text-gray-500 mt-2">Gemini-powered sales assistant for Anjanay Heights</p></div>
        <label className="block mt-8 mb-2 font-semibold">Dashboard Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="relative z-[100] w-full border rounded-xl px-4 py-3 pointer-events-auto" autoComplete="current-password" />
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <button type="submit" disabled={loading} className={`${buttonClass} w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold disabled:opacity-60`}>{loading ? 'Verifying...' : 'Open AI Assistant'}</button>
      </form>
    </div>
  );

  const statusText = stage === 'loading' ? 'Loading CRM data...' : stage === 'ai' ? 'Calling AI API...' : '';

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div><button type="button" onClick={() => { window.location.href = '/admin'; }} onKeyDown={e => handleButtonKeyDown(e, () => { window.location.href = '/admin'; })} className={`${buttonClass} text-sm text-[#1A365D] font-semibold mb-2`}>← CRM Dashboard</button><h1 className="text-3xl font-bold text-[#1A365D]">🤖 AI Lead Assistant</h1><p className="text-gray-500 mt-1">Turn your existing leads into a daily sales action plan.</p></div>
          <button type="button" onClick={() => { setLoggedIn(false); setPassword(''); setText(''); setError(''); }} onKeyDown={e => handleButtonKeyDown(e, () => { setLoggedIn(false); setPassword(''); setText(''); setError(''); })} className={`${buttonClass} bg-white border px-4 py-2 rounded-xl font-semibold`}>Logout</button>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mb-5" style={{ position: 'relative', zIndex: 1000, pointerEvents: 'auto' }}>
          <button type="button" aria-pressed={mode === 'analyze'} onClick={() => selectMode('analyze')} onKeyDown={e => handleButtonKeyDown(e, () => selectMode('analyze'))} className={`${buttonClass} text-left rounded-2xl p-5 border-2 ${mode === 'analyze' ? 'border-[#1A365D] bg-white' : 'border-transparent bg-white'}`}><div className="text-2xl">🎯</div><p className="font-bold mt-2">Analyze Leads</p><p className="text-sm text-gray-500 mt-1">Find the top opportunities and today's priorities.</p></button>
          <button type="button" aria-pressed={mode === 'campaign'} onClick={() => selectMode('campaign')} onKeyDown={e => handleButtonKeyDown(e, () => selectMode('campaign'))} className={`${buttonClass} text-left rounded-2xl p-5 border-2 ${mode === 'campaign' ? 'border-[#1A365D] bg-white' : 'border-transparent bg-white'}`}><div className="text-2xl">📣</div><p className="font-bold mt-2">Get More Leads</p><p className="text-sm text-gray-500 mt-1">Create a 7-day WhatsApp, Meta and Google lead plan.</p></button>
          <button type="button" aria-pressed={mode === 'followup'} onClick={() => selectMode('followup')} onKeyDown={e => handleButtonKeyDown(e, () => selectMode('followup'))} className={`${buttonClass} text-left rounded-2xl p-5 border-2 ${mode === 'followup' ? 'border-[#1A365D] bg-white' : 'border-transparent bg-white'}`}><div className="text-2xl">💬</div><p className="font-bold mt-2">Follow-up Messages</p><p className="text-sm text-gray-500 mt-1">Generate ready-to-send WhatsApp follow-ups.</p></button>
        </div>
        <div className="relative z-10 bg-white rounded-2xl shadow p-5 mb-5"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p className="font-bold text-lg text-[#1A365D]">{mode === 'analyze' ? 'Sales Manager' : mode === 'campaign' ? 'Lead Generation Planner' : 'WhatsApp Follow-up Writer'}</p><p className="text-sm text-gray-500">AI will use your CRM leads and available property inventory.</p>{statusText && <p className="text-sm text-blue-700 mt-2 font-medium">{statusText}</p>}</div><button type="button" onClick={() => { void runAssistant(); }} onKeyDown={e => handleButtonKeyDown(e, () => { void runAssistant(); })} disabled={loading} className={`${buttonClass} bg-[#1A365D] text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-60`}>{loading ? 'Working...' : 'Run AI'}</button></div>{error && <div className="mt-4 bg-red-50 text-red-700 rounded-xl p-3 text-sm break-words">{error}</div>}</div>
        {text ? <div className="relative z-10 bg-white rounded-2xl shadow p-6"><h2 className="font-bold text-[#1A365D] text-xl mb-4">AI Recommendation</h2><div className="whitespace-pre-wrap leading-7 text-gray-800">{text}</div></div> : <div className="relative z-10 bg-white rounded-2xl border border-dashed p-10 text-center text-gray-500">Choose a mode and tap <strong>Run AI</strong>.</div>}
      </div>
    </div>
  );
}
