import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { MenuItem } from '../../models';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink],
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

        <!-- Navigation -->
        <nav class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <ul class="space-y-0.5">
            @for (item of generalMenuItems(); track item.path) {
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
              @for (item of applicationMenuItems(); track item.path) {
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
              @for (item of householdMenuItems(); track item.path) {
                <li>
                  <a [routerLink]="item.path" [class]="menuItemClasses(item)">
                    {{ item.name }}
                  </a>
                </li>
              }
            </ul>
          </div>

          @if (adminMenuItems().length > 0) {
            <div class="mt-4">
              <p i18n class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Administration
              </p>
              <ul class="space-y-0.5">
                @for (item of adminMenuItems(); track item.path) {
                  <li>
                    <a [routerLink]="item.path" [class]="menuItemClasses(item)">
                      {{ item.name }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </nav>

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
export class MainLayoutComponent {
  protected readonly router = inject(Router);

  readonly isDarkMode = signal(false);

  constructor() {
    this.initializeTheme();
  }

  readonly generalMenuItems = signal<MenuItem[]>([
    { name: $localize`Dashboard`, path: '/dashboard' },
  ]);

  readonly applicationMenuItems = signal<MenuItem[]>([
    { name: $localize`Kostenerstattungen`, path: '/reimbursements' },
  ]);

  readonly householdMenuItems = signal<MenuItem[]>([
    { name: $localize`Matrix`, path: '/matrix' },
    { name: $localize`Pläne`, path: '/budgets' },
    { name: $localize`Konten`, path: '/accounts', excludePaths: ['/accounts/compare'] },
    { name: $localize`Kontenvergleich`, path: '/accounts/compare' },
    { name: $localize`Kontengruppen`, path: '/accountGroups' },
    { name: $localize`Journal`, path: '/journal' },
    { name: $localize`Berichte`, path: '/reports' },
    { name: $localize`Berichtsvorlagen`, path: '/reportTemplates' },
  ]);

  readonly adminMenuItems = signal<MenuItem[]>([
    { name: $localize`Einstellungen`, path: '/admin/settings' },
    { name: $localize`Benutzer`, path: '/admin/users' },
    { name: $localize`Gruppen`, path: '/admin/groups' },
    { name: $localize`Importquellen`, path: '/admin/importSources' },
  ]);

  isMenuItemActive(item: MenuItem): boolean {
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
