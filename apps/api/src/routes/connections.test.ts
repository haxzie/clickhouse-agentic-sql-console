import { beforeEach, describe, expect, it, vi } from 'vitest';

type ProbeResult = { ok: true } | { ok: false; error: string };

const probeConnection = vi.fn<(input: { url: string }) => Promise<ProbeResult>>();
const addConnection = vi.fn((input: unknown) => ({ id: 'c1', ...(input as object) }));

vi.mock('../lib/clickhouse.js', () => ({ probeConnection }));
vi.mock('../lib/connections.js', () => ({
  addConnection,
  listConnections: () => [],
  removeConnection: () => ({ ok: true }),
}));

const { connectionRoutes } = await import('./connections.js');

const post = (body: unknown) =>
  connectionRoutes.request('/connections', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const draft = { name: 'Prod', url: 'http://localhost:8123', database: 'default' };

describe('POST /connections', () => {
  beforeEach(() => {
    probeConnection.mockReset();
    addConnection.mockClear();
  });

  it('saves a connection that answers', async () => {
    probeConnection.mockResolvedValue({ ok: true });

    const response = await post(draft);

    expect(response.status).toBe(201);
    expect(addConnection).toHaveBeenCalledOnce();
  });

  it('refuses to save one that does not, and says why', async () => {
    probeConnection.mockResolvedValue({ ok: false, error: 'connect ECONNREFUSED (ECONNREFUSED)' });

    const response = await post(draft);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Could not connect: connect ECONNREFUSED (ECONNREFUSED)',
    });
    expect(addConnection).not.toHaveBeenCalled();
  });

  it('checks the details before spending a round trip on them', async () => {
    const response = await post({ name: '', url: 'not-a-url' });

    expect(response.status).toBe(400);
    expect(probeConnection).not.toHaveBeenCalled();
  });
});
