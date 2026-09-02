import type { Handler } from '@netlify/functions';

// This endpoint is intentionally storage-provider agnostic. It validates and
// normalizes CRM metadata now; persistent storage can be enabled later by
// wiring a database/blob provider without changing the dashboard API.

type LeadMeta = {
  status: string;
  followUp: string;
  note: string;
};

const STATUSES = new Set([
  'New',
  'Contacted',
  'Interested',
  'Site Visit',
  'Negotiation',
  'Closed',
  'Lost',
]);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const expected = process.env.DASHBOARD_PASSWORD;
  const authorization = event.headers.authorization || event.headers.Authorization || '';
  const password = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!expected || password !== expected) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as { leadId?: string; meta?: Partial<LeadMeta> };
    const leadId = String(body.leadId || '').trim();
    const meta = body.meta || {};

    if (!leadId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'leadId is required' }),
      };
    }

    const normalized: LeadMeta = {
      status: STATUSES.has(String(meta.status || '')) ? String(meta.status) : 'New',
      followUp: String(meta.followUp || '').slice(0, 10),
      note: String(meta.note || '').slice(0, 2000),
    };

    // Persistence is deliberately not faked here. The dashboard can use this
    // endpoint once a Netlify Blobs/database provider is configured.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, leadId, meta: normalized }),
    };
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }
};
