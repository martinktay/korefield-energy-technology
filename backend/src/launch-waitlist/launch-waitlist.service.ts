import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { generateId } from '@common/utils/generate-id';
import { JoinLaunchWaitlistDto } from './dto/join-launch-waitlist.dto';

interface LaunchWaitlistRow {
  id: string;
  email: string;
  full_name: string | null;
  organization: string | null;
  role: string | null;
  area_of_interest: string | null;
  created_at: Date;
}

@Injectable()
export class LaunchWaitlistService {
  private readonly logger = new Logger(LaunchWaitlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  async join(dto: JoinLaunchWaitlistDto) {
    if (dto.website) {
      return {
        status: 'joined',
        message: 'You are on the KoreField Academy waitlist.',
      };
    }

    const waitlistId = generateId('LWT');
    const email = dto.email.toLowerCase();
    const source = dto.source || 'korefield-academy-coming-soon';
    const areaOfInterest = dto.area_of_interest || 'KoreField Academy';

    const rows = await this.prisma.$queryRaw<LaunchWaitlistRow[]>`
      INSERT INTO launch_waitlist_entries (
        id,
        email,
        full_name,
        organization,
        role,
        area_of_interest,
        source
      )
      VALUES (
        ${waitlistId},
        ${email},
        ${dto.full_name || null},
        ${dto.organization || null},
        ${dto.role || null},
        ${areaOfInterest},
        ${source}
      )
      ON CONFLICT (email) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, launch_waitlist_entries.full_name),
        organization = COALESCE(EXCLUDED.organization, launch_waitlist_entries.organization),
        role = COALESCE(EXCLUDED.role, launch_waitlist_entries.role),
        area_of_interest = EXCLUDED.area_of_interest,
        source = EXCLUDED.source,
        updated_at = NOW()
      RETURNING id, email, full_name, organization, role, area_of_interest, created_at
    `;

    const entry = rows[0];
    this.logger.log(`Launch waitlist signup: ${entry.email}`);

    return {
      status: 'joined',
      message: 'You are on the KoreField Academy waitlist.',
      entry: {
        id: entry.id,
        email: entry.email,
        full_name: entry.full_name,
        organization: entry.organization,
        role: entry.role,
        area_of_interest: entry.area_of_interest,
        joined_at: entry.created_at,
      },
    };
  }
}
