const nodemailer = require('nodemailer');

let cachedTransporter = null;

function buildTransportOptionsFromEnv() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '') === 'true' || port === 465;

  const user = typeof process.env.SMTP_USER === 'string' ? process.env.SMTP_USER.trim() : process.env.SMTP_USER;
  const passRaw = typeof process.env.SMTP_PASS === 'string' ? process.env.SMTP_PASS.trim() : process.env.SMTP_PASS;
  // Gmail app passwords are displayed with spaces; actual value is the 16 chars without spaces.
  const pass = typeof passRaw === 'string' ? passRaw.replace(/\s+/g, '') : passRaw;

  if (!host) {
    return null;
  }

  const options = {
    host,
    port,
    secure,
  };

  if (user && pass) {
    options.auth = { user, pass };
  }

  return options;
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const options = buildTransportOptionsFromEnv();
  if (!options) {
    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally SMTP_FROM).'
    );
  }

  cachedTransporter = nodemailer.createTransport(options);
  return cachedTransporter;
}

async function sendMail({ to, subject, text, html }) {
  const from = (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();
  if (!from) {
    throw new Error('SMTP_FROM (or SMTP_USER) is required to send emails');
  }
  if (!to) {
    throw new Error('Recipient email (to) is required');
  }

  const transporter = getTransporter();
  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };
