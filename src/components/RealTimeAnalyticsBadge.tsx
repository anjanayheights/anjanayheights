import { useEffect, useState } from 'react';

export default function RealTimeAnalyticsBadge({ onRefresh }: { onRefresh: () => Promise<void> | void }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((s) => (s >= 14 ? 0 : s + 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 font-semibold text-gray-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        LIVE analytics
      </span>
      <span className="text-gray-400">Auto-sync {15 - seconds}s</span>
      <button onClick={() => void onRefresh()} className="rounded-lg border bg-white px-2.5 py-1.5 font-semibold text-[#1A365D] hover:bg-gray-50">
        Sync now
      </button>
    </div>
  );
}
