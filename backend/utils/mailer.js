const nodemailer = require('nodemailer');

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const { GMAIL_USER, GMAIL_PASS } = process.env;
  if (!GMAIL_USER || !GMAIL_PASS) {
    throw new Error('GMAIL_USER/GMAIL_PASS not configured');
  }
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
  return cachedTransporter;
}

async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  const from = process.env.GMAIL_USER;
  const info = await transporter.sendMail({ from, to, subject, html, text });
  return info;
}

module.exports = { sendMail };


