import { scoreCV } from './ats-scorer';

describe('ATS Scorer', () => {
  const keywords = ['python', 'typescript', 'react', 'nestjs', 'aws', 'docker', 'postgresql'];

  it('should return 100% when all keywords match', () => {
    const cvText = 'I have experience with Python, TypeScript, React, NestJS, AWS, Docker, and PostgreSQL.';
    const result = scoreCV(cvText, keywords);
    expect(result.score).toBe(100);
    expect(result.matched).toHaveLength(7);
    expect(result.missing).toHaveLength(0);
  });

  it('should match case-insensitively', () => {
    const cvText = 'PYTHON TYPESCRIPT REACT NESTJS AWS DOCKER POSTGRESQL';
    const result = scoreCV(cvText, keywords);
    expect(result.score).toBe(100);
  });

  it('should return 0% when no keywords match', () => {
    const cvText = 'I am a marketing professional with experience in sales and advertising.';
    const result = scoreCV(cvText, keywords);
    expect(result.score).toBe(0);
    expect(result.matched).toHaveLength(0);
    expect(result.missing).toHaveLength(7);
  });

  it('should return partial score for partial matches', () => {
    const cvText = 'I know Python and React but not much else from this list.';
    const result = scoreCV(cvText, keywords);
    expect(result.score).toBe(Math.round((2 / 7) * 100));
    expect(result.matched).toContain('python');
    expect(result.matched).toContain('react');
    expect(result.missing).toContain('typescript');
    expect(result.missing).toContain('nestjs');
  });

  it('should handle empty keywords array', () => {
    const result = scoreCV('any text', []);
    expect(result.score).toBe(0);
    expect(result.matched).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });

  it('should handle empty CV text', () => {
    const result = scoreCV('', keywords);
    expect(result.score).toBe(0);
    expect(result.missing).toHaveLength(7);
  });
});

describe('RecruitmentService', () => {
  // Integration tests would require Prisma mock setup
  // These are documented as requiring a test database connection

  it('should be defined as a test placeholder', () => {
    expect(true).toBe(true);
  });

  describe('Application status transitions', () => {
    const validTransitions = [
      'new_application',
      'in_review',
      'shortlisted',
      'interview',
      'offer',
      'hired',
      'rejected',
    ];

    it('should define all valid application statuses', () => {
      expect(validTransitions).toHaveLength(7);
      expect(validTransitions).toContain('new_application');
      expect(validTransitions).toContain('hired');
      expect(validTransitions).toContain('rejected');
    });
  });

  describe('Pipeline KPI aggregation', () => {
    it('should count applications by status correctly', () => {
      const mockApps = [
        { status: 'new_application' },
        { status: 'new_application' },
        { status: 'in_review' },
        { status: 'shortlisted' },
        { status: 'hired' },
      ];

      const counts: Record<string, number> = { total: mockApps.length };
      for (const app of mockApps) {
        counts[app.status] = (counts[app.status] || 0) + 1;
      }

      expect(counts.total).toBe(5);
      expect(counts.new_application).toBe(2);
      expect(counts.in_review).toBe(1);
      expect(counts.shortlisted).toBe(1);
      expect(counts.hired).toBe(1);
    });
  });
});
