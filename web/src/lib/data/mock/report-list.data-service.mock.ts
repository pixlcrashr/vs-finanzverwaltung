import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Report, ReportTemplate } from '../../../app/shared/models';
import { ReportListDataService } from '../../../app/routes/reports/report-list/report-list.data-service';

@Injectable()
export class MockReportListDataService extends ReportListDataService {
  private reports: Report[] = this.generateReports();
  private templates: ReportTemplate[] = this.generateTemplates();

  getReports(): Observable<Report[]> {
    return of([...this.reports]).pipe(delay(300));
  }

  getTemplates(): Observable<ReportTemplate[]> {
    return of([...this.templates]).pipe(delay(200));
  }

  generateReport(templateId: string, name: string): Observable<Report> {
    const template = this.templates.find((t) => t.id === templateId);
    const report: Report = {
      id: faker.string.uuid(),
      name,
      createdAt: new Date(),
      templateId,
      templateName: template?.name || 'Unbekannte Vorlage',
    };
    this.reports.unshift(report);
    return of(report).pipe(delay(500));
  }

  deleteReport(id: string): Observable<void> {
    this.reports = this.reports.filter((r) => r.id !== id);
    return of(undefined).pipe(delay(300));
  }

  private generateReports(): Report[] {
    const templates = [
      { id: 'tpl-1', name: 'Haushaltsbericht' },
      { id: 'tpl-2', name: 'Kassenabschluss' },
      { id: 'tpl-3', name: 'Kontenübersicht' },
    ];

    return Array.from({ length: 15 }, () => {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const date = faker.date.recent({ days: 90 });
      return {
        id: faker.string.uuid(),
        name: `${template.name} ${date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`,
        createdAt: date,
        templateId: template.id,
        templateName: template.name,
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private generateTemplates(): ReportTemplate[] {
    return [
      {
        id: 'tpl-1',
        name: 'Haushaltsbericht',
        description: 'Vollständiger Haushaltsbericht mit allen Konten und Buchungen',
        template: '<h1>Haushaltsbericht</h1>',
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 }),
      },
      {
        id: 'tpl-2',
        name: 'Kassenabschluss',
        description: 'Kassenabschluss für die Prüfung',
        template: '<h1>Kassenabschluss</h1>',
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 60 }),
      },
      {
        id: 'tpl-3',
        name: 'Kontenübersicht',
        description: 'Übersicht aller Konten mit Salden',
        template: '<h1>Kontenübersicht</h1>',
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 45 }),
      },
    ];
  }
}
