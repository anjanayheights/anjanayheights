import React from 'react';

export default function AdminTools() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Anjanay Heights CRM</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">CRM Tools</h1>
          </div>
          <a href="/admin" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Dashboard</a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/admin/properties" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-2xl">🏠</div>
            <h2 className="mt-3 text-lg font-bold text-slate-900">Property Inventory</h2>
            <p className="mt-1 text-sm text-slate-600">Add, edit and manage available properties for matching.</p>
          </a>
          <a href="/admin/matches" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-2xl">🎯</div>
            <h2 className="mt-3 text-lg font-bold text-slate-900">Lead Matching</h2>
            <p className="mt-1 text-sm text-slate-600">See the best available property matches for each lead.</p>
          </a>
          <a href="/admin/followups" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-2xl">📅</div>
            <h2 className="mt-3 text-lg font-bold text-slate-900">Follow-ups</h2>
            <p className="mt-1 text-sm text-slate-600">Dedicated view for today’s follow-ups and overdue leads.</p>
          </a>
        </div>
      </div>
    </div>
  );
}
