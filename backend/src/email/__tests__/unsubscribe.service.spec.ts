/**
 * @file unsubscribe.service.spec.ts — Property-based test for UnsubscribeService
 * unsubscribe token round-trip using fast-check.
 *
 * Feature: transactional-email-system, Property 10: Unsubscribe token round-trip
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as fc from 'fast-check';
import { UnsubscribeService } from '../unsubscribe.service';
import { PrismaService } from '@common/prisma/prisma.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@common/utils/generate-id', () => ({
  generateId: jest
    .fn()
    .mockImplementation((prefix: string) => `${prefix}-test01`),
}));

// ---------------------------------------------------------------------------
// Helpers — fast-check arbitraries
// ---------------------------------------------------------------------------

const HEX = 'abcdef0123456789';

/** Arbitrary that produces a user ID in USR-xxxxxx format. */
const arbUserId: fc.Arbitrary<string> = fc
  .string({ minLength: 6, maxLength: 6, unit: fc.constantFrom(...HEX.split('')) })
  .map((s: string) => `USR-${s}`);

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

const TEST_SECRET = 'test-secret-key-for-property-tests';

describe('UnsubscribeService — Property 10: Unsubscribe token round-trip', () => {
  let service: UnsubscribeService;
  let jwtService: JwtService;
  let mockUpsert: jest.Mock;

  beforeEach(async () => {
    mockUpsert = jest.fn().mockResolvedValue({});

    const mockPrisma = {
      emailPreference: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: mockUpsert,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: TEST_SECRET })],
      providers: [
        UnsubscribeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UnsubscribeService>(UnsubscribeService);
    jwtService = module.get<JwtService>(JwtService);
  });

  /**
   * Property 10: For any user ID, generating an unsubscribe token and then
   * calling unsubscribeMarketing(token) must result in marketing_opted_out=true,
   * and the decoded token must contain the original userId and email-unsubscribe purpose.
   *
   * **Validates: Requirements 18.2, 18.5**
   */
  it('generates a token that decodes to the original userId with email-unsubscribe purpose, and unsubscribeMarketing sets marketing_opted_out=true', async () => {
    await fc.assert(
      fc.asyncProperty(arbUserId, async (userId: string) => {
        mockUpsert.mockClear();

        // Step 1: Generate unsubscribe token
        const token = service.generateUnsubscribeToken(userId);
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);

        // Step 2: Decode the token and verify claims
        const decoded = jwtService.verify<{ sub: string; purpose: string }>(token);
        expect(decoded.sub).toBe(userId);
        expect(decoded.purpose).toBe('email-unsubscribe');

        // Step 3: Call unsubscribeMarketing and verify Prisma upsert
        await service.unsubscribeMarketing(token);

        expect(mockUpsert).toHaveBeenCalledTimes(1);
        const upsertArgs = mockUpsert.mock.calls[0][0];
        expect(upsertArgs.where.user_id).toBe(userId);
        expect(upsertArgs.update.marketing_opted_out).toBe(true);
        expect(upsertArgs.create.marketing_opted_out).toBe(true);
        expect(upsertArgs.create.user_id).toBe(userId);
      }),
      { numRuns: 20 },
    );
  });
});
