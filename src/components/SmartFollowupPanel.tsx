import { useEffect, useState } from 'react';

type Recommendation = {
  leadId: string; name?: string; phone?: string; priority?: string; status?: string;
  action: string; followUp?: string; reason?: string;
};

export default function SmartFollowupPanel() {
  const [password, setPassword] = useState(sessionStorage.getItem('anjanay-heights-crm-password') || '');
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!password) return;
    setLoading(true); setMessage('');
    try {
      const res = await fetch('/api/followup-engine', { headers: { Authorization: `Bearer ${password}` }, cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Unable to load recommendations');
      setItems((data.recommendations || []).filter((x: Recommendation) => x.action !== 'No Action').slice(0, 10));
      sessionStorage.setItem('anjanay-heights-crm-password', password);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load recommendations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (password) load(); }, []);

  const apply = async (item: Recommendation) => {
    const body = { leadId: item.leadId, meta: { nextAction: item.action, followUp: item.followUp || '' } };
    const res = await fetch('/api/lead-meta', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify(body) });
    if (res.ok) { setItems((current) => current.filter((x) => x.leadId !== item.leadId)); setMessage(`${item.name || 'Lead'} updated.`); }
    else setMessage('Could not apply recommendation.');
  };

  if (!password) return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
      <div className="rounded-2xl bg-white border p-5"><h2 className="text-xl font-bold text-[#1A365D]">🧠 Smart Follow-up Engine</h2><p className="text-sm text-slate-500 mt-1">Backend-generated next actions for active leads.</p><div className="flex gap-2 mt-4"><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="CRM password" className="border rounded-lg px-3 py-2 w-full max-w-sm" /><button onClick={load} className="rounded-lg bg-[#1A365D] px-4 py-2 text-white font-semibold">Open</button></div></div>
    </section>
  );

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
      <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between"><div><h2 className="text-xl font-bold text-[#1A365D]">🧠 Smart Follow-up Engine</h2><p className="text-sm text-slate-500 mt-1">Backend recommendation + one-click apply.</p></div><button onClick={load} className="rounded-lg border px-3 py-2 text-sm font-semibold">{loading ? 'Loading…' : '↻ Refresh'}</button></div>
        {message && <div className="px-5 py-2 text-sm text-slate-600">{message}</div>}
        <div className="p-4 space-y-2">
          {!items.length && !loading ? <div className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">✅ No new smart recommendations right now.</div> : items.map((item) => (
            <div key={item.leadId} className="border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div><b>{item.name || 'Lead'}</b><div className="text-xs text-slate-500">{item.priority || 'Warm'} · {item.status || 'New'} · Suggested: <strong>{item.action}</strong> · {item.followUp || 'Next available'}</div><div className="text-xs text-slate-500 mt-1">{item.reason}</div></div>
              <div className="flex gap-2"><button onClick={() => apply(item)} className="rounded-lg bg-[#1A365D] px-3 py-2 text-xs text-white">Apply</button>{item.phone && <button onClick={() => window.open(`tel:${item.phone}`)} className="rounded-lg border px-3 py-2 text-xs">📞 Call</button>}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
