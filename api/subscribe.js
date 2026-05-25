/**
 * Vercel Serverless Function to handle newsletter subscription requests.
 * Connects securely to the Resend Contacts API.
 */

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { email, locale } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error('[Subscribe API] Missing environment variables: RESEND_API_KEY or RESEND_AUDIENCE_ID');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const resendResponse = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        unsubscribed: false,
        properties: {
          locale: typeof locale === 'string' ? locale.trim() : 'en',
          site: 'taxem.ca'
        }
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('[Subscribe API] Resend error details:', errorData);

      // Handle contact already exists gracefully
      if (errorData.message && errorData.message.toLowerCase().includes('already exists')) {
        return res.status(200).json({ success: true, message: 'Already subscribed' });
      }

      return res.status(resendResponse.status).json({ error: errorData.message || 'Failed to subscribe' });
    }

    const data = await resendResponse.json();
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('[Subscribe API] Connection error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
