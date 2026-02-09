import crypto from 'crypto';

interface BuildSignaturePayload {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  body?: unknown;
  secretKey: string;
}

const stringifyBody = (body: unknown): string => {
  if (typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body ?? {});
};

export const createBodyDigest = (body: unknown): string => {
  const bodyString = stringifyBody(body);
  return crypto.createHash('sha256').update(bodyString).digest('base64');
};

export const buildDokuSignature = (payload: BuildSignaturePayload): string => {
  const signatureParts = [
    `Client-Id:${payload.clientId}`,
    `Request-Id:${payload.requestId}`,
    `Request-Timestamp:${payload.requestTimestamp}`,
    `Request-Target:${payload.requestTarget}`
  ];

  if (payload.body !== undefined) {
    signatureParts.push(`Digest:${createBodyDigest(payload.body)}`);
  }

  const stringToSign = signatureParts.join('\n');

  const hmac = crypto.createHmac('sha256', payload.secretKey);
  hmac.update(stringToSign);

  return `HMACSHA256=${hmac.digest('base64')}`;
};

interface VerifySignaturePayload extends Omit<BuildSignaturePayload, 'requestTarget'> {
  requestTarget: string;
  signature: string;
}

export const verifyDokuSignature = (payload: VerifySignaturePayload): boolean => {
  const expected = buildDokuSignature({
    clientId: payload.clientId,
    requestId: payload.requestId,
    requestTimestamp: payload.requestTimestamp,
    requestTarget: payload.requestTarget,
    body: payload.body,
    secretKey: payload.secretKey
  });

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(payload.signature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};
