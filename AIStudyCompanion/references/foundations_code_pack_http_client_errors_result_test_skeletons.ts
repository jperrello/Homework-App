// =============================================
// README (Foundations Code Pack)
// Files in this bundle:
// 1) src/foundation/errors.ts         — AppError, Result<T,E>, helpers
// 2) src/foundation/telemetry.ts      — minimal Telemetry wrapper
// 3) src/foundation/keyValueStore.ts  — storage abstraction for AsyncStorage/SecureStore
// 4) src/foundation/httpClient.ts     — axios instance w/ retry, 429/5xx handling, auth & logging interceptors
// 5) src/__tests__/httpClient.test.ts — Jest test skeleton for httpClient
// 6) src/__tests__/aiService.test.ts  — Jest test skeleton for AI prompt + retry behavior
//
// Integration steps:
// - Move each section into its own file structure as indicated by the file banners.
// - Ensure you have axios and (optionally) expo-secure-store, @react-native-async-storage/async-storage.
// - Add dev deps: jest, ts-jest, @types/jest, nock, ts-node, typescript.
// - Configure Jest (example config at bottom comment).
// =============================================

// =============================================
// File: src/foundation/errors.ts
// =============================================

export type AppErrorCode =
  | 'network.unreachable'
  | 'http.timeout'
  | 'http.rate_limit'
  | 'http.server_error'
  | 'auth.invalid_credentials'
  | 'auth.key_missing'
  | 'ai.provider_error'
  | 'ai.rate_limit'
  | 'storage.corrupt_state'
  | 'storage.write_failed'
  | 'validation.failed'
  | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;
  readonly retriable?: boolean;
  readonly httpStatus?: number;

  constructor(
    code: AppErrorCode,
    message: string,
    options?: { cause?: unknown; retriable?: boolean; httpStatus?: number }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = options?.cause;
    this.retriable = options?.retriable;
    this.httpStatus = options?.httpStatus;
  }
}

export const isAppError = (e: unknown): e is AppError =>
  e instanceof Error && (e as any).name === 'AppError' && 'code' in (e as any);

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const Err = <E = AppError>(error: E): Result<never, E> => ({ ok: false, error });

export const toAppError = (e: unknown, fallback: AppErrorCode = 'unknown'): AppError => {
  if (isAppError(e)) return e;
  if (e instanceof Error) return new AppError(fallback, e.message, { cause: e });
  return new AppError(fallback, String(e));
};

// =============================================
// File: src/foundation/telemetry.ts
// =============================================

export interface Telemetry {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  timing: (name: string, ms: number, meta?: Record<string, unknown>) => void;
  increment: (name: string, count?: number, meta?: Record<string, unknown>) => void;
}

export const createConsoleTelemetry = (): Telemetry => ({
  info: (msg, meta) => console.log('[info]', msg, meta ?? {}),
  warn: (msg, meta) => console.warn('[warn]', msg, meta ?? {}),
  error: (msg, meta) => console.error('[error]', msg, meta ?? {}),
  timing: (name, ms, meta) => console.log('[timing]', name, ms, meta ?? {}),
  increment: (name, count = 1, meta) => console.log('[metric]', name, count, meta ?? {}),
});

export const NoopTelemetry: Telemetry = {
  info: () => {},
  warn: () => {},
  error: () => {},
  timing: () => {},
  increment: () => {},
};

// =============================================
// File: src/foundation/keyValueStore.ts
// =============================================

