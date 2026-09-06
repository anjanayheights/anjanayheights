import { list, put } from '@vercel/blob';

const PREFIX = 'analytics/visitors/';
const blobAuth = {
  oidcToken: process.env.VERCEL_OIDC_TOKEN,
  storeId: process.env.BLOB_STORE_ID,
};

function send(response: any, status: number, body: unknown) {
  return response.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

function cookieValue(request: any, name: string) {
  const raw = String(request?.headers?.cookie || '');
  const match = raw.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

export default async function handler(request: any, response: any) {
  try {
    if (request.method === 'GET') {
      const result = await list({ prefix: PREFIX, ...blobAuth });
      return send(response, 200, { totalViewers: result.blobs.length });
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
        ...blobAuth,
      }).catch((error: any) => {
        // A duplicate visitor blob simply means this visitor was already counted.
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
