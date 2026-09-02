import { getStore } from '@netlify/blobs';
import type { Handler } from '@netlify/functions';

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

const STORE_NAME = 'anjanay-lead-meta';
const ALL_KEY = 'all';

function unauthorized() {
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Unauthorized' }),
  };
}

function authOk(event: Parameters<Handler>[0]) {
  const expected = process.env.DASHBOARD_PASSWORD;
  const authorization = event.headers.authorization || event.headers.Authorization || '';
  const password = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return Boolean(expected && password === expected);
}

export const handler: Handler = async (event) => {
  if (!authOk(event)) return unauthorized();

  const store = getStore(STORE_NAME);

  try {
    if (event.httpMethod === 'GET') {
      const data = (await store.get(ALL_KEY, { type: 'json', consistency: 'strong' })) as Record<string, LeadMeta> | null;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: data || {} }),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}') as { leadId?: string; meta?: Partial<LeadMeta> };
      const leadId = String(body.leadId || '').trim();
      const incoming = body.meta || {};

      if (!leadId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'leadId is required' }),
        };
      }

      const existing = (await store.get(ALL_KEY, { type: 'json', consistency: 'strong' })) as Record<string, LeadMeta> | null;
      const current = existing?.[leadId] || { status: 'New', followUp: '', note: '' };
      const normalized: LeadMeta = {
        status: STATUSES.has(String(incoming.status || current.status)) ? String(incoming.status || current.status) : 'New',
        followUp: String(incoming.followUp ?? current.followUp ?? '').slice(0, 10),
        note: String(incoming.note ?? current.note ?? '').slice(0, 2000),
      };

      const next = { ...(existing || {}), [leadId]: normalized };
      await store.setJSON(ALL_KEY, next);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, leadId, meta: normalized }),
      };
    }

    return {
      statusCode: 405,
      headers: { Allow: 'GET, POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('lead-meta error', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unable to access CRM storage' }),
    };
  }
};
