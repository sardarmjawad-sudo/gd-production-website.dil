// pages/api/newsletter/subscribe.js
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS configuration (optional but good practice)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const email = req.body?.email;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const filePath = path.join(process.cwd(), 'data', 'newsletter_subscribers.json');
    let subscribers = [];

    // 1. Try to read existing subscribers
    try {
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        if (fileData.trim()) {
          subscribers = JSON.parse(fileData);
        }
      }
    } catch (error) {
      console.error('Warning: Could not read subscribers file:', error.message);
    }

    // 2. Check for duplicates safely
    const isDuplicate = subscribers.some(
      (sub) => sub?.email && typeof sub.email === 'string' && sub.email.toLowerCase() === email.toLowerCase()
    );

    if (isDuplicate) {
      return res.status(400).json({ error: 'This email is already subscribed.' });
    }

    subscribers.push({
      email: email.trim(),
      subscribedAt: new Date().toISOString()
    });

    // 3. Try to save locally (This will fail gracefully on Vercel)
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(subscribers, null, 2), 'utf8');
    } catch (error) {
      console.error('Warning: Could not save to filesystem (expected on Vercel):', error.message);
    }

    // 4. Validate Environment Variables
    console.log('--- Newsletter Environment Variables Check ---');
    console.log('- EMAIL_USER exists:', !!process.env.EMAIL_USER);
    console.log('- EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
    console.log('- EMAIL_RECEIVER exists:', !!process.env.EMAIL_RECEIVER);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('CRITICAL: EMAIL_USER or EMAIL_PASS environment variables are missing.');
      // If we consider emails critical to "success", we could return an error here.
      // But usually, we just skip it or alert the admin.
      // Let's fail gracefully or throw an error based on preference.
      // I will throw an error to fulfill "return detailed error messages in server logs".
      throw new Error('Server misconfiguration: Email credentials not set.');
    }

    // 5. Send Email Notification
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
      subject: `🎉 New Newsletter Subscriber: ${email}`,
      html: `
        <h2>New Newsletter Subscription!</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Success: Notification email sent for new subscriber: ${email}`);
    } catch (emailError) {
      console.error('Error sending newsletter notification email:', emailError);
      throw new Error(`SMTP Error: ${emailError.message}`);
    }

    // Always return success to the user if the request was valid
    return res.status(200).json({ success: true, message: 'Thank you for subscribing!' });

  } catch (globalError) {
    console.error('Unhandled API Route Error:', globalError);
    return res.status(500).json({ 
      error: 'We could not process your subscription at this time due to a server configuration issue. Please contact support.',
      details: globalError.message 
    });
  }
}
