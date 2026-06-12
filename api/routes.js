import express from 'express';
import crypto from 'crypto';
import { createSession, getSession, listSessions } from './sessions.js';
import { config, db } from './config.js';

const router = express.Router();

// Middleware: API Key & IP Security Guard
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
};

// Log Engine helper
const logEvent = (event, details) => {
  const timestamp = new Date().toISOString();
  if (config.dbProvider === 'postgres') {
    db.query('INSERT INTO logs(id, event, timestamp, details) VALUES($1, $2, $3, $4)', [crypto.randomUUID(), event, timestamp, JSON.stringify(details)]);
  } else {
    db.run('INSERT INTO logs(id, event, timestamp, details) VALUES(?, ?, ?, ?)', [crypto.randomUUID(), event, timestamp, JSON.stringify(details)]);
  }
};

// Dispatch Webhook with cryptographic sign verification
const dispatchWebhook = async (payload) => {
  const url = process.env.WEBHOOK_URL;
  if (!url) return;
  const signature = crypto.createHmac('sha256', config.webhookSecret).update(JSON.stringify(payload)).digest('hex');
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Gateway-Signature': signature },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    logEvent('WEBHOOK_FAILURE', { error: err.message });
  }
};

// --- ENDPOINTS ---

// Session management
router.post('/sessions/start', authenticate, async (req, res) => {
  const { sessionId } = req.body;
  await createSession(
    sessionId,
    (qr) => dispatchWebhook({ event: 'qr_received', sessionId, qr }),
    (status) => dispatchWebhook({ event: 'status_changed', sessionId, status }),
    (msg) => dispatchWebhook({ event: 'message_received', sessionId, message: msg })
  );
  res.json({ message: 'Session Initialization Started', sessionId });
});

router.get('/sessions', authenticate, (req, res) => {
  res.json(listSessions());
});

// Outbound Core Messaging API Matrix
router.post('/messages/send', authenticate, async (req, res) => {
  const { sessionId, to, text, mediaUrl, mediaType } = req.body;  // BUG FIX 1: don't destructure `options` from body
  const session = getSession(sessionId);

  if (!session || session.status !== 'CONNECTED') {
    return res.status(400).json({ error: 'Session not ready or connected' });
  }

  // BUG FIX 2: strip non-digit chars (e.g. leading +) before building JID
  const cleanNumber = (num) => num.replace(/\D/g, '');
  const receiver = to.includes('@s.whatsapp.net') || to.includes('@g.us')
    ? to
    : `${cleanNumber(to)}@s.whatsapp.net`;

  let payload = { text };
  if (mediaUrl) {
    payload = { [mediaType || 'image']: { url: mediaUrl }, caption: text };
  }

  // BUG FIX 3: wrap sendMessage in a race so we return a clean error if Baileys hangs
  const sendWithTimeout = (sock, receiver, payload, ms = 15000) =>
    Promise.race([
      sock.sendMessage(receiver, payload),           // no options arg — avoids internal Baileys crash
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`sendMessage timed out after ${ms}ms`)), ms)
      ),
    ]);

  try {
    const result = await sendWithTimeout(session.sock, receiver, payload);
    logEvent('MESSAGE_SENT', { sessionId, to: receiver });
    res.json({ success: true, result });
  } catch (error) {
    console.error('Message send failure:', error);
    return res.status(500).json({ error: 'Send failed', details: error.message });
  }
});

export default router;