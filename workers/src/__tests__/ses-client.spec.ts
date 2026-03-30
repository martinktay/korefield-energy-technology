/** @file ses-client.spec.ts — Unit tests for the SES v2 client wrapper with retry and credential loading. */

import { SesClient, PermanentSesFailure, SesClientConfig } from '../services/ses-client';

// ---------------------------------------------------------------------------
// Mocks — AWS SDK clients
// ---------------------------------------------------------------------------

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-sesv2', () => {
  return {
    SESv2Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    SendEmailCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
  };
});

const mockSmSend = jest.fn();

jest.mock('@aws-sdk/client-secrets-manager', () => {
  return {
    SecretsManagerClient: jest.fn().mockImplementation(() => ({ send: mockSmSend })),
    GetSecretValueCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createClient(overrides: Partial<SesClientConfig> = {}): SesClient {
  return new SesClient({
    senderEmail: 'noreply@korefield.com',
    region: 'eu-west-1',
    ...overrides,
  });
}

function throttleError(): Error {
  const err = new Error('Rate exceeded');
  err.name = 'ThrottlingException';
  return err;
}

function tooManyRequestsError(): Error {
  const err = new Error('Too many requests');
  err.name = 'TooManyRequestsException';
  return err;
}

function permanentError(name: string, message = 'Permanent failure'): Error {
  const err = new Error(message);
  err.name = name;
  return err;
}


// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Requirement 2.1 — SES send returns message ID
// ---------------------------------------------------------------------------

describe('SesClient.send()', () => {
  /**
   * **Validates: Requirements 2.1**
   */
  it('should return the SES message ID on successful send', async () => {
    mockSend.mockResolvedValueOnce({ MessageId: 'ses-msg-001' });
    const client = createClient();

    const messageId = await client.send(
      'learner@example.com',
      'Welcome',
      '<h1>Hi</h1>',
      'Hi',
    );

    expect(messageId).toBe('ses-msg-001');
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('should return empty string when SES response has no MessageId', async () => {
    mockSend.mockResolvedValueOnce({});
    const client = createClient();

    const messageId = await client.send(
      'learner@example.com',
      'Test',
      '<p>Test</p>',
      'Test',
    );

    expect(messageId).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Requirement 2.4 — Retry on throttling with exponential backoff
// ---------------------------------------------------------------------------

describe('SesClient retry on throttling', () => {
  /**
   * **Validates: Requirements 2.4**
   *
   * On ThrottlingException, the client retries up to 3 times (delays 1s, 2s, 4s)
   * before succeeding or exhausting retries.
   */
  it('should retry on ThrottlingException and succeed on second attempt', async () => {
    // Spy on the private delay to avoid real waits
    jest.spyOn(SesClient.prototype as any, 'delay').mockResolvedValue(undefined);

    mockSend
      .mockRejectedValueOnce(throttleError())
      .mockResolvedValueOnce({ MessageId: 'ses-retry-ok' });

    const client = createClient();
    const messageId = await client.send('a@b.com', 'Sub', '<p>H</p>', 'H');

    expect(messageId).toBe('ses-retry-ok');
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('should retry on TooManyRequestsException and succeed on third attempt', async () => {
    jest.spyOn(SesClient.prototype as any, 'delay').mockResolvedValue(undefined);

    mockSend
      .mockRejectedValueOnce(tooManyRequestsError())
      .mockRejectedValueOnce(throttleError())
      .mockResolvedValueOnce({ MessageId: 'ses-retry-3' });

    const client = createClient();
    const messageId = await client.send('a@b.com', 'Sub', '<p>H</p>', 'H');

    expect(messageId).toBe('ses-retry-3');
    expect(mockSend).toHaveBeenCalledTimes(3);
  });

  it('should exhaust all 3 retries and rethrow on persistent throttling', async () => {
    jest.spyOn(SesClient.prototype as any, 'delay').mockResolvedValue(undefined);

    mockSend
      .mockRejectedValueOnce(throttleError())
      .mockRejectedValueOnce(throttleError())
      .mockRejectedValueOnce(throttleError())
      .mockRejectedValueOnce(throttleError());

    const client = createClient();

    await expect(
      client.send('a@b.com', 'Sub', '<p>H</p>', 'H'),
    ).rejects.toThrow('Rate exceeded');

    // 1 initial + 3 retries = 4 total calls
    expect(mockSend).toHaveBeenCalledTimes(4);
  });
});

// ---------------------------------------------------------------------------
// Requirement 2.5 — Permanent failures are not retried
// ---------------------------------------------------------------------------

describe('SesClient permanent failure handling', () => {
  /**
   * **Validates: Requirements 2.5**
   *
   * Permanent SES errors (MessageRejected, MailFromDomainNotVerifiedException,
   * AccountSendingPausedException) throw PermanentSesFailure immediately — no retry.
   */
  it.each([
    ['MessageRejected'],
    ['MailFromDomainNotVerifiedException'],
    ['AccountSendingPausedException'],
  ])('should throw PermanentSesFailure for %s without retrying', async (errorCode) => {
    mockSend.mockRejectedValueOnce(permanentError(errorCode));
    const client = createClient();

    await expect(
      client.send('a@b.com', 'Sub', '<p>H</p>', 'H'),
    ).rejects.toThrow(PermanentSesFailure);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['bounce'],
    ['complaint'],
    ['invalid'],
    ['does not exist'],
    ['not verified'],
  ])('should throw PermanentSesFailure when error message contains "%s"', async (keyword) => {
    const err = new Error(`The address ${keyword} in the system`);
    err.name = 'SomeOtherError';
    mockSend.mockRejectedValueOnce(err);

    const client = createClient();

    await expect(
      client.send('a@b.com', 'Sub', '<p>H</p>', 'H'),
    ).rejects.toThrow(PermanentSesFailure);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('should include the error code on PermanentSesFailure', async () => {
    mockSend.mockRejectedValueOnce(permanentError('MessageRejected', 'Bad recipient'));
    const client = createClient();

    try {
      await client.send('a@b.com', 'Sub', '<p>H</p>', 'H');
      fail('Expected PermanentSesFailure');
    } catch (err) {
      expect(err).toBeInstanceOf(PermanentSesFailure);
      expect((err as PermanentSesFailure).code).toBe('MessageRejected');
      expect((err as PermanentSesFailure).message).toBe('Bad recipient');
    }
  });
});


// ---------------------------------------------------------------------------
// Requirement 2.3 — Credentials loading from Secrets Manager
// ---------------------------------------------------------------------------

describe('SesClient.loadCredentials()', () => {
  /**
   * **Validates: Requirements 2.3**
   *
   * loadCredentials reads from Secrets Manager and caches with TTL.
   * When credentials include accessKeyId/secretAccessKey, the SES client
   * is re-initialised with explicit credentials.
   */
  it('should load credentials from Secrets Manager and re-initialise SES client', async () => {
    const { SESv2Client } = require('@aws-sdk/client-sesv2');

    mockSmSend.mockResolvedValueOnce({
      SecretString: JSON.stringify({
        accessKeyId: 'AKID123',
        secretAccessKey: 'SECRET456',
      }),
    });

    const client = createClient({ secretName: 'prod/ses-credentials' });
    await client.loadCredentials();

    expect(mockSmSend).toHaveBeenCalledTimes(1);
    // SES client re-created: once in constructor + once after credentials load
    expect(SESv2Client).toHaveBeenCalledTimes(2);
    expect(SESv2Client).toHaveBeenLastCalledWith(
      expect.objectContaining({
        region: 'eu-west-1',
        credentials: { accessKeyId: 'AKID123', secretAccessKey: 'SECRET456' },
      }),
    );
  });

  it('should skip Secrets Manager when no secretName is configured', async () => {
    const client = createClient(); // no secretName
    await client.loadCredentials();

    expect(mockSmSend).not.toHaveBeenCalled();
  });

  it('should use cached credentials within TTL', async () => {
    mockSmSend.mockResolvedValue({
      SecretString: JSON.stringify({ accessKeyId: 'AK', secretAccessKey: 'SK' }),
    });

    const client = createClient({
      secretName: 'prod/ses-credentials',
      credentialsTtlMs: 60_000,
    });

    await client.loadCredentials();
    await client.loadCredentials(); // second call within TTL

    expect(mockSmSend).toHaveBeenCalledTimes(1); // only one SM call
  });

  it('should throw when secret has no string value', async () => {
    mockSmSend.mockResolvedValueOnce({ SecretString: undefined });

    const client = createClient({ secretName: 'prod/ses-credentials' });

    await expect(client.loadCredentials()).rejects.toThrow(/no string value/);
  });
});
