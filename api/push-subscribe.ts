import { put, list } from '@vercel/blob';

const BLOB_PATH = 'crm/push-subscriptions.json';

type Subscription = { endpoint: string; expirationTime?: number | null; keys?: { p256dh: string; auth: string } };
type RequestLike = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown };
type ResponseLike = { status(code: number): ResponseLike; json(value: unknown): unknown };

function authorized(req: RequestLike) {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  const raw = req.headers.authorization;
  const header = Array.isArray(raw) ? raw[0] || '' : raw || '';
  return Boolean(expected && header === `Bearer ${expected}`);
}

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

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  if (req.method === 'GET') return res.status(200).json({ ok: true, subscriptions: await loadSubscriptions() });
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const subscription = req.body as Subscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return res.status(400).json({ ok: false, error: 'Invalid subscription' });
  const current = await loadSubscriptions();
  const next = [...current.filter((item) => item.endpoint !== subscription.endpoint), subscription].slice(-100);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(503).json({ ok: false, error: 'Blob storage is not configured' });
  await put(BLOB_PATH, JSON.stringify(next), { access: 'private', token, addRandomSuffix: false, contentType: 'application/json' });
  return res.status(200).json({ ok: true });
}
