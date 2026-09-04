function getHeader(request: any, name: string) {
  const headers = request?.headers;
  if (headers && typeof headers.get === 'function') return headers.get(name) || '';
  const value = headers?.[name.toLowerCase()] ?? headers?.[name];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default function handler(request: any, response: any) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.DASHBOARD_PASSWORD || '';
  const authorization = getHeader(request, 'authorization');
  const authorized = Boolean(expected && authorization === `Bearer ${expected}`);

  response.setHeader('Cache-Control', 'no-store');
  if (!authorized) return response.status(401).json({ error: 'Unauthorized' });
  return response.status(200).json({ ok: true });
}
