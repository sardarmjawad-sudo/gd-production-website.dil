// pages/api/admin/login.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'GDProduction2026';

  if (password === adminPassword) {
    // Set HTTP-only session cookie
    res.setHeader('Set-Cookie', 'admin_session=authenticated; Path=/; HttpOnly; Max-Age=86400; SameSite=Strict');
    return res.status(200).json({ success: true, message: 'Authenticated successfully' });
  }

  return res.status(401).json({ error: 'Invalid admin password' });
}
