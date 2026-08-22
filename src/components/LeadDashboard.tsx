import { useState } from 'react';

type Lead = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  form_name: string;
  lead_type: string;
  property_type: string;
  location: string;
  budget: string;
  timeline: string;
  requirement: string;
  message: string;
};

export default function LeadDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  async function loadLeads() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/leads', {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to load leads');
      }

      setLeads(result.leads || []);
      setLoggedIn(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load leads'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    if (!password.trim()) {
      setError('Please enter your dashboard password.');
      return;
    }

    loadLeads();
  }

  const filteredLeads = leads.filter((lead) =>
    [
      lead.name,
      lead.phone,
      lead.email,
      lead.form_name,
      lead.lead_type,
      lead.property_type,
      lead.location,
      lead.budget,
      lead.timeline,
      lead.requirement,
      lead.message,
    ]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
        >
          <h1 className="text-3xl font-bold text-[#1A365D] text-center">
            Anjanay Heights
          </h1>

          <p className="text-gray-500 text-center mt-2">
            Lead Management Dashboard
          </p>

          <label className="block mt-8 mb-2 font-semibold">
            Dashboard Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full border rounded-xl px-4 py-3"
          />

          {error && (
            <p className="text-red-600 text-sm mt-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-[#1A365D] text-white rounded-xl py-3 font-semibold"
          >
            {loading ? 'Loading...' : 'Open Dashboard'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A365D]">
              Anjanay Heights
            </h1>

            <p className="text-gray-500 mt-1">
              Lead Management Dashboard
            </p>
          </div>

          <button
            onClick={loadLeads}
            className="bg-[#1A365D] text-white px-5 py-3 rounded-xl font-semibold"
          >
            Refresh Leads
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">

          <div className="bg-white rounded-2xl p-5 shadow">
            <p className="text-gray-500">Total Leads</p>
            <p className="text-3xl font-bold text-[#1A365D] mt-1">
              {leads.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow">
            <p className="text-gray-500">Callback Requests</p>
            <p className="text-3xl font-bold text-[#1A365D] mt-1">
              {leads.filter((l) => l.form_name === 'callback').length}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow">
            <p className="text-gray-500">Property Leads</p>
            <p className="text-3xl font-bold text-[#1A365D] mt-1">
              {leads.filter((l) => l.form_name === 'property-lead').length}
            </p>
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, location, budget..."
            className="w-full border rounded-xl px-4 py-3"
          />
        </div>

        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">
            No leads found.
          </div>
        ) : (
          <div className="space-y-4">

            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-2xl shadow p-5"
              >

                <div className="flex flex-col md:flex-row md:justify-between gap-4">

                  <div>
                    <h2 className="text-xl font-bold text-[#1A365D]">
                      {lead.name || 'Unknown Lead'}
                    </h2>

                    <p className="text-gray-500 text-sm">
                      {lead.form_name || 'Lead'}
                    </p>
                  </div>

                  <div className="flex gap-2">

                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        Call
                      </a>
                    )}

                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        WhatsApp
                      </a>
                    )}

                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-5">

                  <div>
                    <p className="text-xs text-gray-400">PHONE</p>
                    <p className="font-semibold">
                      {lead.phone || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">EMAIL</p>
                    <p className="font-semibold break-all">
                      {lead.email || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">LEAD TYPE</p>
                    <p className="font-semibold">
                      {lead.lead_type || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">PROPERTY</p>
                    <p className="font-semibold">
                      {lead.property_type || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">LOCATION</p>
                    <p className="font-semibold">
                      {lead.location || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">BUDGET</p>
                    <p className="font-semibold">
                      {lead.budget || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">TIMELINE</p>
                    <p className="font-semibold">
                      {lead.timeline || '-'}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-400">
                      REQUIREMENT / MESSAGE
                    </p>

                    <p className="font-semibold">
                      {lead.requirement || lead.message || '-'}
                    </p>
                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
      }
