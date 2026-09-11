import { useEffect, useRef, useState } from 'react';

const CRM_SESSION_KEY = 'anjanay-heights-crm-password';
const LEGACY_CRM_SESSION_KEY = 'crm_password';
const LAST_SEEN_KEY = 'anjanay-heights-last-lead-alert';
const PUSH_ENABLED_KEY = 'anjanay-heights-push-enabled';

type Lead = { id: string; created_at?: string; name?: string; phone?: string; property_type?: string; location?: string; budget?: string; timeline?: string };

function authHeaders() {
  const password = sessionStorage.getItem(CRM_SESSION_KEY) || sessionStorage.getItem(LEGACY_CRM_SESSION_KEY) || '';
  return password ? { Authorization: `Bearer ${password}` } : {};
}

function playAlert() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = 880; gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch { /* browser may block audio until interaction */ }
}

function base64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function enableWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Push is not supported by this browser.');
  const headers = authHeaders();
  const keyResponse = await fetch('/api/push', { headers, cache: 'no-store' });
  const keyData = await keyResponse.json();
  if (!keyResponse.ok || !keyData.publicKey) throw new Error(keyData.error || 'Push notifications are not configured yet.');
  const registration = await navigator.serviceWorker.register('/lead-alert-sw.js');
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToUint8Array(keyData.publicKey) });
  const save = await fetch('/api/push', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) });
  if (!save.ok) { const data = await save.json().catch(() => ({})); throw new Error(data.error || 'Could not save push subscription.'); }
  localStorage.setItem(PUSH_ENABLED_KEY, '1');
}

export default function LeadAlert() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [pushReady, setPushReady] = useState(localStorage.getItem(PUSH_ENABLED_KEY) === '1');
  const [toast, setToast] = useState<Lead | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
    const stored = localStorage.getItem(LAST_SEEN_KEY);
    if (!stored) localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());

    const check = async () => {
      const password = sessionStorage.getItem(CRM_SESSION_KEY) || sessionStorage.getItem(LEGACY_CRM_SESSION_KEY) || '';
      if (!password) return;
      try {
        const res = await fetch('/api/leads', { headers: { Authorization: `Bearer ${password}` }, cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const leads: Lead[] = Array.isArray(data?.leads) ? data.leads : Array.isArray(data) ? data : [];
        if (!initialized.current) { initialized.current = true; return; }
        const lastSeen = localStorage.getItem(LAST_SEEN_KEY) || '';
        const fresh = leads.filter(l => l.id && l.created_at && l.created_at > lastSeen).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
        if (!fresh.length) return;
        const newest = fresh[fresh.length - 1];
        localStorage.setItem(LAST_SEEN_KEY, newest.created_at || new Date().toISOString());
        setToast(newest); playAlert();
        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification('🔔 New Anjanay Heights Lead', { body: `${newest.name || 'New lead'} • ${newest.phone || 'Phone not provided'}${newest.location ? `\n${newest.location}` : ''}`, tag: `lead-${newest.id}`, requireInteraction: true });
          n.onclick = () => { window.focus(); n.close(); };
        }
        window.setTimeout(() => setToast(null), 9000);
      } catch { /* polling should never disrupt the CRM */ }
    };
    check(); const timer = window.setInterval(check, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const enable = async () => {
    if (!('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return;
      await enableWebPush();
      setPushReady(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Lead push alerts could not be enabled.');
    }
  };

  return <>
    {(!pushReady || permission !== 'granted') && permission !== 'unsupported' && <button onClick={enable} className="fixed bottom-20 right-4 z-[100] rounded-full bg-[#1A365D] px-4 py-3 text-xs font-bold text-white shadow-xl hover:opacity-90">🔔 {pushReady ? 'Lead Alerts On' : 'Enable Lead Alerts'}</button>}
    {toast && <div className="fixed right-4 top-4 z-[110] w-[min(380px,calc(100vw-2rem))] rounded-2xl bg-white p-5 shadow-2xl border border-[#C2A36B]">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B]">New Lead • Action Required</div>
      <div className="mt-2 text-lg font-semibold text-[#1A365D]">{toast.name || 'New enquiry'}</div>
      <div className="mt-1 text-sm text-gray-600">{toast.phone || 'Phone not provided'}{toast.location ? ` • ${toast.location}` : ''}</div>
      {toast.budget && <div className="mt-1 text-xs text-gray-500">Budget: {toast.budget}</div>}
      <div className="mt-4 flex gap-2"><a href={toast.phone ? `tel:${toast.phone}` : '/admin/sales-engine'} className="flex-1 rounded-lg bg-[#1A365D] py-2.5 text-center text-xs font-bold text-white">📞 Call</a><a href="/admin/sales-engine" className="flex-1 rounded-lg border border-[#1A365D] py-2.5 text-center text-xs font-bold text-[#1A365D]">Open Lead</a></div>
    </div>}
  </>;
}
