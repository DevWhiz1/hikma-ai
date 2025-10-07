const crypto = require('crypto');
const alg = 'aes-256-cbc';
const key = crypto.createHash('sha256').update(String(process.env.MEET_ENCRYPT_SECRET || 'defaultsecret')).digest();
const iv = Buffer.alloc(16, 0);

function encryptLink(link) {
  const c = crypto.createCipheriv(alg, key, iv);
  return c.update(link, 'utf8', 'hex') + c.final('hex');
}

function decryptLink(enc) {
  const d = crypto.createDecipheriv(alg, key, iv);
  return d.update(enc, 'hex', 'utf8') + d.final('utf8');
}

module.exports = { encryptLink, decryptLink };


