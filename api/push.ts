import webpush from 'web-push';
import { get, list } from '@vercel/blob';

const BLOB_PATH = 'crm/push-subscriptions.json';
type Subscription = webpush.PushSubscription;

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
    if (token) {
      const next = subscriptions.filter((s) => !stale.has(s.endpoint));
      const { put } = await import('@vercel/blob');
      await put(BLOB_PATH, JSON.stringify(next), { access: 'private', token, addRandomSuffix: false, contentType: 'application/json', allowOverwrite: true });
    }
  }
  return { sent, configured: true };
}
