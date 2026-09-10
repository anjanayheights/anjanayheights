import { get, head, list, put } from '@vercel/blob';
import { createHash, createHmac } from 'node:crypto';

const blobAuthCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID
    ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
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
function scoreLead(lead: any) {
  let score = 0;
  const text = [lead.property_type, lead.location, lead.budget, lead.timeline, lead.requirement, lead.message].join(' ').toLowerCase();
  if (lead.phone) score += 10;
  if (lead.email) score += 5;
  if (/site visit|visit|immediate|urgent|today|asap|this week|within 7 days|within 1 week/.test(text)) score += 25;
  if (/ready|cash|loan approved|approval/.test(text)) score += 20;
  if (lead.budget) score += 15;
  if (lead.location) score += 10;
  if (lead.property_type) score += 10;
  return Math.min(100, score);
}
function priority(score: number) {
  return score >= 75 ? 'Very Hot' : score >= 55 ? 'Hot' : score >= 30 ? 'Warm' : 'Cold';
}
function istDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const y = Number(parts.find(p => p.type === 'year')?.value);
  const m = Number(parts.find(p => p.type === 'month')?.value) - 1;
  const d = Number(parts.find(p => p.type === 'day')?.value);
  const date = new Date(Date.UTC(y, m, d + offsetDays));
  return date.toISOString().slice(0, 10);
}
function initialFollowUp(lead: any, score: number) {
  const urgent = /site visit|visit|immediate|urgent|today|asap|this week|within 7 days|within 1 week/i.test([lead.timeline, lead.requirement, lead.message].join(' '));
  const days = urgent || score >= 75 ? 0 : 1;
  return `${istDate(days)}T${days === 0 ? '16:00' : '10:00'}`;
}
function isBlobAuthError(error: unknown) {
  const value = error as any;
  const name = String(value?.name ?? value?.constructor?.name ?? '');
  const message = String(value?.message ?? '');
  return /BlobAccessError|access denied|valid token|credentials|unauthorized|forbidden/i.test(`${name} ${message}`);
}
async function withBlobAuth<T>(operation: (auth: Record<string, string>) => Promise<T>) {
  let lastError: unknown = new Error('No Vercel Blob credentials configured.');
  const attempts = [{}, ...blobAuthCandidates] as Record<string, string>[];
  for (const auth of attempts) {
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
async function initializeMeta(lead: any, score: number) {
  const path = 'crm/lead-meta.json';
  try {
    const info: any = await withBlobAuth((auth) => head(path, auth));
    if (!info?.url) return;
    const current = await read(info.url);
    if (!current || typeof current !== 'object') return;
    if (current[lead.id]) return;
    const now = new Date().toISOString();
    current[lead.id] = {
      status: 'New', priority: priority(score), nextAction: 'Call', followUp: initialFollowUp(lead, score),
      note: 'Automatically initialized from new lead intake.',
      propertyType: lead.property_type || '', location: lead.location || '', budget: lead.budget || '', timeline: lead.timeline || '',
      callHistory: [], history: [{ id: `auto-${lead.id}`, at: now, action: 'Lead Automation', note: `New lead scored ${score}/100 · ${priority(score)} · Call · follow-up ${initialFollowUp(lead, score)}.` }],
    };
    await withBlobAuth((auth) => put(path, JSON.stringify(current), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', ...auth }));
  } catch (error) {
    // Lead creation must remain successful even if CRM metadata initialization is temporarily unavailable.
    console.error('lead automation initialization error', error);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    if (!authorized(req)) return send(res, 401, { error: 'Unauthorized' });
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
        id: crypto.randomUUID(), created_at: new Date().toISOString(), name, phone: rawPhone,
        email: String(b.email || '').trim(), form_name: String(b['form-name'] || 'property-lead'),
        lead_type: String(b.lead_type || ''), source: String(b.source || b.lead_source || 'Website'),
        utm_source: String(b.utm_source || q.utm_source || '').trim(), utm_medium: String(b.utm_medium || q.utm_medium || '').trim(),
        utm_campaign: String(b.utm_campaign || q.utm_campaign || '').trim(), property_type: String(b.property_type || '').trim(),
        location: String(b.location || '').trim(), budget: String(b.budget || '').trim(), timeline: String(b.timeline || '').trim(),
        requirement: String(b.requirement || '').trim(), message: String(b.message || '').trim(),
      };
      await withBlobAuth((auth) => put(p ? key(rawPhone) : `leads/${lead.id}.json`, JSON.stringify(lead), {
        access: 'private', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: false, ...auth,
      }));
      const score = scoreLead(lead);
      const leadPriority = priority(score);
      const followUp = initialFollowUp(lead, score);
      await initializeMeta(lead, score);
      return send(res, 200, { ok: true, lead, followUp, priority: leadPriority, score, nextAction: 'Call' });
    } catch (e) {
      console.error('leads POST error', e);
      return send(res, 500, { error: 'Unable to save your request.' });
    }
  }
  return send(res, 405, { error: 'Method not allowed' });
}
