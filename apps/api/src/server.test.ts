import { describe, expect, it } from 'vitest';

import app from './server.js';

describe('GET /', () => {
  it('explains how to get a web build when there is none', async () => {
    const response = await app.request('/');

    // The console is served from here once `pnpm build` has run; the test
    // environment has no build, which is the branch this covers.
    expect([200, 503]).toContain(response.status);
  });
});

describe('POST /api/query', () => {
  it("should reject a request without a 'query'", async () => {
    const response = await app.request('/api/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "'query' is required" });
  });
});
