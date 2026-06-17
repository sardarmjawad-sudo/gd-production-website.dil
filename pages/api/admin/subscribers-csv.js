// pages/api/admin/subscribers-csv.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const cookies = req.headers.cookie || '';
  if (!cookies.includes('admin_session=authenticated')) {
    return res.status(401).send('Unauthorized');
  }

  const subsPath = path.join(process.cwd(), 'data', 'newsletter_subscribers.json');

  try {
    let subscribers = [];
    if (fs.existsSync(subsPath)) {
      subscribers = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
    }

    // Build CSV content
    let csvContent = 'Email,SubscribedAt\n';
    subscribers.forEach(sub => {
      csvContent += `"${sub.email}","${sub.subscribedAt}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Failed to generate CSV:', error);
    return res.status(500).send('Internal Server Error');
  }
}
