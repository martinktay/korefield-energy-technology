import {
  generateId,
  generateCertVerificationCode,
  ENTITY_PREFIXES,
  EntityPrefix,
} from './generate-id';

describe('generateId', () => {
  it.each(ENTITY_PREFIXES)(
    'produces an ID matching {PREFIX}-{6-char hex} format for prefix "%s"',
    (prefix: EntityPrefix) => {
      const id = generateId(prefix);
      const regex = new RegExp(`^${prefix}-[0-9a-f]{6}$`);
      expect(id).toMatch(regex);
    },
  );

  it('generates unique IDs across multiple invocations', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId('USR')));
    expect(ids.size).toBe(100);
  });

  it('generates unique IDs across different prefixes', () => {
    const ids = ENTITY_PREFIXES.map((p) => generateId(p));
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ENTITY_PREFIXES.length);
  });
});

describe('generateCertVerificationCode', () => {
  it('produces a code matching KFCERT-{YEAR}-{8-char alphanumeric} format', () => {
    const code = generateCertVerificationCode(2026);
    expect(code).toMatch(/^KFCERT-2026-[A-Z0-9]{8}$/);
  });

  it('defaults to the current year when no year is provided', () => {
    const currentYear = new Date().getFullYear();
    const code = generateCertVerificationCode();
    expect(code).toMatch(new RegExp(`^KFCERT-${currentYear}-[A-Z0-9]{8}$`));
  });

  it('generates unique verification codes across multiple invocations', () => {
    const codes = new Set(
      Array.from({ length: 100 }, () => generateCertVerificationCode(2026)),
    );
    expect(codes.size).toBe(100);
  });
});

describe('ENTITY_PREFIXES', () => {
  it('contains all 37 required prefixes', () => {
    const expected = [
      'USR', 'LRN', 'TRK', 'LVL', 'MOD', 'LSN', 'ASM', 'LAB',
      'ENR', 'POD', 'PDM', 'WTL', 'FND', 'PGT', 'GTA', 'PAY',
      'IST', 'PRC', 'CMP', 'SCH', 'CPS', 'DEF', 'CRT', 'CEL',
      'SUB', 'CEX', 'CVR', 'AWE', 'AQR', 'PMV', 'DRS', 'SES',
      'ROL', 'CBN', 'EML', 'EPR', 'FIL',
    ];
    expect([...ENTITY_PREFIXES]).toEqual(expect.arrayContaining(expected));
    expect(ENTITY_PREFIXES.length).toBe(expected.length);
  });
});
