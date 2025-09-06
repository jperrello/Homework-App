# Service Layer Improvement — Sketchpad

> Working doc to guide refactors, testing, and instrumentation across the 10 services. Use this as a living checklist. PRs should link to the relevant tasks below.

---

## Cross‑Cutting Architecture

**Objectives**
- Consistent error taxonomy and error handling
- Strong typing across boundaries
- Dependency injection for testability
- Offline‑first: caching + retries + backoff
- Observability: logs, metrics, traces
- Config isolation (env + runtime overrides)

**Decisions**
- **Error Model:** `AppError` with shape `{ code: string; message: string; cause?: unknown; retriable?: boolean; httpStatus?: number; }`
- **DI:** Constructor injection; add simple `ServiceRegistry` for shared singletons in app context
- **HTTP Layer:** central `httpClient` with interceptors (auth, rate limit, retry, logging)
- **Storage Policy:** `AsyncStorage` for non‑sensitive, `SecureStore` for secrets; wrap both behind `KeyValueStore`
- **Telemetry:** `log.info|warn|error`, `metrics.increment('service.event')`, `timers` for latency; wrap in `Telemetry`
- **Guardrails:** input Zod schemas per public method; exhaustiveness checks on unions
- **Concurrency:** Use an `AbortController` policy + `p-limit` style queues where needed

**TODO (Global)**
- [ ] Create `AppError`, `Result<T, E>` helpers
- [ ] Add `httpClient` with retry (exponential backoff + jitter), 429/5xx handling
- [ ] `Telemetry` wrapper: console fallback, no‑op in dev
- [ ] `KeyValueStore` wrapper; feature‑flag support
- [ ] Shared `RateLimiter` (token bucket) for AI/Canvas calls
- [ ] Add `ServiceRegistry` + wiring in app entry

---

## New Shared Modules (to implement first)

### 1) `httpClient.ts`
```ts
import axios, { AxiosInstance } from 'axios';

export const httpClient: AxiosInstance = axios.create({
  timeout: 15000,
});

httpClient.interceptors.response.use(
  res => res,
  async err => {
    const status = err.response?.status;
    if (status === 429 || (status >= 500 && status < 600)) {
      // Example retry with exponential backoff
      const delay = Math.pow(2, err.config.__retryCount || 0) * 100 + Math.random() * 100;
      err.config.__retryCount = (err.config.__retryCount || 0) + 1;
      if (err.config.__retryCount < 3) {
        await new Promise(r => setTimeout(r, delay));
        return httpClient(err.config);
      }
    }
    return Promise.reject(err);
  }
);
```

### 2) `AppError.ts`
```ts
export class AppError extends Error {
  code: string;
  retriable?: boolean;
  httpStatus?: number;

  constructor({ code, message, retriable, httpStatus, cause }: {
    code: string;
    message: string;
    retriable?: boolean;
    httpStatus?: number;
    cause?: unknown;
  }) {
    super(message);
    this.code = code;
    this.retriable = retriable;
    this.httpStatus = httpStatus;
    if (cause) (this as any).cause = cause;
  }
}

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };
```

### 3) Test Skeleton Template (Jest)
```ts
import { AppError } from '../AppError';
import { httpClient } from '../httpClient';

describe('httpClient', () => {
  it('retries on 429 errors', async () => {
    // TODO: mock axios adapter and assert retry attempts
  });
});

describe('AppError', () => {
  it('creates with correct fields', () => {
    const err = new AppError({ code: 'test.error', message: 'Something failed' });
    expect(err.code).toBe('test.error');
    expect(err.message).toBe('Something failed');
  });
});
```

---

## Service‑Specific Plans

*(kept from previous sketchpad — see prior service-by-service notes)*

---

## Milestones

**M1 — Foundations (1–2 days)**
- Implement `AppError`, `Result`, `httpClient`
- Add unit test harness + fixtures folder

**M2 — Stability & Tests (2–4 days)**
- Refactor AI/OpenAI/Auth to use shared layers
- Add tests for parsing, storage, auth flows

**M3 — Canvas & Content (2–4 days)**
- Memoized Canvas client; extractor plugins; transcripts interface

**M4 — Learning Loop (2–3 days)**
- Spaced repetition tuning; Study Assistant orchestration with timeouts and partial results

**M5 — Observability & Polish (ongoing)**
- Metrics dashboards; error budgets; UX surfacing of states (offline, rate‑limited)

---

## PR Checklist (copy into each PR)
- [ ] Types validated with Zod at boundaries
- [ ] All external calls via `httpClient`
- [ ] Errors mapped to `AppError` codes
- [ ] Unit tests for success + failure paths
- [ ] Logs + metrics added; sensitive data redacted
- [ ] Storage writes atomic; migrations covered
- [ ] Docs updated in this sketchpad

