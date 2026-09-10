import { createHmac } from 'node:crypto';

function header(req: any, name: string) { const h = req?.headers; return h?.[name.toLowerCase()] || h?.[name] || ''; }
function authorized(req: any) {
  const password = process.env.DASHBOARD_PASSWORD || '';
  return Boolean(password && header(req, 'authorization') === `Bearer ${password}`);
}

export default function handler(req: any, res: any) {
  if (req.method !== 'GET' || !authorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const key = process.env.VAPID_PUBLIC_KEY || '';
  if (!key) return res.status(503).json({ ok: false, error: 'Push notifications are not configured yet.' });
  return res.status(200).setHeader('Cache-Control', 'no-store').json({ ok: true, publicKey: key, fingerprint: createHmac('sha256', key).update('anjanay-heights').digest('hex').slice(0, 12) });
}
