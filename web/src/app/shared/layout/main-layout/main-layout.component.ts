import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MenuItem, Organization } from '../../models';
import { CurrentOrganizationService } from '../../services/current-organization.service';
import { OrganizationDataService } from '../../services/organization.data-service';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, FormsModule],
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .route-container > :not(router-outlet) {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `,
  template: `
    <div class="flex h-full w-full min-h-0 min-w-0 overflow-hidden bg-gray-50 dark:bg-gray-950">
      <!-- Sidebar -->
      <aside class="flex min-h-0 w-52 min-w-52 flex-col bg-gray-900 border-r border-gray-800">
        <!-- Logo -->
        <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
          <img src="/favicon.ico" alt="Logo" class="w-5 h-5" />
          <h1 class="text-xs font-medium text-white">VS-Finanzverwaltung</h1>
        </div>

        <!-- Organization Selector -->
        <div class="px-2 py-2">
          <div class="flex items-center justify-between mb-1">
            <label class="text-[10px] font-semibold uppercase tracking-wider text-gray-500" i18n>Organisation</label>
            @if (loading()) {
              <svg class="w-3 h-3 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            }
          </div>
          <select
            [ngModel]="currentOrganizationId()"
            (ngModelChange)="onOrganizationChange($event)"
            [disabled]="loading() || organizations().length === 0"
            class="w-full px-2 py-1.5 text-xs bg-gray-800 text-white border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (organizations().length === 0) {
              <option value="" i18n>Keine Organisationen</option>
            } @else {
              @for (org of organizations(); track org.id) {
                <option [value]="org.id">{{ org.name }}</option>
              }
            }
          </select>
        </div>

        <!-- Navigation (always show when organizations exist) -->
        @if (organizations().length > 0) {
        <nav class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <ul class="space-y-0.5">
            @for (item of generalMenuItems(); track item.name) {
              <li>
                <a
                  [routerLink]="item.path"
                  [class]="menuItemClasses(item)"
                >
                  {{ item.name }}
                </a>
              </li>
            }
          </ul>

          <div class="mt-4">
            <p i18n class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Rechnungswesen
            </p>
            <ul class="space-y-0.5">
              @for (item of applicationMenuItems(); track item.name) {
                <li>
                  <a [routerLink]="item.path" [class]="menuItemClasses(item)">
                    {{ item.name }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <div class="mt-4">
            <p i18n class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Haushalt
            </p>
            <ul class="space-y-0.5">
              @for (item of householdMenuItems(); track item.name) {
                <li>
                  <a [routerLink]="item.path" [class]="menuItemClasses(item)">
                    {{ item.name }}
                  </a>
                </li>
              }
            </ul>
          </div>
        </nav>
        }

        <!-- Admin Navigation (separate from normal routes) -->
        @if (adminMenuItems().length > 0) {
        <nav class="border-t border-gray-800 px-2 py-2">
          <p i18n class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Administration
          </p>
          <ul class="space-y-0.5">
            @for (item of adminMenuItems(); track item.name) {
              <li>
                <a [routerLink]="item.path" [class]="menuItemClasses(item)">
                  {{ item.name }}
                </a>
              </li>
            }
          </ul>
        </nav>
        }

        <!-- Theme Toggle -->
        <div class="px-2 py-2 border-t border-gray-800">
          <button
            type="button"
            (click)="toggleTheme()"
            class="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            @if (isDarkMode()) {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span i18n>Light Mode</span>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span i18n>Dark Mode</span>
            }
          </button>
        </div>

        <!-- Footer -->
        <footer class="px-2 py-2 border-t border-gray-800">
          <p class="text-[10px] text-center text-gray-500">
            © 2025 Vincent Heins<br />
            <a
              href="https://github.com/pixlcrashr/vsfv"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-white"
            >
              github.com/pixlcrashr/vsfv
            </a>
          </p>
        </footer>
      </aside>

      <!-- Main Content -->
      <main class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div class="route-container min-h-0 flex-1 overflow-hidden">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class MainLayoutComponent implements OnInit {
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly currentOrganizationService = inject(CurrentOrganizationService);
  private readonly organizationDataService = inject(OrganizationDataService);

  readonly isDarkMode = signal(false);
  readonly organizations = signal<Organization[]>([]);
  readonly loading = signal(true);

  readonly currentOrganizationId = signal<string>('');

  // Computed menu items that include the organization ID
  // Prioritizes the currently selected organization, falls back to route orgId
  readonly orgIdFromRoute = computed(() => {
    // First check if we have a selected organization in the service
    const selectedOrgId = this.currentOrganizationService.currentOrganization()?.id;
    if (selectedOrgId) return selectedOrgId;

    // Fall back to route params - check parent routes too
    let route = this.route;
    while (route) {
      const orgId = route.snapshot.paramMap.get('orgId') ?? route.snapshot.paramMap.get('id');
      if (orgId) return orgId;
      route = route.parent!;
    }
    return '';
  });

  // Check if we have an organization selected or are on an org-prefixed route
  readonly hasOrganization = computed(() => {
    return this.currentOrganizationService.hasOrganization() || this.orgIdFromRoute() !== '';
  });

  readonly generalMenuItems = computed<MenuItem[]>(() => {
    const orgId = this.orgIdFromRoute();
    if (!orgId) return [];
    return [{ name: $localize`Dashboard`, path: `/organizations/${orgId}/dashboard` }];
  });

  readonly applicationMenuItems = computed<MenuItem[]>(() => {
    const orgId = this.orgIdFromRoute();
    if (!orgId) return [];
    return [{ name: $localize`Kostenerstattungen`, path: `/organizations/${orgId}/reimbursements` }];
  });

  readonly householdMenuItems = computed<MenuItem[]>(() => {
    const orgId = this.orgIdFromRoute();
    if (!orgId) return [];
    return [
      { name: $localize`Matrix`, path: `/organizations/${orgId}/matrix` },
      { name: $localize`Pläne`, path: `/organizations/${orgId}/budgets` },
      { name: $localize`Konten`, path: `/organizations/${orgId}/accounts`, excludePaths: [`/organizations/${orgId}/accounts/compare`] },
      { name: $localize`Kontenvergleich`, path: `/organizations/${orgId}/accounts/compare` },
      { name: $localize`Kontengruppen`, path: `/organizations/${orgId}/accountGroups` },
      { name: $localize`Journal`, path: `/organizations/${orgId}/journal` },
      { name: $localize`Berichte`, path: `/organizations/${orgId}/reports` },
      { name: $localize`Berichtsvorlagen`, path: `/organizations/${orgId}/reportTemplates` },
    ];
  });

  readonly adminMenuItems = computed<MenuItem[]>(() => [
    { name: $localize`Einstellungen`, path: '/admin/settings' },
    { name: $localize`Organisationen`, path: '/admin/organizations' },
    { name: $localize`Benutzer`, path: '/admin/users' },
    { name: $localize`Gruppen`, path: '/admin/groups' },
    { name: $localize`Importquellen`, path: '/admin/importSources' },
  ]);

  constructor() {
    this.initializeTheme();
    // Setup organization change handler
    this.orgChangeSubject.pipe(
      takeUntil(this.destroy$)
    ).subscribe((organizationId) => {
      this.selectOrganization(organizationId);
      // Stay on the same route segment, just replace the orgId
      const currentUrl = this.router.url;
      const orgRouteMatch = currentUrl.match(/^\/organizations\/([^/]+)(\/[^?#]*)(.*)$/);
      if (orgRouteMatch) {
        const remainingPath = orgRouteMatch[2];
        const queryAndHash = orgRouteMatch[3];
        this.router.navigateByUrl(`/organizations/${organizationId}${remainingPath}${queryAndHash}`);
      } else {
        this.router.navigate(['/organizations', organizationId, 'dashboard']);
      }
    });
  }

  ngOnInit(): void {
    // Initialize currentOrganizationId from service if available
    const selectedOrgId = this.currentOrganizationService.currentOrganization()?.id;
    if (selectedOrgId) {
      this.currentOrganizationId.set(selectedOrgId);
    }
    this.loadOrganizations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrganizations(): void {
    this.loading.set(true);
    this.organizationDataService.getOrganizations().subscribe({
      next: (orgs) => {
        this.organizations.set(orgs);
        this.loading.set(false);

        // Get current selected org from service
        const currentOrg = this.currentOrganizationService.currentOrganization();

        // Try to get orgId from route params - check parent routes too
        let routeOrgId: string | null = null;
        let route = this.route;
        while (route) {
          routeOrgId = route.snapshot.paramMap.get('orgId') ?? route.snapshot.paramMap.get('id');
          if (routeOrgId) break;
          route = route.parent!;
        }

        if (routeOrgId) {
          // On org-prefixed route - use the route's orgId if it exists
          const org = orgs.find((o) => o.id === routeOrgId);
          if (org) {
            // Only update if different from current (prevents unnecessary switches on internal nav)
            if (!currentOrg || currentOrg.id !== org.id) {
              this.selectOrganization(org.id);
            } else {
              // Just update the local signal without triggering service change
              this.currentOrganizationId.set(org.id);
            }
          } else if (!currentOrg && orgs.length > 0) {
            // Route orgId not found, and no org selected - fallback to first
            this.selectOrganization(orgs[0].id);
          }
        } else if (currentOrg) {
          // On admin route but have an org selected - just sync the local signal
          this.currentOrganizationId.set(currentOrg.id);
        } else if (orgs.length > 0) {
          // No orgId in route (admin routes) and no org selected - auto-select first
          this.selectOrganization(orgs[0].id);
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onOrganizationChange(organizationId: string): void {
    if (!organizationId) return;
    this.orgChangeSubject.next(organizationId);
  }

  private selectOrganization(organizationId: string): void {
    if (!organizationId) {
      this.currentOrganizationId.set('');
      this.currentOrganizationService.setOrganization(null);
      return;
    }

    const org = this.organizations().find((o) => o.id === organizationId);
    if (org) {
      this.currentOrganizationId.set(organizationId);
      this.currentOrganizationService.setOrganization(org);
    }
  }

  createOrganization(name: string, description: string): void {
    this.organizationDataService.createOrganization(name, description).subscribe({
      next: (org) => {
        this.organizations.update((orgs) => [org, ...orgs]);
        this.selectOrganization(org.id);
        // Navigate to the newly created organization's dashboard
        this.router.navigate(['/organizations', org.id, 'dashboard']);
      },
    });
  }

  onCreateOrganization(): void {
    const name = this.newOrgName().trim();
    const description = this.newOrgDescription().trim();
    if (name) {
      this.createOrganization(name, description);
      this.newOrgName.set('');
      this.newOrgDescription.set('');
    }
  }

  readonly isCreateOrgFormVisible = signal(false);
  readonly newOrgName = signal('');
  readonly newOrgDescription = signal('');

  private readonly orgChangeSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  isMenuItemActive(item: MenuItem): boolean {
    // Check if this is an admin route - admin routes don't have org prefix
    const isAdminRoute = item.path.startsWith('/admin/');
    if (isAdminRoute) {
      const currentUrl = this.router.url;
      const matchesPath = currentUrl === item.path || currentUrl.startsWith(`${item.path}/`);

      if (!matchesPath) {
        return false;
      }

      return !(item.excludePaths ?? []).some(
        (excludedPath) =>
          currentUrl === excludedPath || currentUrl.startsWith(`${excludedPath}/`),
      );
    }

    // For org routes, extract the org path prefix and compare route segments
    const currentUrl = this.router.url;
    const orgId = this.orgIdFromRoute();

    if (!orgId) return false;

    // Build the full path with current org ID
    const fullPath = item.path.replace(/\/organizations\/[^/]+/, `/organizations/${orgId}`);

    const matchesPath = currentUrl === fullPath || currentUrl.startsWith(`${fullPath}/`);

    if (!matchesPath) {
      return false;
    }

    // Check excluded paths with current org ID
    const excludedPaths = item.excludePaths?.map(ep =>
      ep.replace(/\/organizations\/[^/]+/, `/organizations/${orgId}`)
    ) ?? [];

    return !excludedPaths.some(
      (excludedPath) =>
        currentUrl === excludedPath || currentUrl.startsWith(`${excludedPath}/`),
    );
  }

  menuItemClasses(item: MenuItem): string {
    const baseClasses = 'block px-2 py-1.5 rounded text-xs transition-colors';

    if (this.isMenuItemActive(item)) {
      return `${baseClasses} bg-blue-600 text-white font-semibold`;
    }

    return `${baseClasses} text-gray-300 hover:bg-gray-800 hover:text-white`;
  }

  toggleTheme(): void {
    this.applyTheme(!this.isDarkMode());
  }

  private initializeTheme(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const savedTheme = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;

    this.applyTheme(useDarkMode, false);
  }

  private applyTheme(isDark: boolean, persist = true): void {
    this.isDarkMode.set(isDark);

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }

    if (persist && typeof window !== 'undefined') {
      window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }
}
