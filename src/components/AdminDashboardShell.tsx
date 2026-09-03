import LeadDashboard from './LeadDashboard';

export default function AdminDashboardShell() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1A365D]">Anjanay Heights CRM</p>
          <div className="flex gap-2">
            <button onClick={() => { window.location.href = '/admin/matches'; }} className="rounded-lg bg-[#1A365D] px-3 py-2 text-sm font-semibold text-white">
              🎯 Matched Properties
            </button>
            <button onClick={() => { window.location.href = '/admin/properties'; }} className="rounded-lg border border-[#1A365D] px-3 py-2 text-sm font-semibold text-[#1A365D]">
              🏠 Property Inventory
            </button>
          </div>
        </div>
      </div>
      <LeadDashboard />
    </div>
  );
}
