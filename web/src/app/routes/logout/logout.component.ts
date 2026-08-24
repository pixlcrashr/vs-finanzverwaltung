import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

const MIN_LOGOUT_DELAY_MS = 500;
const COUNTDOWN_SECONDS = 5;

@Component({
  selector: 'app-logout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="max-w-md w-full space-y-8 p-8">
        <div class="text-center">
          @if (isLoggingOut()) {
            <app-loading-spinner size="lg" [fullPage]="false" />
            <p i18n class="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Abmeldung wird verarbeitet...
            </p>
          } @else {
            <h1 i18n class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Abgemeldet
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              <span i18n>Du wurdest abgemeldet. Du wirst zum Login weitergeleitet in</span>
              {{ secondsRemaining() }}.. <span i18n>Sekunden</span>.
            </p>
          }
        </div>
      </div>
    </div>
  `,
})
export class LogoutComponent implements OnInit, OnDestroy {
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);

  readonly isLoggingOut = signal(false);
  readonly secondsRemaining = signal(COUNTDOWN_SECONDS);

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  async ngOnInit(): Promise<void> {
    if (this.oauthService.hasValidAccessToken()) {
      this.isLoggingOut.set(true);

      const start = Date.now();
      this.oauthService.logOut();
      const elapsed = Date.now() - start;
      const remainingDelay = Math.max(0, MIN_LOGOUT_DELAY_MS - elapsed);
      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }

      this.isLoggingOut.set(false);
    }

    this.startCountdown();
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      const remaining = this.secondsRemaining() - 1;
      this.secondsRemaining.set(remaining);

      if (remaining <= 0) {
        this.stopCountdown();
        void this.router.navigate(['/login']);
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }
}
