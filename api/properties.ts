import { get, put } from '@vercel/blob';

type Property = {
  id: string;
  title: string;
  propertyType: string;
  location: string;
  price: string;
  minBudget: number | null;
  maxBudget: number | null;
  area: string;
  bedrooms: string;
  status: 'Available' | 'Hold' | 'Sold' | 'Inactive';
  description: string;
  createdAt: string;
};

const PATH = 'crm/properties.json';
const STATUSES = new Set(['Available', 'Hold', 'Sold', 'Inactive']);

function getHeader(request: any, name: string) {
  const value = request?.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function authorized(request: any) {
  const expected = process.env.DASHBOARD_PASSWORD || '';
  return Boolean(expected && getHeader(request, 'authorization') === `Bearer ${expected}`);
}

function send(response: any, status: number, body: unknown) {
  return response.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

function parseBody(request: any) {
  const body = request?.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return {};
}

async function readProperties(): Promise<Property[]> {
  const result = await get(PATH, { access: 'private' });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error(`Blob read failed with status ${result?.statusCode ?? 404}`);
  }
  const text = await new Response(result.stream).text();
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('Property inventory data is invalid');
  return data;
}

async function writeProperties(data: Property[], previous: Property[]) {
  if (!Array.isArray(previous)) throw new Error('Refusing to write without a valid backup');
  await put(`crm/history/properties-${Date.now()}.json`, JSON.stringify(previous), {
    access: 'private',
    addRandomSuffix: true,
    contentType: 'application/json',
  });
  await put(PATH, JSON.stringify(data), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

function cleanProperty(input: any, existing?: Property): Property {
  const id = String(input.id || existing?.id || crypto.randomUUID());
  const status = String(input.status || existing?.status || 'Available');
  return {
    id,
    title: String(input.title ?? existing?.title ?? '').trim().slice(0, 160),
    propertyType: String(input.propertyType ?? existing?.propertyType ?? '').trim().slice(0, 80),
    location: String(input.location ?? existing?.location ?? '').trim().slice(0, 160),
    price: String(input.price ?? existing?.price ?? '').trim().slice(0, 80),
    minBudget: input.minBudget === '' || input.minBudget == null ? (existing?.minBudget ?? null) : Number(input.minBudget) || 0,
    maxBudget: input.maxBudget === '' || input.maxBudget == null ? (existing?.maxBudget ?? null) : Number(input.maxBudget) || 0,
    area: String(input.area ?? existing?.area ?? '').trim().slice(0, 80),
    bedrooms: String(input.bedrooms ?? existing?.bedrooms ?? '').trim().slice(0, 40),
    status: STATUSES.has(status) ? status as Property['status'] : 'Available',
    description: String(input.description ?? existing?.description ?? '').trim().slice(0, 2000),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
}

export default async function handler(request: any, response: any) {
  if (!authorized(request)) return send(response, 401, { error: 'Unauthorized' });
  try {
    if (request.method === 'GET') return send(response, 200, { properties: await readProperties() });
    if (request.method === 'POST') {
      const body = parseBody(request);
      const action = String(body.action || 'upsert');
      const all = await readProperties();
      if (action === 'delete') {
        const id = String(body.id || '');
        const next = all.filter(p => p.id !== id);
        await writeProperties(next, all);
        return send(response, 200, { ok: true, properties: next });
      }
      const existingIndex = all.findIndex(p => p.id === String(body.id || ''));
      const property = cleanProperty(body, existingIndex >= 0 ? all[existingIndex] : undefined);
      if (!property.title || !property.propertyType || !property.location) return send(response, 400, { error: 'Title, property type and location are required.' });
      if (existingIndex >= 0) all[existingIndex] = property; else all.unshift(property);
      await writeProperties(all, existingIndex >= 0 ? all.filter((_, i) => i !== existingIndex).concat(all[existingIndex]) : all.slice(1));
      return send(response, 200, { ok: true, property, properties: all });
    }
    return send(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('properties error', error);
    return send(response, 500, { error: 'Unable to access property inventory.' });
  }
}
