// pages/api/admin/save-content.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = req.headers.cookie || '';
  if (!cookies.includes('admin_session=authenticated')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { siteContent } = req.body;
  if (!siteContent) {
    return res.status(400).json({ error: 'Missing siteContent data' });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const relativeFilePath = 'data/site_content.json';

  if (isProduction) {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    console.log({
      hasToken: !!process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      branch: process.env.GITHUB_BRANCH
    });

    const missingVars = [];
    if (!token) missingVars.push('GITHUB_TOKEN');
    if (!owner) missingVars.push('GITHUB_OWNER');
    if (!repo) missingVars.push('GITHUB_REPO');

    if (missingVars.length > 0) {
      const errorMsg = `Server misconfiguration: Missing GitHub credentials - ${missingVars.join(', ')}`;
      console.error(errorMsg);
      return res.status(500).json({ error: errorMsg });
    }

    try {
      // 1. Get current file SHA
      const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${relativeFilePath}?ref=${branch}`;
      const getResponse = await fetch(getUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha = '';
      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      } else if (getResponse.status !== 404) {
        const errorText = await getResponse.text();
        console.error('GitHub API Get File Error:', errorText);
        return res.status(500).json({ error: 'Failed to fetch current file from GitHub' });
      }

      // 2. Commit the new file
      const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${relativeFilePath}`;
      const contentBase64 = Buffer.from(JSON.stringify(siteContent, null, 2), 'utf8').toString('base64');
      
      const putBody = {
        message: 'Admin Panel: Update site content',
        content: contentBase64,
        branch: branch
      };
      
      if (sha) {
        putBody.sha = sha;
      }

      const putResponse = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      });

      if (!putResponse.ok) {
        const errorText = await putResponse.text();
        console.error('GitHub API Put File Error:', errorText);
        return res.status(500).json({ error: 'Failed to commit changes to GitHub' });
      }

      return res.status(200).json({ success: true, message: 'Content saved to GitHub successfully!' });

    } catch (error) {
      console.error('GitHub API Exception:', error);
      return res.status(500).json({ error: 'Failed to communicate with GitHub API' });
    }
  } else {
    // Local development: Write to file system
    try {
      const absolutePath = path.join(process.cwd(), relativeFilePath);
      fs.writeFileSync(absolutePath, JSON.stringify(siteContent, null, 2), 'utf8');
      return res.status(200).json({ success: true, message: 'Content saved locally successfully!' });
    } catch (error) {
      console.error('Failed to write site content locally:', error);
      return res.status(500).json({ error: 'Failed to save content locally' });
    }
  }
}
