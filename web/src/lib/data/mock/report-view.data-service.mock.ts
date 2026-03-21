import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import {
  ReportViewDataService,
  ReportContent,
} from '../../../app/routes/reports/report-view/report-view.data-service';

@Injectable()
export class MockReportViewDataService extends ReportViewDataService {
  getReport(id: string): Observable<ReportContent> {
    const report = {
      id,
      name: 'Haushaltsbericht Februar 2026',
      createdAt: faker.date.recent({ days: 7 }),
      templateId: 'tpl-1',
      templateName: 'Haushaltsbericht',
    };

    const htmlContent = this.generateMockReportHtml();

    return of({ report, htmlContent }).pipe(delay(400));
  }

  downloadPdf(id: string): Observable<Blob> {
    // Create a simple PDF-like blob for mock purposes
    const content = 'Mock PDF content for report ' + id;
    const blob = new Blob([content], { type: 'application/pdf' });
    return of(blob).pipe(delay(500));
  }

  private generateMockReportHtml(): string {
    const accounts = [
      { code: '1100', name: 'Bank', budget: 50000, actual: 48234.56 },
      { code: '1200', name: 'Kasse', budget: 5000, actual: 3421.00 },
      { code: '2100', name: 'Personalkosten', budget: 30000, actual: 28500.00 },
      { code: '2200', name: 'Sachmittel', budget: 10000, actual: 7823.45 },
      { code: '2300', name: 'Veranstaltungen', budget: 15000, actual: 12456.78 },
      { code: '3100', name: 'Mitgliedsbeiträge', budget: 25000, actual: 24500.00 },
      { code: '3200', name: 'Zuschüsse', budget: 40000, actual: 38000.00 },
    ];

    const formatCurrency = (num: number) =>
      new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(num);

    const rows = accounts
      .map(
        (a) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${a.code}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${a.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(a.budget)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(a.actual)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${a.actual <= a.budget ? '#059669' : '#dc2626'}">
            ${formatCurrency(a.budget - a.actual)}
          </td>
        </tr>
      `
      )
      .join('');

    const totalBudget = accounts.reduce((sum, a) => sum + a.budget, 0);
    const totalActual = accounts.reduce((sum, a) => sum + a.actual, 0);

    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Haushaltsbericht</h1>
        <p style="color: #6b7280; margin-bottom: 24px;">Erstellt am ${new Date().toLocaleDateString('de-DE')}</p>

        <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Kontenübersicht</h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Konto</th>
              <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Bezeichnung</th>
              <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Budget</th>
              <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Ist</th>
              <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Differenz</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="font-weight: 600; background-color: #f9fafb;">
              <td colspan="2" style="padding: 12px 8px;">Gesamt</td>
              <td style="padding: 12px 8px; text-align: right;">${formatCurrency(totalBudget)}</td>
              <td style="padding: 12px 8px; text-align: right;">${formatCurrency(totalActual)}</td>
              <td style="padding: 12px 8px; text-align: right; color: ${totalActual <= totalBudget ? '#059669' : '#dc2626'}">
                ${formatCurrency(totalBudget - totalActual)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>Dieser Bericht wurde automatisch generiert.</p>
        </div>
      </div>
    `;
  }
}
