import { useEffect, useState } from 'react';
import { Eye, RefreshCw } from 'lucide-react';

export default function WebsiteViewerCard() {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/visitor', { cache: 'no-store' });
      const data = await response.json();
      setTotal(Number(data.totalViewers || 0));
    } catch {
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-[#1A365D]"><Eye size={22} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Website Viewers</p>
              <p className="text-3xl font-bold text-[#1A365D]">{loading ? '…' : total === null ? '—' : total.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-400 mt-1">Unique visitors counted with a 1-year browser cookie</p>
            </div>
          </div>
          <button onClick={load} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Refresh viewer count">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </section>
  );
}
