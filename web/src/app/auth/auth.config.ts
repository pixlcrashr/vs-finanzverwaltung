import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

export const authConfig: AuthConfig = {
  issuer: environment.oauthIssuer,
  clientId: 'web-app',
  redirectUri: window.location.origin + '/login',
  responseType: 'code',
  scope: 'openid profile email offline',
  showDebugInformation: !environment.production,
  requireHttps: environment.production
};
