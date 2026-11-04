// Does a mailbox exist? Ask its mail server with EHLO, MAIL FROM and RCPT TO,
// then hang up before DATA, so nothing is ever sent (#1966). This shows that a
// mailbox exists, never that it belongs to the person who typed it.
import net from 'node:net';
import dns from 'node:dns/promises';
import { randomBytes } from 'node:crypto';

const HELO_NAME = 'cielovistasoftware.com';

/**
 * What a reply to RCPT TO means. Only a "no such mailbox" answer counts as bad:
 * a 5xx can also mean the server is blocking us, which says nothing about the address.
 * @param {number} code
 * @param {string} text
 * @returns {'good' | 'bad' | 'unknown'}
 */
export function classifyRcpt(code, text) {
  if (code >= 200 && code < 300) return 'good';
  if (code < 500) return 'unknown';
  if (/\b5\.1\.\d\b/.test(text)) return 'bad';
  if (/\b5\.\d+\.\d+\b/.test(text)) return 'unknown';
  if (/block|policy|spam|reputation|denied|listed/i.test(text)) return 'unknown';
  return 'bad';
}

/** One SMTP conversation: send a line, wait for the complete reply. */
function openSession(host, port, timeoutMs) {
  const socket = net.connect({ host, port, timeout: timeoutMs });
  let buffer = '';
  let waiting = null;
  const finish = (error, reply) => {
    if (!waiting) return;
    const { resolve, reject } = waiting;
    waiting = null;
    if (error) reject(error); else resolve(reply);
  };
  socket.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\r\n').filter(Boolean);
    const last = lines[lines.length - 1];
    if (!buffer.endsWith('\r\n') || !last || last[3] === '-') return; // reply not finished
    buffer = '';
    finish(null, { code: Number(last.slice(0, 3)), text: lines.join(' ') });
  });
  socket.on('timeout', () => { finish(new Error('timed out')); socket.destroy(); });
  socket.on('error', (error) => finish(error));
  socket.on('close', () => finish(new Error('connection closed')));
  const nextReply = () => new Promise((resolve, reject) => { waiting = { resolve, reject }; });
  return {
    nextReply,
    send(line) { const reply = nextReply(); socket.write(`${line}\r\n`); return reply; },
    close() { socket.destroy(); },
  };
}

/**
 * @param {string} email
 * @param {{ resolveMx?: Function, port?: number, timeoutMs?: number }} [options]
 * @returns {Promise<{ result: 'good' | 'bad' | 'unknown', why: string }>}
 */
export async function verifyMailbox(email, options = {}) {
  const { resolveMx = dns.resolveMx, port = 25, timeoutMs = 15000 } = options;
  const domain = email.slice(email.lastIndexOf('@') + 1);

  let records;
  try {
    records = await resolveMx(domain);
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return { result: 'bad', why: 'the domain has no mail server' };
    }
    return { result: 'unknown', why: `could not look up the domain (${error.code || error.message})` };
  }
  if (!records.length) return { result: 'bad', why: 'the domain has no mail server' };
  const host = [...records].sort((a, b) => a.priority - b.priority)[0].exchange;

  const session = openSession(host, port, timeoutMs);
  try {
    const greeting = await session.nextReply();
    if (greeting.code !== 220) return { result: 'unknown', why: `server greeting: ${greeting.code}` };
    const ehlo = await session.send(`EHLO ${HELO_NAME}`);
    if (ehlo.code !== 250) return { result: 'unknown', why: `EHLO refused: ${ehlo.code}` };
    const from = await session.send('MAIL FROM:<>');
    if (from.code !== 250) return { result: 'unknown', why: `MAIL FROM refused: ${from.code}` };

    const rcpt = await session.send(`RCPT TO:<${email}>`);
    const result = classifyRcpt(rcpt.code, rcpt.text);
    if (result !== 'good') {
      await session.send('QUIT').catch(() => {});
      return { result, why: `${host} answered ${rcpt.code}` };
    }
    // A server that also accepts a made-up mailbox says yes to everything.
    const madeUp = `no-such-user-${randomBytes(8).toString('hex')}@${domain}`;
    const probe = await session.send(`RCPT TO:<${madeUp}>`);
    await session.send('QUIT').catch(() => {});
    // "Good" needs a clear "no such mailbox" for the made-up one. Anything else
    // (Outlook's servers, for one) means the first yes proved nothing.
    if (classifyRcpt(probe.code, probe.text) !== 'bad') {
      return { result: 'unknown', why: `${host} did not refuse a made-up address (${probe.code})` };
    }
    return { result: 'good', why: `${host} accepted it` };
  } catch (error) {
    return { result: 'unknown', why: `no clear answer from ${host} (${error.code || error.message})` };
  } finally {
    session.close();
  }
}
