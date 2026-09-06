import LeadDashboard from './LeadDashboard';
import LeadPriorityCenter from './LeadPriorityCenter';
import RevenueCommissionSummary from './RevenueCommissionSummary';
import CommissionCollectionTracker from './CommissionCollectionTracker';
import TodayActionCenter from './TodayActionCenter';
import LeadDealConversion from './LeadDealConversion';
import SmartFollowupPanel from './SmartFollowupPanel';

export default function AdminDashboardShell() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20 md:pb-0">
      <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur px-3 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1A365D]">Anjanay Heights CRM</p>
          <div className="hidden md:flex gap-2 flex-wrap">
            <button onClick={() => { window.location.href = '/admin/workspace'; }} className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white">🎯 Sales Control Center</button>
            <button onClick={() => { window.location.href = '/admin/telecalling'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">📞 Telecalling CRM</button>
            <button onClick={() => { window.location.href = '/admin/leads-growth'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">🚀 Lead Generation</button>
            <button onClick={() => { window.location.href = '/admin/lead-quality'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">🔥 Lead Quality</button>
            <button onClick={() => { window.location.href = '/admin/daily-followups'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">📅 Daily Follow-ups</button>
            <button onClick={() => { window.location.href = '/admin/ai'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">🤖 AI Lead Assistant</button>
            <button onClick={() => { window.location.href = '/admin/pipeline'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">📈 Sales Pipeline</button>
            <button onClick={() => { window.location.href = '/admin/matches'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">🎯 Matched Properties</button>
            <button onClick={() => { window.location.href = '/admin/properties'; }} className="rounded-lg border border-[#1A365D] px-3 py-2 text-sm font-semibold text-[#1A365D]">🏠 Property Inventory</button>
            <button onClick={() => { window.location.href = '/admin/requirements'; }} className="rounded-lg border border-[#1A365D] px-3 py-2 text-sm font-semibold text-[#1A365D]">🎯 Buyer Requirements</button>
          </div>
        </div>
      </div>
      <TodayActionCenter />
      <SmartFollowupPanel />
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
          <button onClick={() => { window.location.href = '/admin/daily-followups'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">📅<span className="block mt-0.5">Follow-ups</span></button>
          <button onClick={() => { window.location.href = '/admin/telecalling'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">📞<span className="block mt-0.5">Calls</span></button>
        </div>
      </nav>
    </div>
  );
}
