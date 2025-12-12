import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityFilterDto } from './dto/activity-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Activities')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({ status: 201, description: 'Activity created' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get activities timeline' })
  @ApiResponse({ status: 200, description: 'List of activities' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() filter: ActivityFilterDto,
  ) {
    return this.activitiesService.findAll(user.userId, filter);
  }
}
