import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  ElementRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../../shared/components';
import { formatDateShort } from '../../../shared/utils';
import { Report } from '../../../shared/models';
import { ReportViewDataService } from './report-view.data-service';

@Component({
  selector: 'app-report-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageContentLayoutComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-header-actions class="flex gap-2">
          <app-button variant="secondary" (clicked)="goBack()">
            <ng-container i18n>Zurück zur Liste</ng-container>
          </app-button>
          <app-button
            variant="primary"
            [disabled]="downloading()"
            (clicked)="downloadPdf()"
          >
            <ng-container i18n>{{ downloading() ? 'Wird heruntergeladen...' : 'Als PDF herunterladen' }}</ng-container>
          </app-button>
      </div>

      <div layout-content>
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Bericht wird geladen..." />
        } @else if (report()) {
          <div class="max-w-4xl mx-auto">
            <!-- Report Header -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <h1 class="text-xl font-bold text-gray-900">
                {{ report()!.name }}
              </h1>
              <p i18n class="text-xs text-gray-500 mt-1">
                {{ report()!.templateName }} · Erstellt am {{ formatDate(report()!.createdAt) }}
              </p>
            </div>

            <!-- Report Content -->
            <div
              #reportContent
              class="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
              [innerHTML]="htmlContent()"
            ></div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class ReportViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(ReportViewDataService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly notifications = inject(NotificationService);

  readonly reportContent = viewChild<ElementRef>('reportContent');

  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly report = signal<Report | null>(null);
  readonly htmlContent = signal<SafeHtml>('');

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: $localize`Berichte`, path: '' },
    { label: $localize`Ansehen` },
  ];

  private reportId = '';
  private orgId = '';

  private getOrgId(): string {
    let snapshot = this.route.snapshot;
    while (snapshot) {
      const id = snapshot.paramMap.get('orgId');
      if (id) return id;
      snapshot = snapshot.parent!;
    }
    return '';
  }

  ngOnInit(): void {
    this.orgId = this.getOrgId();
    this.breadcrumbs[0].path = `/organizations/${this.orgId}/reports`;
    this.reportId = this.route.snapshot.paramMap.get('id') || '';
    if (this.reportId) {
      this.loadReport();
    }
  }

  private loadReport(): void {
    this.dataService.getReport(this.reportId).subscribe({
      next: ({ report, htmlContent }) => {
        this.report.set(report);
        this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(htmlContent));
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden des Berichts`);
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/organizations', this.orgId, 'reports']);
  }

  downloadPdf(): void {
    this.downloading.set(true);
    this.dataService.downloadPdf(this.reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.report()?.name || 'bericht'}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Herunterladen des Berichts`);
        this.downloading.set(false);
      },
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
