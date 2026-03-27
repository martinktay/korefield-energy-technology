import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';

const mockPrisma = {
  track: { findMany: jest.fn(), findUnique: jest.fn() },
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('ContentService', () => {
  let service: ContentService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
  });

  // ── GET /content/tracks (catalog) ──────────────────────────────

  describe('getTrackCatalog', () => {
    const dbTracks = [
      {
        id: 'TRK-001',
        name: 'AI Engineering and Intelligent Systems',
        description: 'AI track',
        status: 'available',
        estimated_duration: '6 months',
        levels: [
          { id: 'LVL-001', tier: 'Beginner', sequence: 1 },
          { id: 'LVL-002', tier: 'Intermediate', sequence: 2 },
          { id: 'LVL-003', tier: 'Advanced', sequence: 3 },
        ],
      },
      {
        id: 'TRK-002',
        name: 'Cybersecurity and AI Security',
        description: 'Security track',
        status: 'waitlisted',
        estimated_duration: '6 months',
        levels: [
          { id: 'LVL-004', tier: 'Beginner', sequence: 1 },
        ],
      },
    ];

    it('should return catalog from cache when available', async () => {
      const cached = [{ id: 'TRK-cached' }];
      mockCache.get.mockResolvedValue(cached);

      const result = await service.getTrackCatalog();

      expect(result).toBe(cached);
      expect(mockPrisma.track.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache when cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.track.findMany.mockResolvedValue(dbTracks);

      const result = await service.getTrackCatalog() as any[];

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('TRK-001');
      expect(result[0].name).toBe('AI Engineering and Intelligent Systems');
      expect(result[0].status).toBe('available');
      expect(result[0].levels).toHaveLength(3);
      expect(result[1].status).toBe('waitlisted');

      // Verify cache was set with 15 min TTL
      expect(mockCache.set).toHaveBeenCalledWith(
        'catalog:tracks',
        expect.any(Array),
        900,
      );
    });

    it('should distinguish available and waitlisted tracks', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.track.findMany.mockResolvedValue(dbTracks);

      const result = await service.getTrackCatalog() as any[];

      const available = result.filter((t: any) => t.status === 'available');
      const waitlisted = result.filter((t: any) => t.status === 'waitlisted');
      expect(available).toHaveLength(1);
      expect(waitlisted).toHaveLength(1);
    });
  });

  // ── GET /content/tracks/:trackId (detail) ──────────────────────

  describe('getTrackDetail', () => {
    const dbTrack = {
      id: 'TRK-001',
      name: 'AI Engineering and Intelligent Systems',
      description: 'Full AI engineering pathway',
      status: 'available',
      estimated_duration: '6 months',
      levels: [
        {
          id: 'LVL-001',
          tier: 'Beginner',
          sequence: 1,
          modules: [
            { id: 'MOD-001', title: 'Python for AI', sequence: 1, published: true },
            { id: 'MOD-002', title: 'REST APIs', sequence: 2, published: true },
          ],
        },
        {
          id: 'LVL-002',
          tier: 'Intermediate',
          sequence: 2,
          modules: [
            { id: 'MOD-003', title: 'RAG Pipelines', sequence: 1, published: true },
          ],
        },
        {
          id: 'LVL-003',
          tier: 'Advanced',
          sequence: 3,
          modules: [
            { id: 'MOD-004', title: 'Multi-Agent Systems', sequence: 1, published: false },
          ],
        },
      ],
    };

    it('should return detail from cache when available', async () => {
      const cached = { id: 'TRK-cached' };
      mockCache.get.mockResolvedValue(cached);

      const result = await service.getTrackDetail('TRK-001');

      expect(result).toBe(cached);
      expect(mockPrisma.track.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache when cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.track.findUnique.mockResolvedValue(dbTrack);

      const result = await service.getTrackDetail('TRK-001') as any;

      expect(result.id).toBe('TRK-001');
      expect(result.name).toBe('AI Engineering and Intelligent Systems');
      expect(result.prerequisites).toContain('Foundation School completion required');
      expect(result.certification_outcomes).toHaveLength(2);
      expect(result.curriculum).toHaveLength(3);
      expect(result.curriculum[0].tier).toBe('Beginner');
      expect(result.curriculum[0].modules).toHaveLength(2);

      // Verify cache was set with 15 min TTL
      expect(mockCache.set).toHaveBeenCalledWith(
        'track:TRK-001:detail',
        expect.any(Object),
        900,
      );
    });

    it('should throw NotFoundException when track does not exist', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.track.findUnique.mockResolvedValue(null);

      await expect(
        service.getTrackDetail('TRK-missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include curriculum outline with modules per level', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.track.findUnique.mockResolvedValue(dbTrack);

      const result = await service.getTrackDetail('TRK-001') as any;

      const beginner = result.curriculum.find((l: any) => l.tier === 'Beginner');
      expect(beginner.modules).toEqual([
        { id: 'MOD-001', title: 'Python for AI', sequence: 1, published: true },
        { id: 'MOD-002', title: 'REST APIs', sequence: 2, published: true },
      ]);
    });
  });
});
