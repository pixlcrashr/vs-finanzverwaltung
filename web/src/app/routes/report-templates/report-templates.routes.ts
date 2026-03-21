import { Routes } from '@angular/router';
import { ReportTemplateListDataService } from './report-template-list/report-template-list.data-service';
import { MockReportTemplateListDataService } from '../../../lib/data/mock/report-template-list.data-service.mock';
import { ReportTemplateNewDataService } from './report-template-new/report-template-new.data-service';
import { MockReportTemplateNewDataService } from '../../../lib/data/mock/report-template-new.data-service.mock';
import { ReportTemplateEditDataService } from './report-template-edit/report-template-edit.data-service';
import { MockReportTemplateEditDataService } from '../../../lib/data/mock/report-template-edit.data-service.mock';

export const REPORT_TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./report-template-list/report-template-list.component').then(
        (m) => m.ReportTemplateListComponent
      ),
    providers: [{ provide: ReportTemplateListDataService, useClass: MockReportTemplateListDataService }],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./report-template-new/report-template-new.component').then(
        (m) => m.ReportTemplateNewComponent
      ),
    providers: [{ provide: ReportTemplateNewDataService, useClass: MockReportTemplateNewDataService }],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./report-template-edit/report-template-edit.component').then(
        (m) => m.ReportTemplateEditComponent
      ),
    providers: [{ provide: ReportTemplateEditDataService, useClass: MockReportTemplateEditDataService }],
  },
];
