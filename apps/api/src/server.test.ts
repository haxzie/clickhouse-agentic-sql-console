import { describe, expect, it } from 'vitest';

import app from './server.js';

describe('GET /', () => {
  it('should return Hello world!', async () => {
    const response = await app.request('/');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Hello world!');
  });
});

describe('POST /query', () => {
  it("should reject a request without a 'query'", async () => {
    const response = await app.request('/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "'query' is required" });
  });
});
