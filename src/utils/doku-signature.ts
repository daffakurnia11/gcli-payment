import crypto from "crypto";
import { env } from "../config/env";

interface BuildSignaturePayload {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  body?: unknown;
  secretKey: string;
}

const stringifyBody = (body: unknown): string => {
  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body ?? {});
};

export const createBodyDigest = (requestBody: string): string => {
  const crypto = require("crypto");

  // Calculate SHA-256 hash of the request body
  const hash = crypto
    .createHash("sha256")
    .update(requestBody, "utf-8")
    .digest();

  // Base64 encode the hash
  const digest = Buffer.from(hash).toString("base64");

  return digest;
};

/**
 * Generate DOKU Signature for Jokul Checkout API
 * Signature format: HMACSHA256=<base64_signature>
 *
 * Components joined by \n:
 * - Client-Id:value
 * - Request-Id:value
 * - Request-Timestamp:value
 * - Request-Target:value (API path)
 * - Digest:value (for POST requests only)
 *
 * @param clientId - Client ID
 * @param requestId - Request ID
 * @param timestamp - Request timestamp in ISO format
 * @param requestTarget - Request target (API path)
 * @param requestBody - Request body (JSON stringified) - empty string for GET requests
 * @returns Signature string with HMACSHA256= prefix
 */
export const buildDokuSignature = ({
  clientId,
  requestId,
  timestamp,
  requestTarget,
  requestBody = "",
}: {
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  requestBody: string;
}): string => {
  const crypto = require("crypto");

  // Build signature components
  let componentSignature = `Client-Id:${clientId}\n`;
  componentSignature += `Request-Id:${requestId}\n`;
  componentSignature += `Request-Timestamp:${timestamp}\n`;
  componentSignature += `Request-Target:${requestTarget}`;

  // Add Digest for POST requests
  if (requestBody && requestBody !== "") {
    const digest = createBodyDigest(requestBody);
    componentSignature += `\nDigest:${digest}`;

    // Debug logging
    console.log("=== DOKU Signature Debug ===");
    console.log("Client-Id:", clientId);
    console.log("Request-Id:", requestId);
    console.log("Request-Timestamp:", timestamp);
    console.log("Request-Target:", requestTarget);
    console.log("Request Body:", requestBody);
    console.log("Digest:", digest);
    console.log("=== Signature Components ===");
    console.log(componentSignature);
  } else {
    // Debug logging for GET requests
    console.log("=== DOKU Signature Debug (GET) ===");
    console.log("Client-Id:", clientId);
    console.log("Request-Id:", requestId);
    console.log("Request-Timestamp:", timestamp);
    console.log("Request-Target:", requestTarget);
    console.log("=== Signature Components ===");
    console.log(componentSignature);
  }

  // Calculate HMAC-SHA256 base64 from the components
  const hmac256Value = crypto
    .createHmac("sha256", env.DOKU_SECRET_KEY)
    .update(componentSignature)
    .digest();

  const signature = Buffer.from(hmac256Value).toString("base64");

  // Prepend "HMACSHA256=" to the signature
  const finalSignature = `HMACSHA256=${signature}`;

  console.log("=== Final Signature ===");
  console.log(finalSignature);
  console.log("========================");

  return finalSignature;
};

interface VerifySignaturePayload extends Omit<
  BuildSignaturePayload,
  "requestTarget"
> {
  requestTarget: string;
  signature: string;
}

export const verifyDokuSignature = (
  payload: VerifySignaturePayload,
): boolean => {
  const expected = buildDokuSignature({
    clientId: payload.clientId,
    requestId: payload.requestId,
    requestTarget: payload.requestTarget,
    requestBody: payload.body ? JSON.stringify(payload.body) : "",
    timestamp: payload.requestTimestamp,
  });

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(payload.signature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};
