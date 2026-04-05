import { Routes } from '@angular/router';
import { ReportTemplateListDataService } from './report-template-list/report-template-list.data-service';
import { ReportTemplateNewDataService } from './report-template-new/report-template-new.data-service';
import { ReportTemplateEditDataService } from './report-template-edit/report-template-edit.data-service';
import { environment } from '../../../environments/environment';

export const REPORT_TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./report-template-list/report-template-list.component').then(
        (m) => m.ReportTemplateListComponent
      ),
    providers: [{ provide: ReportTemplateListDataService, useClass: environment.dataServices.reportTemplateList }],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./report-template-new/report-template-new.component').then(
        (m) => m.ReportTemplateNewComponent
      ),
    providers: [{ provide: ReportTemplateNewDataService, useClass: environment.dataServices.reportTemplateNew }],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./report-template-edit/report-template-edit.component').then(
        (m) => m.ReportTemplateEditComponent
      ),
    providers: [{ provide: ReportTemplateEditDataService, useClass: environment.dataServices.reportTemplateEdit }],
  },
];
