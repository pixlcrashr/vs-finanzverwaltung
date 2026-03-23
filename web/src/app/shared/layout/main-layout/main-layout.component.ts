import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { MenuItem } from '../../models';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="flex h-screen">
      <!-- Sidebar -->
      <aside class="flex flex-col w-52 min-w-52 bg-gray-900 border-r border-gray-800">
        <!-- Logo -->
        <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
          <img src="/favicon.ico" alt="Logo" class="w-5 h-5" />
          <h1 class="text-xs font-medium text-white">VS-Finanzverwaltung</h1>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto px-2 py-2">
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
            <p class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Application Management
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
            <p class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
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
              <p class="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
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
              <span>Light Mode</span>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>Dark Mode</span>
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
      <main class="flex-1 overflow-auto bg-gray-50">
        <router-outlet />
      </main>
    </div>
  `,
})
export class MainLayoutComponent {
  protected readonly router = inject(Router);

  readonly isDarkMode = signal(false);

  readonly generalMenuItems = signal<MenuItem[]>([
    { name: 'Dashboard', path: '/dashboard' },
  ]);

  readonly applicationMenuItems = signal<MenuItem[]>([
    { name: 'Applications', path: '/applications' },
    { name: 'Application Types', path: '/applicationTypes' },
  ]);

  readonly householdMenuItems = signal<MenuItem[]>([
    { name: 'Pläne', path: '/budgets' },
    { name: 'Konten', path: '/accounts', excludePaths: ['/accounts/compare'] },
    { name: 'Kontenvergleich', path: '/accounts/compare' },
    { name: 'Kontengruppen', path: '/accountGroups' },
    { name: 'Journal', path: '/journal' },
    { name: 'Berichte', path: '/reports' },
    { name: 'Berichtsvorlagen', path: '/reportTemplates' },
  ]);

  readonly adminMenuItems = signal<MenuItem[]>([
    { name: 'Einstellungen', path: '/admin/settings' },
    { name: 'Benutzer', path: '/admin/users' },
    { name: 'Gruppen', path: '/admin/groups' },
    { name: 'Importquellen', path: '/admin/importSources' },
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
    this.isDarkMode.update((current) => !current);
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
