import LeadDashboard from './LeadDashboard';

export default function AdminDashboardShell() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20 md:pb-0">
      <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur px-3 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1A365D]">Anjanay Heights CRM</p>
          <div className="hidden md:flex gap-2">
            <button onClick={() => { window.location.href = '/admin/pipeline'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">📈 Sales Pipeline</button>
            <button onClick={() => { window.location.href = '/admin/matches'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">🎯 Matched Properties</button>
            <button onClick={() => { window.location.href = '/admin/properties'; }} className="rounded-lg border border-[#1A365D] px-3 py-2 text-sm font-semibold text-[#1A365D]">🏠 Property Inventory</button>
          </div>
        </div>
      </div>
      <LeadDashboard />
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white/98 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-2 py-2">
        <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">
          <button onClick={() => { window.location.href = '/admin'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">📊<span className="block mt-0.5">Leads</span></button>
          <button onClick={() => { window.location.href = '/admin/pipeline'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">📈<span className="block mt-0.5">Pipeline</span></button>
          <button onClick={() => { window.location.href = '/admin/matches'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">🎯<span className="block mt-0.5">Matches</span></button>
          <button onClick={() => { window.location.href = '/admin/properties'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">🏠<span className="block mt-0.5">Properties</span></button>
          <button onClick={() => { window.location.href = '/admin/followups'; }} className="rounded-xl py-2 text-[11px] font-semibold text-[#1A365D] active:bg-slate-100">📅<span className="block mt-0.5">Follow-ups</span></button>
        </div>
      </nav>
    </div>
  );
}
