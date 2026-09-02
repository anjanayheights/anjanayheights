import { list, put } from '@vercel/blob';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

function dashboardAuthorized(request: Request) {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  const authorization = request.headers.get('authorization') || '';
  return Boolean(expected && authorization === `Bearer ${expected}`);
}

export default async function handler(request: Request) {
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
      const contentType = request.headers.get('content-type') || '';
      const body = contentType.includes('application/json')
        ? await request.json()
        : Object.fromEntries((await request.formData()).entries());

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
