import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { Dropbox } from 'dropbox';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService } from 'src/users/users.service';
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
    console.log('Statistics:', statistics);
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
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const htmlContent = this.generateHtml(statistics, user, query);

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const userDocumentsPath = path.join('D:', 'statistics');

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
    if (!statistics || statistics.length === 0) {
      return `
        <html>
          <body>
            <h1>There are no statistics for the selected period.</h1>
          </body>
        </html>
      `;
    }

    const labels = statistics.map(({ date }) => date);

    const datasets = statistics[0]?.actions.map(({ entityType }) => ({
      label: entityType,
      data: statistics.map(
        ({ actions }) =>
          actions.find((action) => action.entityType === entityType)?.count ||
          0,
      ),
      borderWidth: 2,
      fill: false,
    }));

    const rows = statistics
      .map(
        ({ date, actions }) => `
          <tr>
            <td>${date}</td>
            <td>
              ${actions
                .map(
                  ({ action, entityType, count }) =>
                    `<div>${action} (${entityType}): ${count}</div>`,
                )
                .join('')}
            </td>
          </tr>`,
      )
      .join('');

    // console.log('Statistics:', JSON.stringify(statistics, null, 2));
    // console.log('Labels Data:', labels);

    return `
      <html>
        <head>
          <style>
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
            }
            th {
              background-color: #f2f2f2;
            }
            canvas {
              display: block;
              margin: 20px auto;
            }
          </style>
        </head>
        <body>
          <h1>User Statistics</h1>
          <div>
            <h2>User Info:</h2>
            <p><strong>Name:</strong> ${user?.name}</p>
            <p><strong>Email:</strong> ${user?.email}</p>
            <p><strong>Followers:</strong> 
            ${user?.followers.length > 0 ? user?.followers.length : 'No followers'}</p>
            <p><strong>Following:</strong> 
            ${user?.followings.length > 0 ? user?.followings.length : 'No followings'}</p>
            <h2>Statistics Data:</h2>
            <p><strong>Period:</strong> ${query.startDate} to ${query.endDate}</p>
            <p><strong>Interval:</strong> ${query.interval}</p>
          </div>
          <canvas id="statisticsChart" width="800" height="400"></canvas>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const ctx = document.getElementById('statisticsChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ${JSON.stringify(labels)},
      datasets: ${JSON.stringify(datasets)},
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: 'User Statistics by Entity Type',
        },
      },
      scales: {
        x: { title: { display: true, text: 'Date' }},
        y: { title: { display: true, text: 'Actions Count' },  min: 0,},
      },
    },
  });
</script>
        </body>
      </html>
    `;
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
