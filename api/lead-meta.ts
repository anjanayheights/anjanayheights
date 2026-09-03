import { head, put } from '@vercel/blob';

type LeadMeta = {
  status: string;
  followUp: string;
  note: string;
  priority: string;
  nextAction: string;
  propertyType: string;
  location: string;
  budget: string;
  timeline: string;
  dealValue?: string;
  customerOffer?: string;
  expectedClosingDate?: string;
  closingProbability?: string;
  negotiationNotes?: string;
  closedDate?: string;
  closedProperty?: string;
  finalRemarks?: string;
};
const STATUSES = new Set(['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed', 'Lost']);
const PRIORITIES = new Set(['Hot', 'Warm', 'Cold']);
const NEXT_ACTIONS = new Set(['Call', 'WhatsApp', 'Site Visit', 'Meeting', 'Send Property Options', 'Follow-up', 'No Action']);
const META_PATH = 'crm/lead-meta.json';

function getHeader(request: any, name: string) {
  const value = request?.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function authorized(request: any) {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  return Boolean(expected && getHeader(request, 'authorization') === `Bearer ${expected}`);
}

function send(response: any, status: number, body: unknown) {
  return response.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

async function readMeta(): Promise<Record<string, LeadMeta>> {
  try {
    const info = await head(META_PATH);
    const result = await fetch(info.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN || ''}` },
      cache: 'no-store',
    });
    if (!result.ok) return {};
    const data = await result.json();
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

export default async function handler(request: any, response: any) {
  if (!authorized(request)) return send(response, 401, { error: 'Unauthorized' });

  try {
    if (request.method === 'GET') return send(response, 200, { meta: await readMeta() });

    if (request.method === 'POST') {
      const body = request.body && typeof request.body === 'object' ? request.body : {};
      const leadId = String(body.leadId || '').trim();
      if (!leadId) return send(response, 400, { error: 'leadId is required' });

      const all = await readMeta();
      const current = all[leadId] || { status: 'New', followUp: '', note: '', priority: 'Warm', nextAction: 'Call', propertyType: '', location: '', budget: '', timeline: '' };
      const incoming = body.meta && typeof body.meta === 'object' ? body.meta : {};
      const status = String(incoming.status ?? current.status);
      const priority = String(incoming.priority ?? current.priority);
      const nextAction = String(incoming.nextAction ?? current.nextAction);
      const normalized: LeadMeta = {
        ...current,
        status: STATUSES.has(status) ? status : 'New',
        followUp: String(incoming.followUp ?? current.followUp ?? '').slice(0, 10),
        note: String(incoming.note ?? current.note ?? '').slice(0, 2000),
        priority: PRIORITIES.has(priority) ? priority : 'Warm',
        nextAction: NEXT_ACTIONS.has(nextAction) ? nextAction : 'Call',
        propertyType: String(incoming.propertyType ?? current.propertyType ?? '').slice(0, 100),
        location: String(incoming.location ?? current.location ?? '').slice(0, 150),
        budget: String(incoming.budget ?? current.budget ?? '').slice(0, 100),
        timeline: String(incoming.timeline ?? current.timeline ?? '').slice(0, 100),
      };

      const optionalFields = ['dealValue', 'customerOffer', 'expectedClosingDate', 'closingProbability', 'negotiationNotes', 'closedDate', 'closedProperty', 'finalRemarks'];
      for (const field of optionalFields) {
        if (incoming[field] !== undefined) normalized[field as keyof LeadMeta] = String(incoming[field] ?? '').slice(0, 2000) as never;
      }

      // If a deal is already Closed and no closing date was supplied, record today's date automatically.
      if (normalized.status === 'Closed' && !normalized.closedDate) {
        normalized.closedDate = new Date().toISOString().slice(0, 10);
      }

      all[leadId] = normalized;
      await writeMeta(all);
      return send(response, 200, { ok: true, leadId, meta: normalized });
    }

    return send(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('lead-meta error', error);
    return send(response, 500, { error: 'Unable to access CRM storage.' });
  }
}