export interface KeyValueStore {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// Example adapters for React Native:
// - AsyncStorage adapter for non-secret data
// - SecureStore adapter for secrets

// If you use Expo:
// import * as SecureStore from 'expo-secure-store';
// import AsyncStorage from '@react-native-async-storage/async-storage';

export class MemoryStore implements KeyValueStore {
  private data = new Map<string, string>();
  async getString(key: string) { return this.data.get(key) ?? null; }
  async setString(key: string, value: string) { this.data.set(key, value); }
  async remove(key: string) { this.data.delete(key); }
}

// =============================================
// File: src/foundation/httpClient.ts
// =============================================

import axios, { AxiosError, AxiosInstance } from 'axios';
import { AppError } from './errors';
import type { Telemetry } from './telemetry';

export interface HttpClientOptions {
  baseURL?: string;
  getAuthToken?: () => Promise<string | null> | string | null;
  timeoutMs?: number; // per request
  maxRetries?: number; // for 429/5xx
  retryBaseMs?: number; // base backoff in ms
  telemetry?: Telemetry;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const computeBackoff = (attempt: number, baseMs: number) => {
  // Exponential backoff with jitter
  const exp = baseMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseMs;
  return exp + jitter;
};

export const createHttpClient = (opts: HttpClientOptions = {}): AxiosInstance => {
  const {
    baseURL,
    getAuthToken,
    timeoutMs = 30000,
    maxRetries = 2,
    retryBaseMs = 400,
    telemetry,
  } = opts;

  const client = axios.create({ baseURL, timeout: timeoutMs });

  // Request interceptor: attach auth + start timer
  client.interceptors.request.use(async (config) => {
    const start = Date.now();
    (config as any).__start = start;

    if (getAuthToken) {
      const token = await Promise.resolve(getAuthToken());
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }

    telemetry?.info('http.request', { url: config.url, method: config.method });
    return config;
  });

  // Response interceptor: timing
  client.interceptors.response.use(
    (res) => {
      const start = (res.config as any).__start as number | undefined;
      if (typeof start === 'number') {
        telemetry?.timing('http.latency', Date.now() - start, {
          url: res.config.url,
          status: res.status,
        });
      }
      return res;
    },
    async (error: AxiosError) => {
      const config = error.config ?? {};
      const start = (config as any).__start as number | undefined;
      if (typeof start === 'number') {
        telemetry?.timing('http.latency', Date.now() - start, {
          url: (config as any).url,
          error: error.code,
        });
      }

      // Retry policy: 429/5xx and network timeouts
      const status = error.response?.status;
      const retriable =
        status === 429 || (status != null && status >= 500 && status < 600) || error.code === 'ECONNABORTED';

      (config as any).__attempt = ((config as any).__attempt ?? 0) as number;
      const attempt = ((config as any).__attempt as number) + 1;

      if (retriable && attempt <= maxRetries) {
        (config as any).__attempt = attempt;

        // Respect Retry-After if present
        const retryAfter = error.response?.headers?.['retry-after'];
        let delayMs: number | undefined;
        if (retryAfter) {
          const asNum = Number(retryAfter);
          delayMs = isNaN(asNum) ? undefined : asNum * 1000;
        }
        if (!delayMs) delayMs = computeBackoff(attempt, retryBaseMs);

        telemetry?.warn('http.retry', { url: (config as any).url, status, attempt, delayMs });
        await sleep(delayMs);
        return client.request(config);
      }

      // Map to AppError and reject
      if (status === 429) {
        throw new AppError('http.rate_limit', 'Rate limited by server', {
          httpStatus: 429,
          retriable: true,
          cause: error,
        });
      }
      if (status && status >= 500) {
        throw new AppError('http.server_error', `Server error (${status})`, {
          httpStatus: status,
          retriable: true,
          cause: error,
        });
      }
      if (error.code === 'ECONNABORTED') {
        throw new AppError('http.timeout', 'Request timed out', {
          retriable: true,
          cause: error,
        });
      }

      // Fallback mapping
      throw new AppError('unknown', error.message, { cause: error });
    }
  );

  return client;
};

// =============================================
// File: src/__tests__/httpClient.test.ts
// =============================================

/**
 * Jest test skeleton for httpClient retry & mapping.
 * - Uses nock for HTTP mocking.
 */

import nock from 'nock';
import { createHttpClient } from '../foundation/httpClient';
import { AppError } from '../foundation/errors';

const BASE = 'https://api.example.com';

describe('httpClient', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('retries on 429 then succeeds', async () => {
    const scope = nock(BASE)
      .get('/data')
      .reply(429, 'rate', { 'Retry-After': '0' })
      .get('/data')
      .reply(200, { ok: true });

    const client = createHttpClient({ baseURL: BASE, maxRetries: 1, retryBaseMs: 1 });
    const res = await client.get('/data');
    expect(res.status).toBe(200);
    expect(scope.isDone()).toBe(true);
  });

  it('maps final 5xx to AppError', async () => {
    nock(BASE).get('/boom').times(3).reply(503, 'nope');
    const client = createHttpClient({ baseURL: BASE, maxRetries: 2, retryBaseMs: 1 });
    await expect(client.get('/boom')).rejects.toBeInstanceOf(AppError);
  });
});

// =============================================
// File: src/__tests__/aiService.test.ts
// =============================================

/**
 * Example skeleton for testing your AI orchestration with retries and prompt building.
 * Replace `buildPrompt` and `callAI` with your actual exported functions or wrap with adapters.
 */

import { Ok, Err, AppError } from '../foundation/errors';

// Example seams you might expose in aiService to ease testing:
// export const _internal = { buildPrompt, callAI };

describe('aiService', () => {
  it('builds prompt from user preferences (snapshot)', () => {
    const prefs = { tone: 'concise', detail: 'medium', format: 'bullets' } as any;
    const input = { task: 'summarize', content: 'Canvas assignment text' };
    // const prompt = _internal.buildPrompt(prefs, input);
    const prompt = JSON.stringify({ prefs, input }); // placeholder
    expect(prompt).toMatchSnapshot();
  });

  it('surfaces rate limit as AppError(ai.rate_limit)', async () => {
    function simulatedCall(): Promise<never> {
      throw new AppError('ai.rate_limit', 'LLM said slow down', { retriable: true });
    }
    await expect(simulatedCall()).rejects.toBeInstanceOf(AppError);
  });

  it('returns Ok on successful generation', async () => {
    const generate = async () => Ok({ text: 'hello world' });
    const res = await generate();
    expect(res.ok).toBe(true);
  });

  it('returns Err on provider error', async () => {
    const generate = async () => Err(new AppError('ai.provider_error', 'bad upstream'));
    const res = await generate();
    expect(res.ok).toBe(false);
  });
});

// =============================================
// Jest config example (place in jest.config.ts)
// =============================================

/**
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  setupFilesAfterEnv: [],
};
*/
