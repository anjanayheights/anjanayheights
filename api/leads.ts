import { get, list, put } from '@vercel/blob';
import { createHash, createHmac } from 'node:crypto';

const blobAuthCandidates = [
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID
    ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }]
    : []),
];

function send(res: any, status: number, body: unknown) {
  return res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}
function header(req: any, name: string) {
  const h = req?.headers;
  if (h && typeof h.get === 'function') return h.get(name) || '';
  return h?.[name.toLowerCase()] || h?.[name] || '';
}
function sessionToken() {
  const password = process.env.DASHBOARD_PASSWORD || '';
  return password ? createHmac('sha256', password).update('anjanay-heights-crm-session').digest('hex') : '';
}
function cookie(req: any, name: string) {
  const raw = String(header(req, 'cookie') || '');
  const match = raw.split(';').map((v: string) => v.trim()).find((v: string) => v.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}
function setSessionCookie(res: any) {
  const token = sessionToken();
  if (!token) return;
  res.setHeader('Set-Cookie', `ah_crm_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
}
function authorized(req: any) {
  const password = process.env.DASHBOARD_PASSWORD || '';
  const authorization = header(req, 'authorization');
  const bearerOk = Boolean(password && authorization === `Bearer ${password}`);
  const cookieOk = Boolean(sessionToken() && cookie(req, 'ah_crm_session') === sessionToken());
  return bearerOk || cookieOk;
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
function isBlobAuthError(error: unknown) {
  const value = error as any;
  const name = String(value?.name ?? value?.constructor?.name ?? '');
  const message = String(value?.message ?? '');
  return /BlobAccessError|access denied|valid token|credentials|unauthorized|forbidden/i.test(`${name} ${message}`);
}
async function withBlobAuth<T>(operation: (auth: Record<string, string>) => Promise<T>) {
  let lastError: unknown = new Error('No Vercel Blob credentials configured.');
  for (const auth of blobAuthCandidates) {
    try { return await operation(auth); }
    catch (error) {
      lastError = error;
      if (!isBlobAuthError(error)) throw error;
    }
  }
  throw lastError;
}
async function read(url: string) {
  const r = await withBlobAuth((auth) => get(url, { access: 'private', ...auth }));
  return r?.statusCode === 200 && r.stream ? await new Response(r.stream).json() : null;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    if (!authorized(req)) return send(res, 401, { error: 'Unauthorized' });

    // Login/session validation must not depend on Blob availability.
    // A short-lived HttpOnly session cookie also lets child CRM modules reuse
    // the single login without maintaining their own password state.
    if (req?.query?._login === '1' || req?.query?._session === '1') {
      setSessionCookie(res);
      return send(res, 200, { ok: true });
    }

    try {
      const r = await withBlobAuth((auth) => list({ prefix: 'leads/', ...auth }));
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
      await withBlobAuth((auth) => put(p ? key(rawPhone) : `leads/${lead.id}.json`, JSON.stringify(lead), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: false, ...auth,
      }));
      return send(res, 200, { ok: true, lead, followUp: 'today', priority: priority(lead.timeline), nextAction: 'Call' });
    } catch (e) {
      console.error('leads POST error', e);
      return send(res, 500, { error: 'Unable to save your request.' });
    }
  }
  return send(res, 405, { error: 'Method not allowed' });
}
