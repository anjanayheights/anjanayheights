import { get, list, put, del } from '@vercel/blob';

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
const ITEM_PREFIX = 'crm/properties/item-';
const RECOVERY_MARKER = 'crm/properties/recovery-seeded-v1.json';
const STATUSES = new Set(['Available', 'Hold', 'Sold', 'Inactive']);

const RECOVERY_PROPERTIES: Property[] = [
  {
    id: 'recovered-aminabad-710',
    title: '710 sq ft Flat',
    propertyType: 'Flat',
    location: 'Sector 1, Aminabad, Greater Noida',
    price: '₹40 Lakhs',
    minBudget: 4000000,
    maxBudget: 4000000,
    area: '710 sq ft',
    bedrooms: '',
    status: 'Available',
    description: 'Flat in Sector 1, Aminabad, Greater Noida. Seller: Arun.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'recovered-haridwar-110-bigha',
    title: '110 Bigha Commercial Land',
    propertyType: 'Commercial Land',
    location: 'Haridwar',
    price: '₹47 Lakhs per Bigha',
    minBudget: 517000000,
    maxBudget: 517000000,
    area: '110 bigha',
    bedrooms: '',
    status: 'Available',
    description: '110 bigha commercial land in Haridwar. Demand: ₹47 Lakhs per bigha. Approx. total value: ₹51.70 Cr. Seller: Arun.',
    createdAt: new Date().toISOString(),
  },
];

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

async function readLegacyProperties(): Promise<Property[]> {
  const result = await get(PATH, { access: 'private' });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error(`Blob read failed with status ${result?.statusCode ?? 404}`);
  }
  const text = await new Response(result.stream).text();
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('Property inventory data is invalid');
  return data;
}

async function readItemProperties(): Promise<Property[]> {
  const blobs: any[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: ITEM_PREFIX, cursor });
    blobs.push(...(page.blobs || []));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const properties: Property[] = [];
  for (const blob of blobs) {
    const result = await get(blob.pathname, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) continue;
    try {
      const value = JSON.parse(await new Response(result.stream).text());
      if (value && typeof value === 'object' && value.id) properties.push(value as Property);
    } catch {
      // Ignore an invalid individual item instead of breaking the whole inventory.
    }
  }
  return properties;
}

async function readProperties(): Promise<Property[]> {
  const items = await readItemProperties();
  if (items.length > 0) return items;
  return readLegacyProperties();
}

async function itemPath(id: string) {
  return `${ITEM_PREFIX}${encodeURIComponent(id)}.json`;
}

async function ensureItemStorage(properties: Property[]) {
  for (const property of properties) {
    await put(await itemPath(property.id), JSON.stringify(property), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
  }
}

async function seedRecoveredPropertiesOnce() {
  const marker = await get(RECOVERY_MARKER, { access: 'private' });
  if (marker?.statusCode === 200) return;

  const existing = await readProperties();
  const existingLocations = new Set(existing.map(p => p.location.trim().toLowerCase()));
  const missing = RECOVERY_PROPERTIES.filter(p => !existingLocations.has(p.location.trim().toLowerCase()));

  if (missing.length) await ensureItemStorage(missing);
  await put(RECOVERY_MARKER, JSON.stringify({ seededAt: new Date().toISOString(), ids: missing.map(p => p.id) }), {
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
    if (request.method === 'GET') {
      await seedRecoveredPropertiesOnce();
      return send(response, 200, { properties: await readProperties() });
    }

    if (request.method === 'POST') {
      const body = parseBody(request);
      const action = String(body.action || 'upsert');
      const all = await readProperties();

      // One-time migration: copy the legacy aggregate into independent item blobs.
      // Future writes touch only the requested property, so two simultaneous saves
      // cannot overwrite each other's inventory.
      const itemBlobs = await list({ prefix: ITEM_PREFIX });
      if (!itemBlobs.blobs?.length && all.length) await ensureItemStorage(all);

      if (action === 'delete') {
        const id = String(body.id || '');
        const next = all.filter(p => p.id !== id);
        if (next.length === all.length) return send(response, 404, { error: 'Property not found.' });
        await del(await itemPath(id));
        return send(response, 200, { ok: true, properties: next });
      }

      const existingIndex = all.findIndex(p => p.id === String(body.id || ''));
      const property = cleanProperty(body, existingIndex >= 0 ? all[existingIndex] : undefined);
      if (!property.title || !property.propertyType || !property.location) return send(response, 400, { error: 'Title, property type and location are required.' });

      await put(await itemPath(property.id), JSON.stringify(property), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });

      const next = existingIndex >= 0
        ? all.map((p, index) => index === existingIndex ? property : p)
        : [property, ...all];
      return send(response, 200, { ok: true, property, properties: next });
    }

    return send(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('properties error', error);
    return send(response, 500, { error: 'Unable to access property inventory.' });
  }
}
