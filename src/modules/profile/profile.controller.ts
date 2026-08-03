import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Profile')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: CurrentVisitor) {
    return this.profileService.getProfile(user.eventsId, user.guestsId);
  }

  @Patch()
  updateProfile(@CurrentUser() user: CurrentVisitor, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.eventsId, user.guestsId, dto);
  }
}
