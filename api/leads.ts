import { get, list, put } from '@vercel/blob';
import { createHash } from 'node:crypto';

// Production Blob token is currently being rejected. Prefer Vercel deployment OIDC.
const blobAuth = process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID
  ? { oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }
  : { token: process.env.BLOB_READ_WRITE_TOKEN };

function send(res: any, status: number, body: unknown) {
  return res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}
function header(req: any, name: string) {
  const h = req?.headers;
  if (h && typeof h.get === 'function') return h.get(name) || '';
  return h?.[name.toLowerCase()] || h?.[name] || '';
}
function authorized(req: any) {
  const password = process.env.DASHBOARD_PASSWORD || '';
  return Boolean(password && header(req, 'authorization') === `Bearer ${password}`);
}
function body(req: any) {
  if (req?.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = Buffer.isBuffer(req?.body) ? req.body.toString() : String(req?.body || '');
  if (!raw) return {};
  if (String(header(req, 'content-type')).includes('application/json')) {
    try { return JSON.parse(raw) || {}; } catch { return {}; }
  }
  return Object.fromEntries(new URLSearchParams(raw).entries());
}
function phone(v: string) {
  const d = String(v || '').replace(/\D/g, '');
  return d.length === 10 ? `91${d}` : d;
}
function key(v: string) {
  return `leads/phone-${createHash('sha256').update(phone(v)).digest('hex')}.json`;
}
function priority(t: string) {
  return /immediate|urgent|today|asap|this week|within 7 days|within 1 week/i.test(String(t || '')) ? 'Hot' : 'Warm';
}
async function read(url: string) {
  const r = await get(url, { access: 'private', ...blobAuth });
  return r?.statusCode === 200 && r.stream ? await new Response(r.stream).json() : null;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    if (!authorized(req)) return send(res, 401, { error: 'Unauthorized' });
    try {
      const r = await list({ prefix: 'leads/', ...blobAuth });
      const leads = (await Promise.all(r.blobs.map(async b => { try { return await read(b.url); } catch { return null; } }))).filter(Boolean);
      return send(res, 200, { leads });
    } catch (e) {
      console.error('leads GET error', e);
      return send(res, 500, { error: 'Unable to load leads.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const b = body(req);
      if (String(b['bot-field'] || '').trim()) return send(res, 200, { ok: true });
      const name = String(b.name || '').trim();
      const rawPhone = String(b.phone || '').trim();
      if (!name || !rawPhone) return send(res, 400, { error: 'Name and phone are required.' });
      const p = phone(rawPhone);
      const q = req?.query || {};
      const lead = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        name,
        phone: rawPhone,
        email: String(b.email || '').trim(),
        form_name: String(b['form-name'] || 'property-lead'),
        lead_type: String(b.lead_type || ''),
        source: String(b.source || b.lead_source || 'Website'),
        utm_source: String(b.utm_source || q.utm_source || '').trim(),
        utm_medium: String(b.utm_medium || q.utm_medium || '').trim(),
        utm_campaign: String(b.utm_campaign || q.utm_campaign || '').trim(),
        property_type: String(b.property_type || '').trim(),
        location: String(b.location || '').trim(),
        budget: String(b.budget || '').trim(),
        timeline: String(b.timeline || '').trim(),
        requirement: String(b.requirement || '').trim(),
        message: String(b.message || '').trim(),
      };
      await put(p ? key(rawPhone) : `leads/${lead.id}.json`, JSON.stringify(lead), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: false, ...blobAuth,
      });
      return send(res, 200, { ok: true, lead, followUp: 'today', priority: priority(lead.timeline), nextAction: 'Call' });
    } catch (e) {
      console.error('leads POST error', e);
      return send(res, 500, { error: 'Unable to save your request.' });
    }
  }
  return send(res, 405, { error: 'Method not allowed' });
}
