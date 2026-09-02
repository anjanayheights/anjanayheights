import { getStore } from '@netlify/blobs';

type LeadMeta = {
  status: string;
  followUp: string;
  note: string;
};

type HandlerEvent = {
  httpMethod?: string;
  headers: Record<string, string | undefined>;
  body?: string | null;
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

function json(statusCode: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  };
}

function authOk(event: HandlerEvent) {
  const expected = process.env.DASHBOARD_PASSWORD;
  const authorization = event.headers?.authorization || event.headers?.Authorization || '';
  const password = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return Boolean(expected && password === expected);
}

export const handler = async (event: HandlerEvent) => {
  if (!authOk(event)) return json(401, { error: 'Unauthorized' });

  const store = getStore(STORE_NAME);

  try {
    if (event.httpMethod === 'GET') {
      const data = (await store.get(ALL_KEY, {
        type: 'json',
        consistency: 'strong',
      })) as Record<string, LeadMeta> | null;
      return json(200, { meta: data || {} });
    }

    if (event.httpMethod === 'POST') {
      let body: { leadId?: string; meta?: Partial<LeadMeta> };
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { error: 'Invalid JSON' });
      }

      const leadId = String(body.leadId || '').trim();
      const incoming = body.meta || {};

      if (!leadId) return json(400, { error: 'leadId is required' });

      const existing = (await store.get(ALL_KEY, {
        type: 'json',
        consistency: 'strong',
      })) as Record<string, LeadMeta> | null;
      const current = existing?.[leadId] || { status: 'New', followUp: '', note: '' };

      const candidateStatus = String(incoming.status || current.status);
      const normalized: LeadMeta = {
        status: STATUSES.has(candidateStatus) ? candidateStatus : 'New',
        followUp: String(incoming.followUp ?? current.followUp ?? '').slice(0, 10),
        note: String(incoming.note ?? current.note ?? '').slice(0, 2000),
      };

      await store.setJSON(ALL_KEY, { ...(existing || {}), [leadId]: normalized });
      return json(200, { ok: true, leadId, meta: normalized });
    }

    return json(405, { error: 'Method not allowed' }, { Allow: 'GET, POST' });
  } catch (error) {
    console.error('lead-meta error', error);
    return json(500, { error: 'Unable to access CRM storage' });
  }
};
