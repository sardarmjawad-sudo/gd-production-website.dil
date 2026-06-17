// api/contact.js
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    // Enable CORS for Vercel (optional depending on your exact setup, but good practice)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, business_name, email, phone, service, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    /* 
      IMPORTANT VERCEL DEPLOYMENT NOTE:
      You must add these environment variables in your Vercel Project Settings -> Environment Variables
      - EMAIL_USER (e.g., your-email@gmail.com)
      - EMAIL_PASS (Your Gmail App Password)
      - EMAIL_RECEIVER (e.g., GDProductionmarketing@gmail.com)
    */

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
        subject: `New Contact Request from ${name}`,
        html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Business Name:</strong> ${business_name || 'N/A'}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Service Needed:</strong> ${service || 'N/A'}</p>
            <br>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `
    };

    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'data', 'contact_leads.json');

    try {
        let leads = [];
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            leads = JSON.parse(fileData);
        }
        
        leads.push({
            name, business_name, email, phone, service, message,
            submittedAt: new Date().toISOString()
        });

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving lead:', err);
    }

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Your message has been sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
}
