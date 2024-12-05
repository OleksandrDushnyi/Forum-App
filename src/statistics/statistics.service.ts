import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { Dropbox } from 'dropbox';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService } from 'src/users/users.service';
import * as mustache from 'mustache';
import { log } from 'console';
@Injectable()
export class StatisticsService {
  private prisma = new PrismaClient();

  constructor(private readonly usersService: UsersService) {}

  private dropbox = new Dropbox({
    accessToken: `${process.env.DROPBOX_ACCESS_TOKEN}`,
  });

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

  async exportStatisticsToPdfAndUploadToDropbox(query: {
    userId: number | null;
    startDate: string;
    endDate: string;
    entityTypes: string[] | string;
    interval: string;
  }) {
    const statistics = await this.getStatistics(query);
    const user = await this.usersService.findUserInformation(query.userId);

    const pdfPath = await this.generatePdfWithPuppeteer(
      statistics,
      user,
      query,
    );

    const dropboxLink = await this.uploadToDropbox(pdfPath);

    fs.unlinkSync(pdfPath);

    return { message: 'PDF uploaded to Dropbox', link: dropboxLink };
  }

  private async generatePdfWithPuppeteer(
    statistics: any[],
    user: any,
    query: any,
  ): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,

      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const htmlContent = this.generateHtml(statistics, user, query);

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#statisticsChart');
    const userDocumentsPath = path.join(process.cwd(), 'statistics');

    if (!fs.existsSync(userDocumentsPath)) {
      fs.mkdirSync(userDocumentsPath, { recursive: true });
    }

    const timestamp = Date.now();
    const pdfPath = path.join(
      userDocumentsPath,
      `/statistics_${timestamp}.pdf`,
    );
    await page.pdf({ path: pdfPath, format: 'A4' });

    await browser.close();

    return pdfPath;
  }

  private generateHtml(statistics: any[], user: any, query: any): string {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'statistics',
      'templates',
      'statistics.template.html',
    );

    const template = fs.readFileSync(templatePath, 'utf8');

    const labels = statistics.map(({ date }) => date);
    const datasets = statistics[0]?.actions?.map(({ entityType }) => ({
      label: entityType,
      data: statistics.map(
        ({ actions }) =>
          actions.find((action) => action.entityType === entityType)?.count ||
          0,
      ),
      borderWidth: 2,
      fill: false,
    }));

    if (!datasets || datasets.length === 0) {
      console.log('NO datasets', datasets);
    }

    if (!statistics || statistics.length === 0) {
      const noStatsTemplatePath = path.join(
        process.cwd(),
        'src',
        'statistics',
        'templates',
        'no-statistics.template.html',
      );
      return fs.readFileSync(noStatsTemplatePath, 'utf8');
    }

    return mustache.render(template, {
      user,
      query,
      statistics,
      labelsJson: JSON.stringify(labels),
      datasetsJson: JSON.stringify(datasets),
    });
  }

  private async uploadToDropbox(filePath: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    try {
      const response = await this.dropbox.filesUpload({
        path: `/${fileName}`,
        contents: fileContent,
      });
      console.log('Dropbox upload response:', response);

      const sharedLinkResponse =
        await this.dropbox.sharingCreateSharedLinkWithSettings({
          path: response.result.path_display,
        });

      return sharedLinkResponse.result.url.replace('?dl=0', '?dl=1');
    } catch (error) {
      console.error('Dropbox upload error:', error);
    }
  }
}
