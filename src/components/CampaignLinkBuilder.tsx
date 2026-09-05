import { useMemo, useState } from 'react';

const BASE_URL = 'https://anjanayheights-9m6i.vercel.app/';
const SOURCES = ['whatsapp', 'facebook', 'instagram', 'google', 'referral', '99acres', 'magicbricks'];

export default function CampaignLinkBuilder() {
  const [source, setSource] = useState('whatsapp');
  const [medium, setMedium] = useState('social');
  const [campaign, setCampaign] = useState('noida-property');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const params = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: campaign });
    if (content.trim()) params.set('utm_content', content.trim());
    return `${BASE_URL}?${params.toString()}`;
  }, [source, medium, campaign, content]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Anjanay Heights CRM</p>
            <h1 className="mt-1 text-3xl font-bold text-[#1A365D]">🔗 Campaign Link Builder</h1>
            <p className="mt-1 text-slate-600">Create tagged links so every enquiry can be attributed to its campaign.</p>
          </div>
          <a href="/admin" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Dashboard</a>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Source<select value={source} onChange={e => setSource(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3">{SOURCES.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Medium<input value={medium} onChange={e => setMedium(e.target.value)} placeholder="social / cpc / broadcast / referral" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3" /></label>
            <label className="text-sm font-medium text-slate-700">Campaign<input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="noida-property-september" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3" /></label>
            <label className="text-sm font-medium text-slate-700">Content (optional)<input value={content} onChange={e => setContent(e.target.value)} placeholder="reel-1 / status-2 / ad-a" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3" /></label>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Generated campaign URL</p>
            <p className="mt-2 break-all text-sm text-slate-800">{url}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => void copyLink()} className="rounded-lg bg-[#1A365D] px-4 py-2 text-sm font-semibold text-white">{copied ? 'Copied ✓' : 'Copy Link'}</button>
              <a href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Test Link</a>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4"><strong>WhatsApp</strong><p className="mt-1 text-xs text-slate-600">Use for Status and broadcast links.</p></div>
            <div className="rounded-xl border p-4"><strong>Meta</strong><p className="mt-1 text-xs text-slate-600">Use separate campaign/content values for each ad or Reel.</p></div>
            <div className="rounded-xl border p-4"><strong>Google</strong><p className="mt-1 text-xs text-slate-600">Use source=google and medium=cpc for paid search.</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
