import { get, list } from '@vercel/blob';

const blobAuth = process.env.BLOB_READ_WRITE_TOKEN
  ? { token: process.env.BLOB_READ_WRITE_TOKEN }
  : { oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID };

function getHeader(request: any, name: string) {
  const headers = request?.headers;
  if (headers && typeof headers.get === 'function') return headers.get(name) || '';
  const value = headers?.[name.toLowerCase()] ?? headers?.[name];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function send(response: any, status: number, body: unknown) {
  return response.status(status)
    .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    .json(body);
}

function authorized(request: any) {
  const secret = process.env.CRON_SECRET || '';
  if (!secret) return true;
  return getHeader(request, 'authorization') === `Bearer ${secret}`;
}

async function readBlobJson(url: string) {
  const result = await get(url, { access: 'private', useCache: false, ...blobAuth });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return await new Response(result.stream).json();
}

async function loadLeads() {
  const result = await list({ prefix: 'leads/', ...blobAuth });
  const values = await Promise.all(result.blobs.map(async (blob) => {
    try { return await readBlobJson(blob.url); } catch { return null; }
  }));
  return values.filter(Boolean);
}

async function loadMeta() {
  const result = await list({ prefix: 'crm/lead-meta.json', ...blobAuth });
  const blob = result.blobs[0];
  if (!blob) return {};
  try { return (await readBlobJson(blob.url)) || {}; } catch { return {}; }
}

function isDueToday(value: unknown, today: string) {
  const followUp = String(value || '').slice(0, 10);
  return Boolean(followUp && followUp <= today);
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') return send(response, 405, { error: 'Method not allowed' });
  if (!authorized(request)) return send(response, 401, { error: 'Unauthorized' });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const [leads, meta] = await Promise.all([loadLeads(), loadMeta()]);
    const due = leads
      .map((lead: any) => ({ lead, meta: meta?.[lead.id] || {} }))
      .filter(({ lead, meta: itemMeta }: any) => itemMeta.status !== 'Closed' && itemMeta.status !== 'Lost' && isDueToday(itemMeta.followUp, today));

    const secretConfigured = Boolean(process.env.CRON_SECRET);
    return send(response, 200, {
      ok: true,
      scheduler: 'daily-follow-up',
      date: today,
      dueCount: due.length,
      totalLeads: leads.length,
      generatedAt: new Date().toISOString(),
      ...(secretConfigured ? {
        due: due.map(({ lead, meta: itemMeta }: any) => ({
          id: lead.id,
          name: lead.name || '',
          phone: lead.phone || '',
          source: lead.source || '',
          priority: itemMeta.priority || 'Warm',
          nextAction: itemMeta.nextAction || 'Call',
          followUp: itemMeta.followUp || '',
          note: itemMeta.note || '',
        }))
      } : {})
    });
  } catch (error) {
    console.error('follow-up-cron error', error);
    return send(response, 500, { error: 'Unable to generate the daily follow-up queue.' });
  }
}
