// pages/api/admin/get-data.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const cookies = req.headers.cookie || '';
  if (!cookies.includes('admin_session=authenticated')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const contentPath = path.join(process.cwd(), 'data', 'site_content.json');
  const dataDir = path.join(process.cwd(), 'data');
  const subscribersPath = path.join(dataDir, 'newsletter_subscribers.json');
  const leadsPath = path.join(dataDir, 'contact_leads.json');

  try {
    let siteContent = {};
    if (fs.existsSync(contentPath)) {
      siteContent = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    }

    let subscribers = [];
    if (fs.existsSync(subscribersPath)) {
      subscribers = JSON.parse(fs.readFileSync(subscribersPath, 'utf8'));
    }

    let leads = [];
    if (fs.existsSync(leadsPath)) {
      leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
    }

    return res.status(200).json({ 
      success: true, 
      siteContent, 
      subscribers,
      leads 
    });
  } catch (error) {
    console.error('Failed to read data files:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
