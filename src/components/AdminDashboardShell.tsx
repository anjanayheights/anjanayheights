import { useEffect, useState } from 'react';
import LeadDashboard from './LeadDashboard';
import LeadPriorityCenter from './LeadPriorityCenter';
import RevenueCommissionSummary from './RevenueCommissionSummary';
import CommissionCollectionTracker from './CommissionCollectionTracker';
import TodayActionCenter from './TodayActionCenter';
import LeadDealConversion from './LeadDealConversion';
import SmartFollowupPanel from './SmartFollowupPanel';
import CRMAlertBanner from './CRMAlertBanner';
import WebsiteViewerCard from './WebsiteViewerCard';
import SalesPerformanceSnapshot from './SalesPerformanceSnapshot';

const CRM_SESSION_KEY = 'anjanay-heights-crm-password';

function setControlledInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function unlockChildPasswordGates(password: string) {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="password"]'));
  inputs.forEach((input) => {
    if (!input.value) setControlledInputValue(input, password);
    const form = input.closest('form');
    const scope = form || input.parentElement?.parentElement || input.parentElement;
    const button = scope?.querySelector<HTMLButtonElement>('button');
    if (button && !button.disabled) button.click();
  });
}

export default function AdminDashboardShell() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem(CRM_SESSION_KEY) || '';
    if (!stored) return;
    let cancelled = false;
    fetch('/api/leads?_session=1', { headers: { Authorization: `Bearer ${stored}`, 'Cache-Control': 'no-cache' }, cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Session expired');
        if (!cancelled) { setPassword(stored); setAuthenticated(true); }
      })
      .catch(() => sessionStorage.removeItem(CRM_SESSION_KEY));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!authenticated || !password) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      unlockChildPasswordGates(password);
      attempts += 1;
      if (attempts >= 12 || document.querySelectorAll('input[type="password"]').length === 0) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [authenticated, password]);

  async function login() {
    const value = password.trim();
    if (!value) { setError('Please enter CRM password.'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/leads?_login=1', { headers: { Authorization: `Bearer ${value}`, 'Cache-Control': 'no-cache' }, cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Invalid CRM password');
      sessionStorage.setItem(CRM_SESSION_KEY, value);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open CRM');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(CRM_SESSION_KEY);
    setAuthenticated(false);
    setPassword('');
    setError('');
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#1A365D] text-center">Anjanay Heights CRM</h1>
          <p className="text-gray-500 text-center mt-2">Secure single-login dashboard</p>
          <label className="block mt-8 mb-2 font-semibold">CRM Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void login(); }} placeholder="Enter CRM password" className="w-full border rounded-xl px-4 py-3" />
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <button onClick={() => void login()} disabled={loading} className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold disabled:opacity-60">
            {loading ? 'Opening CRM...' : 'Open CRM'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20 md:pb-0">
      <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur px-3 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1A365D]">Anjanay Heights CRM</p>
          <div className="flex items-center gap-2">
            <button onClick={logout} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Logout</button>
            <div className="hidden md:flex gap-2 flex-wrap">
              <button onClick={() => { window.location.href = '/admin/workspace'; }} className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white">🎯 Sales Control Center</button>
              <button onClick={() => { window.location.href = '/admin/telecalling'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">📞 Telecalling CRM</button>
              <button onClick={() => { window.location.href = '/admin/leads-growth'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">🚀 Lead Generation</button>
              <button onClick={() => { window.location.href = '/admin/lead-quality'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">🔥 Lead Quality</button>
              <button onClick={() => { window.location.href = '/admin/daily-followups'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">📅 Daily Follow-ups</button>
              <button onClick={() => { window.location.href = '/admin/followup-automation'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">⚙️ Follow-up Automation</button>
              <button onClick={() => { window.location.href = '/admin/lead-360'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">👤 Lead 360</button>
              <button onClick={() => { window.location.href = '/admin/ai'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">🤖 AI Lead Assistant</button>
              <button onClick={() => { window.location.href = '/admin/pipeline'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">📈 Sales Pipeline</button>
              <button onClick={() => { window.location.href = '/admin/matches'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">🎯 Matched Properties</button>
              <button onClick={() => { window.location.href = '/admin/properties'; }} className="rounded-lg border border-[#1A365D] px-3 py-2 text-sm font-semibold text-[#1A365D]">🏠 Property Inventory</button>
              <button onClick={() => { window.location.href = '/admin/requirements'; }} className="rounded-lg border border-[#1A365D] px-3 py-2 text-sm font-semibold text-[#1A365D]">🎯 Buyer Requirements</button>
            </div>
          </div>
        </div>
      </div>
      <CRMAlertBanner />
      <WebsiteViewerCard />
      <TodayActionCenter />
      <SmartFollowupPanel />
      <SalesPerformanceSnapshot />
      <LeadDealConversion />
      <RevenueCommissionSummary />
      <CommissionCollectionTracker />
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
        <LeadPriorityCenter />
      </div>
      <LeadDashboard />
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white/98 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-2 py-2">
        <div className="grid grid-cols-4 gap-1 max-w-lg mx-auto">
          <button onClick={() => { window.location.href = '/admin/workspace'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">🎯<span className="block mt-0.5">Control</span></button>
          <button onClick={() => { window.location.href = '/admin/lead-quality'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">🔥<span className="block mt-0.5">Quality</span></button>
          <button onClick={() => { window.location.href = '/admin/followup-automation'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">⚙️<span className="block mt-0.5">Automation</span></button>
          <button onClick={() => { window.location.href = '/admin/lead-360'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">👤<span className="block mt-0.5">Lead 360</span></button>
        </div>
      </nav>
    </div>
  );
}