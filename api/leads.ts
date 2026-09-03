import { list, put } from '@vercel/blob';

function getHeader(request: any, name: string) {
  const value = request?.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function dashboardAuthorized(request: any) {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  const authorization = getHeader(request, 'authorization');
  return Boolean(expected && authorization === `Bearer ${expected}`);
}

function send(response: any, status: number, body: unknown) {
  return response.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

export default async function handler(request: any, response: any) {
  if (request.method === 'GET') {
    if (!dashboardAuthorized(request)) return send(response, 401, { error: 'Unauthorized' });

    try {
      const result = await list({ prefix: 'leads/' });
      const leads = await Promise.all(
        result.blobs.map(async (blob) => {
          const result = await fetch(blob.url, {
            headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN || ''}` },
          });
          if (!result.ok) return null;
          return result.json();
        })
      );
      return send(response, 200, { leads: leads.filter(Boolean) });
    } catch (error) {
      console.error('leads GET error', error);
      return send(response, 500, { error: 'Unable to load leads.' });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = request.body && typeof request.body === 'object' ? request.body : {};

      if (String(body['bot-field'] || '').trim()) return send(response, 200, { ok: true });

      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      if (!name || !phone) return send(response, 400, { error: 'Name and phone are required.' });

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

      return send(response, 200, { ok: true, lead });
    } catch (error) {
      console.error('leads POST error', error);
      return send(response, 500, { error: 'Unable to save your request.' });
    }
  }

  return send(response, 405, { error: 'Method not allowed' });
}
