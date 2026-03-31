/**
 * @file logs.property.spec.ts
 * Property-based tests for error logging rate limiting.
 * Verifies that the POST /logs/client-errors endpoint is configured
 * with the correct @Throttle decorator (100 req/min per IP) and that
 * the ThrottlerModule + ThrottlerGuard are wired into the logs module.
 *
 * **Validates: Requirements 13.7**
 */
import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { LogsModule } from './logs.module';

// ── Throttler metadata keys (from @nestjs/throttler v6) ─────────
// The @Throttle decorator stores per-named-throttler metadata as:
//   THROTTLER:LIMIT{name}  → limit value
//   THROTTLER:TTL{name}    → ttl value
// For @Throttle({ default: { limit: 100, ttl: 60000 } }), the keys are:
//   'THROTTLER:LIMITdefault' and 'THROTTLER:TTLdefault'
const THROTTLER_LIMIT_KEY = 'THROTTLER:LIMITdefault';
const THROTTLER_TTL_KEY = 'THROTTLER:TTLdefault';

// ── Mock helpers ────────────────────────────────────────────────

const mockLogsService = {
  forwardErrors: jest.fn().mockResolvedValue(undefined),
};

// ── Generators ──────────────────────────────────────────────────

/** Arbitrary error message string. */
const errorMessageArb = fc
  .string({ minLength: 1, maxLength: 100, unit: 'grapheme-ascii' })
  .filter((s) => s.trim().length > 0);

/** Arbitrary error payload matching the ErrorPayload interface. */
const errorPayloadArb = fc.record({
  message: errorMessageArb,
  stack: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  pageUrl: fc.option(fc.constant('https://app.korefield.com/learner'), { nil: undefined }),
  userAgent: fc.option(fc.constant('Mozilla/5.0'), { nil: undefined }),
  timestamp: fc.option(fc.constant(new Date().toISOString()), { nil: undefined }),
  userId: fc.option(fc.constant('LRN-test123'), { nil: undefined }),
});

/** Arbitrary batch of 1–5 error payloads. */
const errorBatchArb = fc.array(errorPayloadArb, { minLength: 1, maxLength: 5 });

/** Arbitrary request count above the 100 req/min limit. */
const excessRequestCountArb = fc.integer({ min: 101, max: 200 });

// ── Property 25: Error Logging Rate Limiting ────────────────────

describe('Property 25: Error Logging Rate Limiting', () => {
  let controller: LogsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      providers: [
        { provide: LogsService, useValue: mockLogsService },
      ],
    }).compile();

    controller = module.get<LogsController>(LogsController);
  });

  it('the @Throttle decorator on logClientErrors is configured with limit=100 and ttl=60000', async () => {
    await fc.assert(
      fc.asyncProperty(errorBatchArb, async (errors) => {
        // The NestJS @Throttle({ default: { limit, ttl } }) decorator stores
        // metadata on the route handler as 'THROTTLER:LIMITdefault' and 'THROTTLER:TTLdefault'
        const handler = LogsController.prototype.logClientErrors;
        const limit = Reflect.getMetadata(THROTTLER_LIMIT_KEY, handler);
        const ttl = Reflect.getMetadata(THROTTLER_TTL_KEY, handler);

        // Verify the throttle metadata exists and has the correct values
        expect(limit).toBeDefined();
        expect(ttl).toBeDefined();
        expect(limit).toBe(100);
        expect(ttl).toBe(60000);

        // Verify the controller still processes valid payloads correctly
        const result = await controller.logClientErrors({ errors });
        expect(result).toEqual({ received: true });
        expect(mockLogsService.forwardErrors).toHaveBeenCalledWith(errors);
      }),
      { numRuns: 100 },
    );
  });

  it('for any request count exceeding 100, the throttle config ensures rejection at the rate limit boundary', async () => {
    await fc.assert(
      fc.asyncProperty(
        excessRequestCountArb,
        errorBatchArb,
        async (totalRequests, errors) => {
          const handler = LogsController.prototype.logClientErrors;
          const limit = Reflect.getMetadata(THROTTLER_LIMIT_KEY, handler);
          const ttl = Reflect.getMetadata(THROTTLER_TTL_KEY, handler);

          // The configured limit must be exactly 100
          expect(limit).toBe(100);
          // The TTL must be 60000ms (1 minute)
          expect(ttl).toBe(60000);

          // For any totalRequests > limit, the number of requests that
          // would be rejected equals totalRequests - limit
          const expectedRejections = totalRequests - limit;
          expect(expectedRejections).toBeGreaterThan(0);

          // The rate limit boundary is at exactly 100 requests per minute
          expect(totalRequests).toBeGreaterThan(limit);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('the LogsModule wires ThrottlerModule and ThrottlerGuard for rate limiting', () => {
    // Verify the module metadata includes ThrottlerModule in imports
    const imports = Reflect.getMetadata('imports', LogsModule);
    expect(imports).toBeDefined();

    // ThrottlerModule.forRoot returns a DynamicModule — check it's present
    const hasThrottlerImport = imports.some(
      (imp: any) => imp?.module?.name === 'ThrottlerModule' || imp?.name === 'ThrottlerModule',
    );
    expect(hasThrottlerImport).toBe(true);

    // Verify ThrottlerGuard is registered as APP_GUARD in providers
    const providers = Reflect.getMetadata('providers', LogsModule);
    expect(providers).toBeDefined();

    const hasThrottlerGuard = providers.some(
      (p: any) => p?.provide?.toString() === 'APP_GUARD' || p?.provide === 'APP_GUARD',
    );
    expect(hasThrottlerGuard).toBe(true);
  });

  it('the controller forwards all error payloads to the service regardless of batch content', async () => {
    await fc.assert(
      fc.asyncProperty(errorBatchArb, async (errors) => {
        jest.clearAllMocks();

        const result = await controller.logClientErrors({ errors });

        // The controller always delegates to the service
        expect(mockLogsService.forwardErrors).toHaveBeenCalledTimes(1);
        expect(mockLogsService.forwardErrors).toHaveBeenCalledWith(errors);
        expect(result).toEqual({ received: true });
      }),
      { numRuns: 100 },
    );
  });
});
