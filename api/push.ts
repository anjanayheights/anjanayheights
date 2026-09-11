import webpush from 'web-push';
import { createHmac } from 'node:crypto';
import { get, list, put } from '@vercel/blob';

const BLOB_PATH = 'crm/push-subscriptions.json';
type Subscription = webpush.PushSubscription;

const blobAuthCandidates = [
  ...(process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID
    ? [{ oidcToken: process.env.VERCEL_OIDC_TOKEN, storeId: process.env.BLOB_STORE_ID }] : []),
  ...(process.env.BLOB_READ_WRITE_TOKEN ? [{ token: process.env.BLOB_READ_WRITE_TOKEN }] : []),
];

function header(req: any, name: string) { const h = req?.headers; if (h && typeof h.get === 'function') return h.get(name) || ''; return h?.[name.toLowerCase()] || h?.[name] || ''; }
function authorized(req: any) { const password = process.env.DASHBOARD_PASSWORD || ''; return Boolean(password && header(req, 'authorization') === `Bearer ${password}`); }
function send(res: any, status: number, body: unknown) { return res.status(status).setHeader('Cache-Control', 'no-store').json(body); }
function isBlobAuthError(error: unknown) { const value = error as any; return /BlobAccessError|access denied|valid token|credentials|unauthorized|forbidden/i.test(`${String(value?.name ?? value?.constructor?.name ?? '')} ${String(value?.message ?? '')}`); }
async function withBlobAuth<T>(operation: (auth: Record<string, string>) => Promise<T>) { let lastError: unknown = new Error('No Vercel Blob credentials configured.'); const attempts = [{}, ...blobAuthCandidates] as Record<string, string>[]; for (const auth of attempts) { try { return await operation(auth); } catch (error) { lastError = error; if (!isBlobAuthError(error)) throw error; } } throw lastError; }
async function read(url: string) { const r = await withBlobAuth((auth) => get(url, { access: 'private', ...auth })); return r?.statusCode === 200 && r.stream ? await new Response(r.stream).json() : null; }

async function loadSubscriptions(): Promise<Subscription[]> {
  const result = await withBlobAuth((auth) => list({ prefix: BLOB_PATH, ...auth }));
  if (!result.blobs.length) return [];
  const data = await read(result.blobs[0].url);
  return Array.isArray(data) ? data : [];
}

async function sendToSubscriptions(subscriptions: Subscription[], payload: Record<string, unknown>) {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:sales@anjanayheights.com';
  if (!publicKey || !privateKey) return { sent: 0, configured: false };
  webpush.setVapidDetails(subject, publicKey, privateKey);
  let sent = 0;
  const stale = new Set<string>();
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      sent += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) stale.add(subscription.endpoint);
      else console.error('lead push error', error);
    }
  }));
  if (stale.size) {
    try { await withBlobAuth((auth) => put(BLOB_PATH, JSON.stringify(subscriptions.filter((s) => !stale.has(s.endpoint))), { access: 'private', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true, ...auth })); } catch (error) { console.error('push stale-subscription cleanup error', error); }
  }
  return { sent, configured: true };
}

export async function notifyNewLead(lead: { id: string; name?: string; phone?: string; location?: string; budget?: string }, priority: string) {
  let subscriptions: Subscription[] = [];
  try { subscriptions = await loadSubscriptions(); } catch (error) { console.error('push subscription load error', error); return { sent: 0, configured: true }; }
  if (!subscriptions.length) return { sent: 0, configured: true };
  const body = `${lead.name || 'New lead'} • ${lead.phone || 'Phone not provided'}${lead.location ? `\n${lead.location}` : ''}${lead.budget ? `\nBudget: ${lead.budget}` : ''}\nPriority: ${priority}`;
  return sendToSubscriptions(subscriptions, { title: '🔔 New Anjanay Heights Lead', body, tag: `lead-${lead.id}`, url: '/admin/sales-engine' });
}

export default async function handler(req: any, res: any) {
  if (!authorized(req)) return send(res, 401, { ok: false, error: 'Unauthorized' });

  if (req.method === 'GET') {
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    if (!publicKey) return send(res, 503, { ok: false, error: 'Push notifications are not configured yet.' });
    return send(res, 200, { ok: true, publicKey, fingerprint: createHmac('sha256', publicKey).update('anjanay-heights').digest('hex').slice(0, 12) });
  }

  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  if (body.action === 'test') {
    try {
      const subscriptions = await loadSubscriptions();
      if (!subscriptions.length) return send(res, 404, { ok: false, error: 'No push subscription is saved for this browser yet.' });
      const result = await sendToSubscriptions(subscriptions, {
        title: '🔔 Anjanay Heights Test Alert',
        body: 'Lead alerts are working. A new lead notification will appear here immediately.',
        tag: `lead-test-${Date.now()}`,
        url: '/admin/sales-engine',
      });
      if (!result.sent) return send(res, 500, { ok: false, error: 'Push test could not be delivered. Browser subscription may have expired.' });
      return send(res, 200, { ok: true, sent: result.sent });
    } catch (error) {
      console.error('push test error', error);
      return send(res, 500, { ok: false, error: 'Push test failed.' });
    }
  }

  const subscription = body as Subscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return send(res, 400, { ok: false, error: 'Invalid subscription' });
  try {
    const current = await loadSubscriptions();
    const next = [...current.filter((item) => item.endpoint !== subscription.endpoint), subscription].slice(-100);
    await withBlobAuth((auth) => put(BLOB_PATH, JSON.stringify(next), { access: 'private', addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true, ...auth }));
    return send(res, 200, { ok: true });
  } catch (error) {
    console.error('push subscription save error', error);
    return send(res, 500, { ok: false, error: 'Could not save push subscription.' });
  }
}
