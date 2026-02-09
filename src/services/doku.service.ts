import axios, { type AxiosInstance } from "axios";
import crypto from "crypto";
import { env } from "../config/env";
import { buildDokuSignature, createBodyDigest } from "../utils/doku-signature";
import { HttpError } from "../utils/http-error";

interface DokuRequestOptions {
  path: string;
  method: "POST" | "PATCH" | "PUT" | "GET";
  body?: unknown;
}

export class DokuService {
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: env.DOKU_BASE_URL,
      timeout: 20000,
    });
  }

  async sendRequest(
    options: DokuRequestOptions,
  ): Promise<{ status: number; data: unknown; requestId: string }> {
    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().split(".")[0] + "Z";

    const body = options.body ? JSON.stringify(options.body) : "";

    const signature = buildDokuSignature({
      clientId: env.DOKU_CLIENT_ID,
      requestId,
      requestTarget: options.path,
      requestBody: body,
      timestamp: requestTimestamp,
    });

    try {
      const response = await this.httpClient.request({
        method: options.method,
        url: options.path,
        data: options.body,
        headers: {
          "Content-Type": "application/json",
          "Client-Id": env.DOKU_CLIENT_ID,
          "Request-Id": requestId,
          "Request-Timestamp": requestTimestamp,
          Signature: signature,
        },
      });

      return {
        status: response.status,
        data: response.data,
        requestId,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(11213123123123, error.response);
        const statusCode = error.response?.status ?? 502;
        const upstreamData = error.response?.data ?? { message: error.message };
        throw new HttpError(statusCode, "DOKU request failed", upstreamData);
      }

      throw error;
    }
  }

  async createPayment(
    payload: unknown,
  ): Promise<{ status: number; data: unknown; requestId: string }> {
    return this.sendRequest({
      method: "POST",
      path: env.DOKU_CREATE_PAYMENT_PATH,
      body: payload,
    });
  }

  async modifyPayment(payload: unknown): Promise<{
    status: number;
    data: unknown;
    requestId: string;
    endpoint: string;
  }> {
    const endpoint =
      env.DOKU_MODIFY_PAYMENT_PATH || env.DOKU_CREATE_PAYMENT_PATH;

    const response = await this.sendRequest({
      method: env.DOKU_MODIFY_PAYMENT_PATH ? "PATCH" : "POST",
      path: endpoint,
      body: payload,
    });

    return {
      ...response,
      endpoint,
    };
  }

  async cancelPayment(
    payload: unknown,
  ): Promise<{ status: number; data: unknown; requestId: string }> {
    if (!env.DOKU_CANCEL_PAYMENT_PATH) {
      throw new Error("DOKU_CANCEL_PAYMENT_PATH is not configured");
    }

    return this.sendRequest({
      method: "POST",
      path: env.DOKU_CANCEL_PAYMENT_PATH,
      body: payload,
    });
  }

  async getPaymentStatus(
    invoiceNumber: string,
  ): Promise<{ status: number; data: unknown; requestId: string }> {
    const statusPath = `/orders/v1/status/${encodeURIComponent(invoiceNumber)}`;

    return this.sendRequest({
      method: "GET",
      path: statusPath,
    });
  }
}
