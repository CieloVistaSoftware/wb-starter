import { test, expect } from '../fixtures/offline';

/**
 * A MISSING SCHEMA IS A QUIET 404, NOT A SERVER ERROR
 * ===================================================
 * teach-by-example.js fetches `<behavior>.schema.json` to learn whether a
 * behavior has a schema at all, and empty and json do not. server.js
 * handed every /src/wb-models/*.json path to res.sendFile without checking it
 * existed, so each miss reached Express's default error handler: a full ENOENT
 * stack trace in the server log on every page that used those behaviors, and
 * the server's own filesystem path in the response body.
 */
test.describe('missing /src/wb-models/*.json', () => {
  // desclist was the third until #879 gave it a schema.
  for (const name of ['empty', 'json']) {
    test(`${name}.schema.json answers a plain 404`, async ({ request }) => {
      const path = `/src/wb-models/${name}.schema.json`;
      const res = await request.get(path);
      expect(res.status()).toBe(404);
      const body = await res.text();
      expect(body, 'the 404 must not be an error page leaking the server path').not.toMatch(/ENOENT|Error:|[A-Z]:\\|\/home\//);
      expect(body).toBe(`File not found: ${path}`);
    });
  }

  test('an existing schema is still served', async ({ request }) => {
    const res = await request.get('/src/wb-models/button.schema.json');
    expect(res.status()).toBe(200);
    const schema = await res.json();
    expect(schema.title || schema.$id, 'the served schema must be the real file').toBeTruthy();
  });
});
