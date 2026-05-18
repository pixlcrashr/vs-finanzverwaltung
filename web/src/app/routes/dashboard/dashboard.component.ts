import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  ElementRef,
  viewChild,
  effect,
  AfterViewInit,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../shared/components';
import { DashboardDataService, DashboardStats } from './dashboard.data-service';

Chart.register(...registerables);

const CHART_COLORS = [
  '#3e8ed0',
  '#48c78e',
  '#f14668',
  '#ffdd57',
  '#7957d5',
  '#00d1b2',
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
];

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageContentLayoutComponent, LoadingSpinnerComponent],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-content>
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Dashboard wird geladen..." />
        } @else if (stats()) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Budgets Chart -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h3 i18n class="text-lg font-medium text-gray-900 mb-1">
                Haushaltspläne
              </h3>
              <p i18n class="text-sm text-gray-500 mb-4">
                Gesamt: {{ stats()!.budgets.total }}
              </p>
              <div class="h-64">
                <canvas #budgetsChart></canvas>
              </div>
            </div>

            <!-- Accounts Chart -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h3 i18n class="text-lg font-medium text-gray-900 mb-1">
                Haushaltskonten
              </h3>
              <p i18n class="text-sm text-gray-500 mb-4">
                Gesamt: {{ stats()!.accounts.total }}
              </p>
              <div class="h-64">
                <canvas #accountsChart></canvas>
              </div>
            </div>

            <!-- Monthly Transactions Line Chart -->
            @if (stats()!.rootAccountMonthly.length > 0) {
              <div class="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                <h3 i18n class="text-lg font-medium text-gray-900 mb-4">
                  Buchungen der letzten 12 Monate
                </h3>
                <div class="h-80">
                  <canvas #monthlyChart></canvas>
                </div>
              </div>
            }

            <!-- Quick Stats -->
            <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-white rounded-lg border border-gray-200 p-6">
                <p i18n class="text-sm text-gray-500">Transaktionen gesamt</p>
                <p class="text-2xl font-semibold text-gray-900">
                  {{ stats()!.transactions.total }}
                </p>
              </div>
              <div class="bg-white rounded-lg border border-gray-200 p-6">
                <p i18n class="text-sm text-gray-500">Zugeordnet</p>
                <p class="text-2xl font-semibold text-green-600">
                  {{ stats()!.transactions.assigned }}
                </p>
              </div>
              <div class="bg-white rounded-lg border border-gray-200 p-6">
                <p i18n class="text-sm text-gray-500">Nicht zugeordnet</p>
                <p class="text-2xl font-semibold text-red-600">
                  {{ stats()!.transactions.unassigned }}
                </p>
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly dataService = inject(DashboardDataService);
  private readonly notifications = inject(NotificationService);

  readonly budgetsChartRef = viewChild<ElementRef<HTMLCanvasElement>>('budgetsChart');
  readonly accountsChartRef = viewChild<ElementRef<HTMLCanvasElement>>('accountsChart');
  readonly monthlyChartRef = viewChild<ElementRef<HTMLCanvasElement>>('monthlyChart');

  readonly loading = signal(true);
  readonly stats = signal<DashboardStats | null>(null);

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: $localize`Dashboard` }];

  private budgetsChart: Chart | null = null;
  private accountsChart: Chart | null = null;
  private monthlyChart: Chart | null = null;

  constructor() {
    effect(() => {
      const data = this.stats();
      if (data && !this.loading()) {
        // Charts will be created in ngAfterViewInit after view is ready
        setTimeout(() => this.createCharts(data), 0);
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    const data = this.stats();
    if (data) {
      this.createCharts(data);
    }
  }

  private loadData(): void {
    this.dataService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden des Dashboards`);
        this.loading.set(false);
      },
    });
  }

  private createCharts(data: DashboardStats): void {
    this.createBudgetsChart(data);
    this.createAccountsChart(data);
    this.createMonthlyChart(data);
  }

  private createBudgetsChart(data: DashboardStats): void {
    const canvas = this.budgetsChartRef()?.nativeElement;
    if (!canvas) return;

    this.budgetsChart?.destroy();

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: [$localize`Offen`, $localize`Geschlossen`],
        datasets: [
          {
            data: [data.budgets.open, data.budgets.closed],
            backgroundColor: ['#48c78e', '#f14668'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    };

    this.budgetsChart = new Chart(canvas, config);
  }

  private createAccountsChart(data: DashboardStats): void {
    const canvas = this.accountsChartRef()?.nativeElement;
    if (!canvas) return;

    this.accountsChart?.destroy();

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: [$localize`Aktiv`, $localize`Archiviert`],
        datasets: [
          {
            data: [data.accounts.active, data.accounts.archived],
            backgroundColor: ['#3e8ed0', '#b5b5b5'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    };

    this.accountsChart = new Chart(canvas, config);
  }

  private createMonthlyChart(data: DashboardStats): void {
    const canvas = this.monthlyChartRef()?.nativeElement;
    if (!canvas || data.rootAccountMonthly.length === 0) return;

    this.monthlyChart?.destroy();

    const labels = data.rootAccountMonthly[0]?.months.map((m) => m.label) ?? [];

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: data.rootAccountMonthly.map((account, index) => ({
          label: `${account.accountCode} - ${account.accountName}`,
          data: account.months.map((m) => m.value),
          borderColor: CHART_COLORS[index % CHART_COLORS.length],
          backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}40`,
          fill: false,
          tension: 0.25,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };

    this.monthlyChart = new Chart(canvas, config);
  }
}
