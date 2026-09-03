import React from 'react';

const tools = [
  { href: '/admin', icon: '📊', title: 'Lead Dashboard', text: 'View new leads, status, priority, notes, follow-ups and conversion.' },
  { href: '/admin/properties', icon: '🏠', title: 'Property Inventory', text: 'Add, edit and manage properties available for matching.' },
  { href: '/admin/matches', icon: '🎯', title: 'Lead Matching', text: 'Find the best available properties for every lead.' },
  { href: '/admin/followups', icon: '📅', title: 'Follow-ups', text: 'Work through today’s follow-ups and overdue leads.' },
];

export default function AdminTools() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Anjanay Heights CRM</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">CRM Tools</h1>
            <p className="mt-1 text-sm text-slate-600">Everything you need to manage leads, properties and follow-ups.</p>
          </div>
          <a href="/admin" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Dashboard</a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map(tool => (
            <a key={tool.href} href={tool.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-2xl">{tool.icon}</div>
              <h2 className="mt-3 text-lg font-bold text-slate-900">{tool.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{tool.text}</p>
              <div className="mt-4 text-sm font-semibold text-[#1A365D]">Open →</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
