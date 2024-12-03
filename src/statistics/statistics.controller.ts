import { Body, Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  async getStatistics(
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('entityTypes') entityTypes: string[],
    @Query('interval') interval: string,
  ) {
    return this.statisticsService.getStatistics({
      userId: userId ? parseInt(userId) : null,
      startDate,
      endDate,
      entityTypes: entityTypes,
      interval: interval || 'total',
    });
  }
}
