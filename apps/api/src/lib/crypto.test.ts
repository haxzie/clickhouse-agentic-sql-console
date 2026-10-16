import { describe, expect, it } from 'vitest';

import { decrypt, encrypt } from './crypto.js';

describe('connection secret encryption', () => {
  it('round-trips a password', () => {
    const secret = 'super-secret-pw';
    expect(decrypt(encrypt(secret))).toBe(secret);
  });

  it('never stores the plaintext', () => {
    const encrypted = encrypt('super-secret-pw');
    expect(encrypted).not.toContain('super-secret-pw');
  });

  it('uses a fresh IV per call, so identical secrets differ at rest', () => {
    expect(encrypt('same')).not.toBe(encrypt('same'));
  });

  it('rejects a tampered payload', () => {
    const [iv, authTag] = encrypt('same').split(':');
    expect(() =>
      decrypt(`${iv}:${authTag}:${Buffer.from('tampered').toString('base64')}`),
    ).toThrow();
  });

  it('rejects a malformed payload', () => {
    expect(() => decrypt('not-an-encrypted-value')).toThrow('Malformed encrypted payload');
  });
});
