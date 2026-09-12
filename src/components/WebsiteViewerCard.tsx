import { useEffect, useState } from 'react';
import { Eye, RefreshCw, Users } from 'lucide-react';

const REFRESH_MS = 15_000;

export default function WebsiteViewerCard() {
  const [total, setTotal] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/visitor', { cache: 'no-store' });
      if (!response.ok) throw new Error('Visitor API failed');
      const data = await response.json();
      setTotal(Number(data.totalViewers || 0));
      setActive(Number(data.activeVisitors || 0));
    } catch {
      setTotal(null);
      setActive(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-[#1A365D]"><Eye size={22} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Website Visitors</p>
              <p className="text-3xl font-bold text-[#1A365D]">{loading ? '…' : total === null ? '—' : total.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-400 mt-1">Unique visitors · 1-year browser cookie</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-700"><Users size={17} /><span className="text-xs font-semibold uppercase tracking-wide">Live now</span></div>
              <p className="text-2xl font-bold text-emerald-800 mt-1">{loading ? '…' : active === null ? '—' : active.toLocaleString('en-IN')}</p>
            </div>
            <button onClick={() => void load()} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Refresh visitor count">
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
