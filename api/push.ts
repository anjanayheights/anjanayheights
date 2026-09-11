import webpush from 'web-push';
import { createHmac } from 'node:crypto';
import { get, list, put } from '@vercel/blob';

const BLOB_PATH = 'crm/push-subscriptions.json';
type Subscription = webpush.PushSubscription;

function header(req: any, name: string) { const h = req?.headers; if (h && typeof h.get === 'function') return h.get(name) || ''; return h?.[name.toLowerCase()] || h?.[name] || ''; }
function authorized(req: any) { const password = process.env.DASHBOARD_PASSWORD || ''; return Boolean(password && header(req, 'authorization') === `Bearer ${password}`); }
function send(res: any, status: number, body: unknown) { return res.status(status).setHeader('Cache-Control', 'no-store').json(body); }

async function loadSubscriptions(): Promise<Subscription[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return [];
  const { blobs } = await list({ prefix: BLOB_PATH, token });
  if (!blobs.length) return [];
  const response = await fetch(blobs[0].url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function notifyNewLead(lead: { id: string; name?: string; phone?: string; location?: string; budget?: string }, priority: string) {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:sales@anjanayheights.com';
  if (!publicKey || !privateKey) return { sent: 0, configured: false };
  const subscriptions = await loadSubscriptions();
  if (!subscriptions.length) return { sent: 0, configured: true };
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const body = `${lead.name || 'New lead'} • ${lead.phone || 'Phone not provided'}${lead.location ? `\n${lead.location}` : ''}${lead.budget ? `\nBudget: ${lead.budget}` : ''}\nPriority: ${priority}`;
  let sent = 0;
  const stale = new Set<string>();
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify({ title: '🔔 New Anjanay Heights Lead', body, tag: `lead-${lead.id}`, url: '/admin/sales-engine' }));
      sent += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) stale.add(subscription.endpoint);
      else console.error('lead push error', error);
    }
  }));
  if (stale.size) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) await put(BLOB_PATH, JSON.stringify(subscriptions.filter((s) => !stale.has(s.endpoint))), { access: 'private', token, addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true });
  }
  return { sent, configured: true };
}

export default async function handler(req: any, res: any) {
  if (!authorized(req)) return send(res, 401, { ok: false, error: 'Unauthorized' });

  if (req.method === 'GET') {
    const publicKey = process.env.VAPID_PUBLIC_KEY || '';
    if (!publicKey) return send(res, 503, { ok: false, error: 'Push notifications are not configured yet.' });
    return send(res, 200, { ok: true, publicKey, fingerprint: createHmac('sha256', publicKey).update('anjanay-heights').digest('hex').slice(0, 12) });
  }

  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed' });
  const subscription = req.body as Subscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return send(res, 400, { ok: false, error: 'Invalid subscription' });
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return send(res, 503, { ok: false, error: 'Blob storage is not configured' });
  const current = await loadSubscriptions();
  const next = [...current.filter((item) => item.endpoint !== subscription.endpoint), subscription].slice(-100);
  await put(BLOB_PATH, JSON.stringify(next), { access: 'private', token, addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true });
  return send(res, 200, { ok: true });
}
