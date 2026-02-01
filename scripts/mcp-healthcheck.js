#!/usr/bin/env node
const http = require('http');
const port = process.env.MCP_HEALTH_PORT || process.argv[2] || 52100;

const opts = { hostname: '127.0.0.1', port: Number(port), path: '/health', method: 'GET', timeout: 2000 };

const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', c => body += c.toString());
  res.on('end', () => {
    try {
      const j = JSON.parse(body);
      if (j && j.status === 'ok') {
        console.log('MCP health: OK', j);
        process.exit(0);
      }
    } catch (err) {}
    console.error('MCP health: unexpected response', res.statusCode, body);
    process.exit(2);
  });
});

req.on('error', (err) => {
  console.error('MCP health: error', err.message);
  process.exit(3);
});
req.end();
