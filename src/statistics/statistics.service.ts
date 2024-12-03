import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

@Injectable()
export class StatisticsService {
  private prisma = new PrismaClient();

  async getStatistics(query: {
    userId: number | null;
    startDate: string;
    endDate: string;
    entityTypes: string[] | string;
    interval: string;
  }) {
    const { userId, startDate, endDate, entityTypes, interval } = query;

    const entityTypesArray =
      typeof entityTypes === 'string'
        ? entityTypes.split(',').map((type) => type.trim())
        : entityTypes || [];

    const where = {
      ...(userId ? { userId } : {}),
      ...(startDate && endDate
        ? { timestamp: { gte: new Date(startDate), lte: new Date(endDate) } }
        : {}),
      ...(entityTypesArray.length
        ? { entityType: { in: entityTypesArray } }
        : {}),
    };

    const actions = await this.prisma.userAction.findMany({
      where,
      select: {
        id: true,
        action: true,
        entityType: true,
        timestamp: true,
      },
    });

    const groupedData = this.groupByInterval(actions, interval);

    return groupedData;
  }

  private groupByInterval(
    actions: Array<{
      id: number;
      action: string;
      entityType: string;
      timestamp: Date;
    }>,
    interval: string,
  ) {
    const dateFormatter = {
      daily: (date: Date) => format(date, 'yyyy-MM-dd'),
      weekly: (date: Date) => `Week ${format(date, 'I yyyy')}`,
      monthly: (date: Date) => format(date, 'MMMM yyyy'),
      total: () => 'Total',
    };

    const formatDate = dateFormatter[interval] || dateFormatter['total'];

    const grouped = actions.reduce((acc, action) => {
      const dateKey = formatDate(action.timestamp);

      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }

      const key = `${action.action}-${action.entityType}`;
      acc[dateKey][key] = (acc[dateKey][key] || 0) + 1;

      return acc;
    }, {});

    return Object.entries(grouped).map(([date, actions]) => ({
      date,
      actions: Object.entries(actions).map(([key, count]) => {
        const [action, entityType] = key.split('-');
        return { action, entityType, count };
      }),
    }));
  }

  async logAction(
    action: string,
    userId: number,
    entityType: string,
    entityId: number | null,
    entity: any,
  ) {
    await this.prisma.userAction.create({
      data: {
        action,
        userId,
        entityType,
        entityId,
        entity: entity ? JSON.stringify(entity) : null,
      },
    });
  }
}
