import { head, put } from '@vercel/blob';

type LeadMeta = { status: string; followUp: string; note: string };

const STATUSES = new Set(['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost']);
const META_PATH = 'crm/lead-meta.json';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

function authorized(request: Request) {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  return Boolean(expected && request.headers.get('authorization') === `Bearer ${expected}`);
}

async function readMeta(): Promise<Record<string, LeadMeta>> {
  try {
    const info = await head(META_PATH);
    const response = await fetch(info.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN || ''}` },
    });
    if (!response.ok) return {};
    const data = await response.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

async function writeMeta(data: Record<string, LeadMeta>) {
  await put(META_PATH, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

export default async function handler(request: Request) {
  if (!authorized(request)) return json(401, { error: 'Unauthorized' });

  try {
    if (request.method === 'GET') return json(200, { meta: await readMeta() });

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const leadId = String(body.leadId || '').trim();
      if (!leadId) return json(400, { error: 'leadId is required' });

      const all = await readMeta();
      const current = all[leadId] || { status: 'New', followUp: '', note: '' };
      const incoming = body.meta || {};
      const status = String(incoming.status ?? current.status);
      const normalized: LeadMeta = {
        status: STATUSES.has(status) ? status : 'New',
        followUp: String(incoming.followUp ?? current.followUp ?? '').slice(0, 10),
        note: String(incoming.note ?? current.note ?? '').slice(0, 2000),
      };

      all[leadId] = normalized;
      await writeMeta(all);
      return json(200, { ok: true, leadId, meta: normalized });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('lead-meta error', error);
    return json(500, { error: 'Unable to access CRM storage.' });
  }
}
