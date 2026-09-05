import React, { useMemo, useState } from 'react';

const plan = [
  ['Day 1', 'WhatsApp + old leads', 'Post 2 property/status updates and personally message 20 old enquiries.'],
  ['Day 2', 'Meta', 'Publish one buyer-focused Reel and one Marketplace/group listing with a clear WhatsApp CTA.'],
  ['Day 3', 'Google', 'Create/refresh a high-intent offer and ask recent genuine clients for reviews.'],
  ['Day 4', 'Referral', 'Contact 10 brokers, owners and past clients and ask for direct buyer requirements.'],
  ['Day 5', 'Portals', 'Refresh priority listings and respond to every enquiry within 10 minutes where possible.'],
  ['Day 6', 'Meta + WhatsApp', 'Repeat the best-performing property creative and push a limited inventory message.'],
  ['Day 7', 'Review', 'Count leads by source, identify the best channel and double down next week.'],
];

const channels = [
  ['📱', 'WhatsApp', 'Status, broadcast lists and direct follow-up. Best for warm/referral leads.'],
  ['📣', 'Meta', 'Facebook + Instagram Reels, Marketplace and targeted lead campaigns.'],
  ['🔎', 'Google', 'Capture high-intent searches such as property + location + budget.'],
  ['🤝', 'Referral', 'Owners, brokers, past clients and local business contacts.'],
  ['🏠', 'Portals', 'Keep selected listings fresh and qualify enquiries immediately.'],
];

export default function LeadGenerationCenter() {
  const [dailyBudget, setDailyBudget] = useState(500);
  const [days, setDays] = useState(7);
  const [cpl, setCpl] = useState(250);
  const [target, setTarget] = useState(10);
  const estimate = useMemo(() => Math.max(0, Math.floor((dailyBudget * days) / Math.max(1, cpl))), [dailyBudget, days, cpl]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Anjanay Heights CRM</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">🚀 Lead Generation Center</h1>
            <p className="mt-1 text-sm text-slate-600">A practical system to create, track and convert new real-estate enquiries.</p>
          </div>
          <a href="/admin" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">CRM Dashboard</a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[#1A365D] p-5 text-white shadow-sm"><p className="text-sm opacity-80">Daily qualified lead target</p><p className="mt-2 text-3xl font-bold">{target}</p><p className="mt-1 text-sm opacity-80">Focus on quality, not just enquiry count.</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">7-day ad budget</p><p className="mt-2 text-3xl font-bold text-slate-900">₹{(dailyBudget * days).toLocaleString('en-IN')}</p><p className="mt-1 text-sm text-slate-500">Editable planning estimate.</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Estimated enquiries</p><p className="mt-2 text-3xl font-bold text-slate-900">{estimate}</p><p className="mt-1 text-sm text-slate-500">Based on your assumed CPL of ₹{cpl}.</p></div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Lead budget planner</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">Daily ad budget (₹)<input type="number" min="0" value={dailyBudget} onChange={e => setDailyBudget(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-slate-700">Campaign days<input type="number" min="1" value={days} onChange={e => setDays(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-slate-700">Assumed cost per lead (₹)<input type="number" min="1" value={cpl} onChange={e => setCpl(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-slate-700">Daily target<input type="number" min="1" value={target} onChange={e => setTarget(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Where to get leads</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {channels.map(([icon, title, text]) => <div key={title} className="rounded-xl border border-slate-200 p-4"><div className="text-2xl">{icon}</div><h3 className="mt-2 font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-600">{text}</p></div>)}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-slate-900">7-day lead generation plan</h2><p className="text-sm text-slate-500">Do one focused acquisition task every day.</p></div><a href="/admin/ai" className="rounded-lg bg-[#1A365D] px-4 py-2 text-sm font-semibold text-white">Open AI Assistant →</a></div>
          <div className="mt-4 space-y-3">{plan.map(([day, channel, action]) => <div key={day} className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[80px_150px_1fr]"><strong className="text-[#1A365D]">{day}</strong><strong className="text-slate-900">{channel}</strong><span className="text-sm text-slate-600">{action}</span></div>)}</div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">📋 Today’s checklist</h2><ul className="mt-3 space-y-2 text-sm text-slate-700"><li>☐ Post 2 property/status updates</li><li>☐ Contact 20 old or warm enquiries</li><li>☐ Publish 1 short property video</li><li>☐ Contact 5 referral partners</li><li>☐ Enter every new enquiry in CRM with source</li><li>☐ Call every hot lead first</li></ul></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">🎯 Conversion rule</h2><p className="mt-3 text-sm leading-6 text-slate-600">Lead generation only creates opportunities. The CRM should immediately move each enquiry through qualification → property match → follow-up → site visit → negotiation → closure. Use the AI Assistant for prioritisation and ready-to-send follow-ups.</p><a href="/admin" className="mt-4 inline-block text-sm font-semibold text-[#1A365D]">Go to Leads →</a></div>
        </section>
      </div>
    </div>
  );
}
