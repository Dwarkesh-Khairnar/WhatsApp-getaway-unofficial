// api/sessions.js
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

const sessions = new Map();

export async function createSession(sessionId, onQR, onStatusChange, onMessage) {
  if (sessions.has(sessionId)) {
    const existing = sessions.get(sessionId);
    if (existing.status === 'CONNECTED') {
      onStatusChange('CONNECTED');
      return existing;
    }
  }

  // Set up safe absolute paths for the session folder
  const sessionDir = path.resolve(`./sessions/${sessionId}`);
  if (!fs.existsSync(sessionDir)){
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const initWASocket = typeof makeWASocket === 'function' ? makeWASocket : makeWASocket.default;

  const sock = initWASocket({
    auth: state,
    printQRInTerminal: true, // Fallback scannable code inside terminal window
    logger: pino({ level: 'silent' }),
    browser: ['Windows', 'Chrome', '125.0.0.0'], 
    syncFullHistory: false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 120000,
  });

  sessions.set(sessionId, { sock, status: 'INITIALIZING', qr: null });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && sessions.has(sessionId)) {
      const qrDataUrl = await qrcode.toDataURL(qr);
      sessions.get(sessionId).qr = qrDataUrl;
      sessions.get(sessionId).status = 'QR_READY';
      onQR(qrDataUrl);
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode
        : null;

      if (sessions.has(sessionId)) {
        sessions.get(sessionId).status = 'DISCONNECTED';
      }
      onStatusChange('DISCONNECTED');

      // Reconnect if it wasn't an intentional phone logout
      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(() => {
          createSession(sessionId, onQR, onStatusChange, onMessage);
        }, 5000);
      } else {
        try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (e){}
        sessions.delete(sessionId);
      }
    } else if (connection === 'open' && sessions.has(sessionId)) {
      sessions.get(sessionId).status = 'CONNECTED';
      sessions.get(sessionId).qr = null;
      onStatusChange('CONNECTED');
      console.log(`🟩 SUCCESS: Session [${sessionId}] Connected!`);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        if (!msg.key.fromMe) onMessage(msg);
      }
    }
  });

  return sessions.get(sessionId);
}

export function getSession(sessionId) {
  return sessions.get(sessionId);
}

export function listSessions() {
  return Array.from(sessions.entries()).map(([id, data]) => ({ id, status: data.status, qr: data.qr }));
}