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

function isAuthError(err) {
  const code = err?.code;
  const responseCode = err?.responseCode;
  const msg = String(err?.message || err?.response || '').toLowerCase();
  return (
    code === 'EAUTH' ||
    responseCode === 535 ||
    msg.includes('badcredentials') ||
    msg.includes('username and password not accepted') ||
    msg.includes('authentication failed')
  );
}

function buildFriendlySmtpError(err) {
  const host = process.env.SMTP_HOST;

  if (isAuthError(err)) {
    const isGmail = String(host || '').toLowerCase().includes('gmail');
    if (isGmail) {
      return new Error(
        'Email login failed (SMTP authentication error). If you are using Gmail, you must enable 2-Step Verification and generate a Gmail App Password, then set SMTP_USER to your Gmail address and SMTP_PASS to the 16-character app password. Restart the backend after changing .env.'
      );
    }

    return new Error(
      'Email login failed (SMTP authentication error). Check SMTP_USER/SMTP_PASS (and that your provider allows SMTP access). Restart the backend after changing .env.'
    );
  }

  return err;
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
  try {
    return await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    throw buildFriendlySmtpError(err);
  }
}

module.exports = { sendMail };
