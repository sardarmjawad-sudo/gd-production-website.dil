// pages/api/admin/upload-portfolio.js
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Enable larger body payloads for image uploads
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = req.headers.cookie || '';
  if (!cookies.includes('admin_session=authenticated')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { base64, filename } = req.body;
  if (!base64 || !filename) {
    return res.status(400).json({ error: 'Missing base64 data or filename' });
  }

  // Clean filename to prevent path traversal
  const cleanFilename = path.basename(filename).replace(/[^a-zA-Z0-9.\-_]/g, '');
  const imageUrl = `/assets/portfolio/${cleanFilename}`;
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  
  if (process.env.NODE_ENV === 'production') {
    // Upload to GitHub in production
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH } = process.env;
    
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      console.error('GitHub credentials missing');
      return res.status(500).json({ error: 'Server configuration error for GitHub uploads' });
    }
    
    const githubFilePath = `public/assets/portfolio/${cleanFilename}`;
    const branch = GITHUB_BRANCH || 'main';
    
    try {
      // Check if file already exists to get its SHA (required for updating, though we might just create unique names)
      let sha = undefined;
      try {
        const getRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubFilePath}?ref=${branch}`, {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        });
        if (getRes.ok) {
          const getData = await getRes.json();
          sha = getData.sha;
        }
      } catch (e) {
        // Ignore error if file doesn't exist
      }
      
      const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubFilePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload portfolio image ${cleanFilename}`,
          content: base64Data, // Already base64 encoded
          branch: branch,
          ...(sha && { sha })
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API error:', errorText);
        throw new Error(`GitHub API responded with status ${response.status}: ${errorText}`);
      }
      
      return res.status(200).json({ success: true, imageUrl });
    } catch (error) {
      console.error('File upload error (GitHub):', error);
      return res.status(500).json({ error: 'Failed to write file to GitHub repository', details: error.message });
    }
  } else {
    // Local development - save to disk
    const uploadDir = path.join(process.cwd(), 'public', 'assets', 'portfolio');
    const filePath = path.join(uploadDir, cleanFilename);

    try {
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      return res.status(200).json({ success: true, imageUrl });
    } catch (error) {
      console.error('File upload error (Local):', error);
      return res.status(500).json({ error: 'Failed to write file to local disk' });
    }
  }
}
