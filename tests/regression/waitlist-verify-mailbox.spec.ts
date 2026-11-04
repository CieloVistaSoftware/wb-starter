import { test, expect } from '@playwright/test';
import net from 'node:net';
import { classifyRcpt, verifyMailbox } from '../../scripts/lib/smtp-verify.mjs';

// #1966: the EHLO check runs against a fake mail server here, so the test needs no
// network, and it proves DATA is never sent.
async function fakeServer(rcptReply: (address: string) => string) {
  const received: string[] = [];
  const server = net.createServer((socket) => {
    socket.write('220 fake ready\r\n');
    socket.on('data', (chunk) => {
      for (const line of chunk.toString().split('\r\n').filter(Boolean)) {
        received.push(line);
        if (line.startsWith('EHLO')) socket.write('250-fake\r\n250 OK\r\n');
        else if (line.startsWith('MAIL')) socket.write('250 OK\r\n');
        else if (line.startsWith('RCPT')) socket.write(`${rcptReply(line)}\r\n`);
        else if (line === 'QUIT') socket.end('221 bye\r\n');
      }
    });
    socket.on('error', () => {});
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as net.AddressInfo;
  const options = { port, resolveMx: async () => [{ exchange: '127.0.0.1', priority: 1 }] };
  return { received, options, close: () => server.close() };
}

test.describe('waitlist:verify says whether a mailbox exists (#1966)', () => {
  test('a mailbox the server accepts, and a made-up one it refuses, is good; nothing is sent', async () => {
    const mail = await fakeServer((line) => (line.includes('no-such-user') ? '550 5.1.1 no such user' : '250 OK'));
    const { result } = await verifyMailbox('real@example.test', mail.options);
    mail.close();
    expect(result).toBe('good');
    expect(mail.received.some((line) => line.startsWith('DATA'))).toBe(false);
  });

  test('a refused mailbox is bad', async () => {
    const mail = await fakeServer(() => '550 5.1.1 no such user');
    const { result } = await verifyMailbox('gone@example.test', mail.options);
    mail.close();
    expect(result).toBe('bad');
  });

  test('a server that accepts every address is unknown, not good', async () => {
    const mail = await fakeServer(() => '250 OK');
    const { result } = await verifyMailbox('any@example.test', mail.options);
    mail.close();
    expect(result).toBe('unknown');
  });

  test('a server that blocks the made-up probe is unknown, not good', async () => {
    const mail = await fakeServer((line) => (line.includes('no-such-user') ? '550 5.7.1 blocked by policy' : '250 OK'));
    const { result } = await verifyMailbox('any@example.test', mail.options);
    mail.close();
    expect(result).toBe('unknown');
  });

  test('a domain with no mail server is bad', async () => {
    const resolveMx = async () => { throw Object.assign(new Error('none'), { code: 'ENOTFOUND' }); };
    const { result } = await verifyMailbox('a@nowhere.test', { resolveMx });
    expect(result).toBe('bad');
  });

  test('nothing listening is unknown', async () => {
    const closed = await fakeServer(() => '250 OK');
    closed.close();
    const { result } = await verifyMailbox('a@example.test', { ...closed.options, timeoutMs: 2000 });
    expect(result).toBe('unknown');
  });

  test('a block or a temporary failure says nothing about the address', () => {
    expect(classifyRcpt(550, '550 5.7.1 blocked by policy')).toBe('unknown');
    expect(classifyRcpt(550, '550 your IP is listed')).toBe('unknown');
    expect(classifyRcpt(450, '450 try later')).toBe('unknown');
    expect(classifyRcpt(550, '550 no such user')).toBe('bad');
    expect(classifyRcpt(250, '250 OK')).toBe('good');
  });
});
