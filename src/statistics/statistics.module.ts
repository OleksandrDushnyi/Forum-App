import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
  imports: [UsersModule],
})
export class StatisticsModule {}
