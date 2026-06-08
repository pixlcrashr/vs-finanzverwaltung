/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1UserSettings } from '../models/v1user-settings';
@Injectable({
  providedIn: 'root',
})
class UserSettingsServiceService extends __BaseService {
  static readonly UserSettingsServiceGetUserSettingsPath = '/v1/{name_18}';
  static readonly UserSettingsServiceUpdateUserSettingsPath = '/v1/{settings.name}';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Gets the settings for a user.
   * @param name_18 The resource name of the user settings.
   * Format: users/{user}/settings
   * @return A successful response.
   */
  UserSettingsServiceGetUserSettingsResponse(name18: string): __Observable<__StrictHttpResponse<V1UserSettings>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(name18))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1UserSettings>;
      })
    );
  }
  /**
   * Gets the settings for a user.
   * @param name_18 The resource name of the user settings.
   * Format: users/{user}/settings
   * @return A successful response.
   */
  UserSettingsServiceGetUserSettings(name18: string): __Observable<V1UserSettings> {
    return this.UserSettingsServiceGetUserSettingsResponse(name18).pipe(
      __map(_r => _r.body as V1UserSettings)
    );
  }

  /**
   * Updates the settings for a user.
   * @param params The `UserSettingsServiceService.UserSettingsServiceUpdateUserSettingsParams` containing the following parameters:
   *
   * - `settings.name`: The resource name of the user settings.
   *   Format: users/{user}/settings
   *
   * - `settings`: The user settings to update.
   *
   * @return A successful response.
   */
  UserSettingsServiceUpdateUserSettingsResponse(params: UserSettingsServiceService.UserSettingsServiceUpdateUserSettingsParams): __Observable<__StrictHttpResponse<V1UserSettings>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.settings;
    let req = new HttpRequest<any>(
      'PATCH',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.settingsName))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1UserSettings>;
      })
    );
  }
  /**
   * Updates the settings for a user.
   * @param params The `UserSettingsServiceService.UserSettingsServiceUpdateUserSettingsParams` containing the following parameters:
   *
   * - `settings.name`: The resource name of the user settings.
   *   Format: users/{user}/settings
   *
   * - `settings`: The user settings to update.
   *
   * @return A successful response.
   */
  UserSettingsServiceUpdateUserSettings(params: UserSettingsServiceService.UserSettingsServiceUpdateUserSettingsParams): __Observable<V1UserSettings> {
    return this.UserSettingsServiceUpdateUserSettingsResponse(params).pipe(
      __map(_r => _r.body as V1UserSettings)
    );
  }
}

module UserSettingsServiceService {

  /**
   * Parameters for UserSettingsServiceUpdateUserSettings
   */
  export interface UserSettingsServiceUpdateUserSettingsParams {

    /**
     * The resource name of the user settings.
     * Format: users/{user}/settings
     */
    settingsName: string;

    /**
     * The user settings to update.
     */
    settings: {locale?: string, theme?: string, update_time?: string, etag?: string};
  }
}

export { UserSettingsServiceService }
