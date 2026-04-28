import { Body, Controller, Post } from '@nestjs/common';
import { JoinLaunchWaitlistDto } from './dto/join-launch-waitlist.dto';
import { LaunchWaitlistService } from './launch-waitlist.service';

@Controller('launch-waitlist')
export class LaunchWaitlistController {
  constructor(private readonly launchWaitlistService: LaunchWaitlistService) {}

  @Post()
  async join(@Body() dto: JoinLaunchWaitlistDto) {
    return this.launchWaitlistService.join(dto);
  }
}
