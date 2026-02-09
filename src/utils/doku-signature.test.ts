import { describe, expect, it } from 'vitest';
import { buildDokuSignature, verifyDokuSignature } from './doku-signature';

describe('doku signature', () => {
  it('builds and verifies signature', () => {
    const base = {
      clientId: 'sample-client',
      requestId: 'request-123',
      requestTimestamp: '2024-01-01T10:00:00Z',
      requestTarget: '/checkout/v1/payment',
      body: { invoice_number: 'INV-001', amount: 10000 },
      secretKey: 'super-secret'
    };

    const signature = buildDokuSignature(base);

    expect(
      verifyDokuSignature({
        ...base,
        signature
      })
    ).toBe(true);

    expect(
      verifyDokuSignature({
        ...base,
        signature: `${signature}invalid`
      })
    ).toBe(false);
  });
});
