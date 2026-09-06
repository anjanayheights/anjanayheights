import { list, put } from '@vercel/blob';

const PREFIX = 'analytics/visitors/';

function send(response: any, status: number, body: unknown) {
  return response.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

function cookieValue(request: any, name: string) {
  const raw = String(request?.headers?.cookie || '');
  const match = raw.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

async function countVisitors() {
  let total = 0;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor });
    total += page.blobs?.length || 0;
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return total;
}

export default async function handler(request: any, response: any) {
  try {
    if (request.method === 'GET') {
      return send(response, 200, { totalViewers: await countVisitors() });
    }

    if (request.method === 'POST') {
      let visitorId = cookieValue(request, 'ah_visitor');
      let isNew = false;

      if (!visitorId) {
        visitorId = crypto.randomUUID();
        isNew = true;
      }

      const blobName = `${PREFIX}${visitorId}.json`;
      await put(blobName, JSON.stringify({ id: visitorId, firstSeen: new Date().toISOString() }), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: 'application/json',
      }).catch((error: any) => {
        if (!String(error?.message || '').toLowerCase().includes('exist')) throw error;
      });

      if (isNew) {
        response.setHeader('Set-Cookie', `ah_visitor=${encodeURIComponent(visitorId)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
      }

      return send(response, 200, { ok: true, counted: isNew });
    }

    return send(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('visitor analytics error', error);
    return send(response, 500, { error: 'Unable to update visitor analytics.' });
  }
}
