import { Module } from '@nestjs/common';
import { LaunchWaitlistController } from './launch-waitlist.controller';
import { LaunchWaitlistService } from './launch-waitlist.service';

@Module({
  controllers: [LaunchWaitlistController],
  providers: [LaunchWaitlistService],
})
export class LaunchWaitlistModule {}
