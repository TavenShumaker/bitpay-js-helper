import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { price = 1, currency = 'USD' } = req.body || {};

  // Get API token from environment
  const apiToken = process.env.BITPAY_API_TOKEN;
  if (!apiToken) {
    console.error('BITPAY_API_TOKEN environment variable not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://bitpay.com/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-accept-version': '2.0.0',
      },
      body: JSON.stringify({
        price,
        currency,
        token: apiToken,
        redirectURL: 'https://bitpay.com',
        autoRedirect: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('BitPay API error:', response.status, errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Invoice creation failed:', error);
    return res.status(500).json({ error: 'Failed to create invoice' });
  }
}
