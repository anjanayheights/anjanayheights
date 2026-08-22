type NetlifySubmission = {
  id?: string;
  number?: number;
  created_at?: string;
  name?: string;
  email?: string;
  data?: Record<string, string>;
};

export default async (request: Request) => {
  const authHeader = request.headers.get('authorization') || '';
  const expected = process.env.DASHBOARD_PASSWORD || '';

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const token = process.env.NETLIFY_AUTH_TOKEN || '';
  const siteId = process.env.ANJANAY_SITE_ID || '';

  if (!token || !siteId) {
    return new Response(
      JSON.stringify({ error: 'Dashboard server configuration is incomplete.' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  try {
    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/submissions?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Netlify API returned ${response.status}`,
        }),
        {
          status: 502,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    const submissions = (await response.json()) as NetlifySubmission[];

    const leads = submissions.map((submission) => ({
      id: submission.id || String(submission.number || ''),
      created_at: submission.created_at || '',
      name: submission.data?.name || submission.name || '',
      phone:
        submission.data?.phone ||
        submission.data?.mobile ||
        '',
      email:
        submission.data?.email ||
        submission.email ||
        '',
      form_name:
        submission.data?.['form-name'] ||
        '',
      lead_type:
        submission.data?.lead_type ||
        '',
      property_type:
        submission.data?.property_type ||
        '',
      location:
        submission.data?.location ||
        '',
      budget:
        submission.data?.budget ||
        '',
      timeline:
        submission.data?.timeline ||
        '',
      requirement:
        submission.data?.requirement ||
        '',
      message:
        submission.data?.message ||
        '',
    }));

    return new Response(JSON.stringify({ leads }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Unable to load leads.',
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};
