import { list, put } from '@vercel/blob';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

function getHeader(request: any, name: string) {
  const headers = request?.headers;
  if (headers && typeof headers.get === 'function') return headers.get(name) || '';
  if (headers && typeof headers === 'object') return headers[name.toLowerCase()] || headers[name] || '';
  return '';
}

function dashboardAuthorized(request: any) {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  const authorization = getHeader(request, 'authorization');
  return Boolean(expected && authorization === `Bearer ${expected}`);
}

async function readRequestBody(request: any) {
  if (request?.body && typeof request.body === 'object') return request.body;
  if (typeof request?.json === 'function') return request.json();
  return {};
}

export default async function handler(request: any) {
  if (request.method === 'GET') {
    if (!dashboardAuthorized(request)) return json(401, { error: 'Unauthorized' });

    try {
      const result = await list({ prefix: 'leads/' });
      const leads = await Promise.all(
        result.blobs.map(async (blob) => {
          const response = await fetch(blob.url, {
            headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN || ''}` },
          });
          if (!response.ok) return null;
          return response.json();
        })
      );
      return json(200, { leads: leads.filter(Boolean) });
    } catch (error) {
      console.error('leads GET error', error);
      return json(500, { error: 'Unable to load leads.' });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await readRequestBody(request);

      if (String(body['bot-field'] || '').trim()) return json(200, { ok: true });

      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      if (!name || !phone) return json(400, { error: 'Name and phone are required.' });

      const lead = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        name,
        phone,
        email: String(body.email || '').trim(),
        form_name: String(body['form-name'] || 'property-lead'),
        lead_type: String(body.lead_type || ''),
        property_type: String(body.property_type || ''),
        location: String(body.location || ''),
        budget: String(body.budget || ''),
        timeline: String(body.timeline || ''),
        requirement: String(body.requirement || ''),
        message: String(body.message || ''),
      };

      await put(`leads/${lead.id}.json`, JSON.stringify(lead), {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json',
        allowOverwrite: false,
      });

      return json(200, { ok: true, lead });
    } catch (error) {
      console.error('leads POST error', error);
      return json(500, { error: 'Unable to save your request.' });
    }
  }

  return json(405, { error: 'Method not allowed' });
}
