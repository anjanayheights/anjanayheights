import { head, list, put } from '@vercel/blob';

const META_PATH = 'crm/lead-meta.json';

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

function parseBody(request: any) {
  const body = request?.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  if (Buffer.isBuffer(body)) return parseEncodedBody(body.toString('utf8'), getHeader(request, 'content-type'));
  if (typeof body === 'string') return parseEncodedBody(body, getHeader(request, 'content-type'));
  return {};
}

function parseEncodedBody(raw: string, contentType: string) {
  if (!raw) return {};
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw).entries());
}

function normalizePhone(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
}

async function phoneAlreadyExists(phone: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  const result = await list({ prefix: 'leads/' });
  for (const blob of result.blobs) {
    try {
      const response = await fetch(blob.url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN || ''}` },
      });
      if (!response.ok) continue;
      const existing = await response.json();
      if (normalizePhone(existing?.phone || '') === normalized) return true;
    } catch {
      // Ignore an unreadable old lead and continue checking the remaining records.
    }
  }
  return false;
}

async function readMeta() {
  try {
    const info = await head(META_PATH);
    const response = await fetch(info.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN || ''}` },
    });
    if (!response.ok) return {};
    const data = await response.json();
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

async function writeMeta(data: Record<string, any>) {
  await put(META_PATH, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

function isUrgentTimeline(timeline: string) {
  const value = String(timeline || '').toLowerCase();
  return ['immediate', 'urgent', 'today', 'asap', 'this week', 'within 7 days', 'within 1 week'].some(term => value.includes(term));
}

function whatsappMessage(lead: any) {
  const details = [
    lead.property_type && `Property: ${lead.property_type}`,
    lead.location && `Location: ${lead.location}`,
    lead.budget && `Budget: ${lead.budget}`,
  ].filter(Boolean).join('\n');
  return `Hi ${lead.name || 'there'}, thank you for your enquiry with Anjanay Heights.\n\n${details ? `${details}\n\n` : ''}I would be happy to help you with suitable property options. Please let me know a convenient time to speak.\n\nRegards,\nAnjanay Heights`;
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
      const body = parseBody(request);

      if (String(body['bot-field'] || '').trim()) return send(response, 200, { ok: true });

      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      if (!name || !phone) return send(response, 400, { error: 'Name and phone are required.' });

      if (await phoneAlreadyExists(phone)) {
        return send(response, 200, { ok: true, duplicate: true, message: 'Your request is already with our team.' });
      }

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

      // Automatically create a same-day follow-up for every new lead.
      // Urgent timelines are marked Hot; other new leads are Warm.
      try {
        const allMeta = await readMeta();
        if (!allMeta[lead.id]) {
          const today = new Date().toISOString().slice(0, 10);
          allMeta[lead.id] = {
            status: 'New',
            followUp: today,
            note: 'New lead: call promptly and send suitable property options on WhatsApp.',
            priority: isUrgentTimeline(lead.timeline) ? 'Hot' : 'Warm',
            nextAction: 'Call',
          };
          await writeMeta(allMeta);
        }
      } catch (metaError) {
        // Lead creation must still succeed if follow-up metadata storage is temporarily unavailable.
        console.error('automatic lead follow-up setup error', metaError);
      }

      return send(response, 200, {
        ok: true,
        lead,
        followUp: 'today',
        priority: isUrgentTimeline(lead.timeline) ? 'Hot' : 'Warm',
        nextAction: 'Call',
        whatsappMessage: whatsappMessage(lead),
      });
    } catch (error) {
      console.error('leads POST error', error);
      return send(response, 500, { error: 'Unable to save your request.' });
    }
  }

  return send(response, 405, { error: 'Method not allowed' });
}
