import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="max-w-md w-full space-y-8 p-8">
        <div class="text-center">
          <h1 i18n class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Anmelden
          </h1>
          @if (isProcessing()) {
            <p i18n class="text-sm text-gray-500 dark:text-gray-400">
              Anmeldung wird verarbeitet...
            </p>
          } @else {
            <p i18n class="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Melden Sie sich mit Ihrem GitLab-Konto an.
            </p>
            <button
              (click)="loginWithGitLab()"
              i18n
              class="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.423-.73-.423-.867 0L16.418 9.45H7.582L4.919 1.263c-.135-.423-.73-.423-.867 0L1.388 9.452-.955 13.587a.87.87 0 0 0 .317 1.156L12 21.182l11.638-6.44a.87.87 0 0 0 .317-1.155z"/>
              </svg>
              Mit GitLab anmelden
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);

  readonly isProcessing = signal(false);

  async ngOnInit() {
    // If already authenticated, redirect to home
    if (this.oauthService.hasValidAccessToken()) {
      await this.router.navigate(['/']);
      return;
    }

    // Check if this is a callback (code in URL) — the library processes it
    // automatically via loadDiscoveryDocumentAndTryLogin() in app.config.ts.
    // We just need to wait and check.
    const hasCode = new URLSearchParams(window.location.search).has('code');
    if (hasCode) {
      this.isProcessing.set(true);
      // Wait a tick for the library to process the callback
      setTimeout(async () => {
        if (this.oauthService.hasValidAccessToken()) {
          await this.router.navigate(['/']);
        } else {
          this.isProcessing.set(false);
        }
      }, 100);
    }
  }

  loginWithGitLab() {
    this.oauthService.initCodeFlow();
  }
}
