const { sendMail } = require('../utils/mailer');

function getBaseUrl() {
  return process.env.APP_BASE_URL || 'https://hikmah.ai';
}

function formatSubject({ senderName, senderRole, messageType }) {
  return `[Hikmah] ${messageType} from ${senderName} (${senderRole})`;
}

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function trimContent(content, max = 280) {
  if (!content) return '';
  const c = String(content);
  return c.length > max ? `${c.slice(0, max)}…` : c;
}

function buildHtml({ senderName, senderRole, messageType, messagePreview, timestamp, openUrl }) {
  const safePreview = sanitize(messagePreview);
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111">
    <h2 style="margin:0 0 12px">New ${messageType} Notification</h2>
    <p style="margin:4px 0"><strong>From:</strong> ${sanitize(senderName)} (${sanitize(senderRole)})</p>
    <p style="margin:4px 0"><strong>Type:</strong> ${sanitize(messageType)}</p>
    <p style="margin:4px 0"><strong>When:</strong> ${new Date(timestamp).toLocaleString()}</p>
    <p style="margin:12px 0;padding:12px;background:#f6f6f6;border-radius:8px">${safePreview || '<em>No content</em>'}</p>
    <p style="margin:16px 0">
      <a href="${openUrl}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">Open Chat</a>
    </p>
  </div>`;
}

// Simple in-memory debounce cache: key -> lastSentMs
const lastSentByKey = new Map();
function getDebounceMs() {
  const v = Number(process.env.NOTIFY_DEBOUNCE_MS || '120000'); // default 2 minutes
  return Number.isFinite(v) && v >= 0 ? v : 120000;
}
function shouldDebounce(key) {
  const now = Date.now();
  const last = lastSentByKey.get(key) || 0;
  const debounceMs = getDebounceMs();
  if (debounceMs === 0) return false;
  if (now - last < debounceMs) return true;
  lastSentByKey.set(key, now);
  return false;
}

async function notifyAdmin({
  senderName,
  senderRole, // 'student' | 'scholar' | 'admin'
  messageType, // 'Chat', 'Admin', 'Meeting Request'
  messagePreview,
  sessionId, // for /chat/:sessionId links (direct sessions)
  chatId, // alternative chat id (if session not applicable)
  timestamp = Date.now(),
  toEmail, // optional: explicit recipient
  force = false, // bypass debounce when true
}) {
  // Ignore AI
  if (senderRole === 'ai' || senderRole === 'assistant') return;

  const to = toEmail || process.env.ADMIN_NOTIFY_EMAIL || process.env.GMAIL_USER;
  if (!to) return;

  // Debounce on per-recipient + session/chat + type
  const key = `${to}|${sessionId || chatId || 'general'}|${messageType}`;
  if (!force && shouldDebounce(key)) return;

  const base = getBaseUrl();
  const openUrl = sessionId
    ? `${base}/chat/${sessionId}`
    : `${base}/chat`;

  const subject = formatSubject({ senderName, senderRole, messageType });
  const html = buildHtml({ senderName, senderRole, messageType, messagePreview: trimContent(messagePreview), timestamp, openUrl });
  const text = `New ${messageType} from ${senderName} (${senderRole})\nWhen: ${new Date(timestamp).toLocaleString()}\nPreview: ${trimContent(messagePreview)}\nOpen: ${openUrl}`;

  try {
    await sendMail({ to, subject, html, text });
  } catch (e) {
    // best-effort: swallow errors to not break UX
    console.warn('Notification email failed:', e?.message || e);
  }
}

module.exports = { notifyAdmin };


