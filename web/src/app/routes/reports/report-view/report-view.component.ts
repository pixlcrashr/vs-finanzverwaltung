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
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import { formatDateShort } from '../../../shared/utils';
import { Report } from '../../../shared/models';
import { ReportViewDataService } from './report-view.data-service';

@Component({
  selector: 'app-report-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <div class="flex gap-2">
          <app-button variant="secondary" (clicked)="goBack()">
            Zurück zur Liste
          </app-button>
          <app-button
            variant="primary"
            [disabled]="downloading()"
            (clicked)="downloadPdf()"
          >
            {{ downloading() ? 'Wird heruntergeladen...' : 'Als PDF herunterladen' }}
          </app-button>
        </div>
      </app-page-header>

      <div class="flex-1 overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Bericht wird geladen..." />
        } @else if (report()) {
          <div class="max-w-4xl mx-auto">
            <!-- Report Header -->
            <div class="mb-4 pb-4 border-b border-gray-200">
              <h1 class="text-xl font-bold text-gray-900">
                {{ report()!.name }}
              </h1>
              <p class="text-xs text-gray-500 mt-1">
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
    </div>
  `,
})
export class ReportViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(ReportViewDataService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly reportContent = viewChild<ElementRef>('reportContent');

  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly report = signal<Report | null>(null);
  readonly htmlContent = signal<SafeHtml>('');

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Berichte', path: '/reports' },
    { label: 'Ansehen' },
  ];

  private reportId = '';

  ngOnInit(): void {
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
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/reports']);
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
        this.downloading.set(false);
      },
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
