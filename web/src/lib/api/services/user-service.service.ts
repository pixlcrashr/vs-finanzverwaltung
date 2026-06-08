/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1ListUsersResponse } from '../models/v1list-users-response';
import { V1User } from '../models/v1user';
import { V1BatchCheckUserOrganizationPermissionsResponse } from '../models/v1batch-check-user-organization-permissions-response';
import { UserServiceBatchCheckUserOrganizationPermissionsBody } from '../models/user-service-batch-check-user-organization-permissions-body';
import { V1CheckUserOrganizationPermissionsResponse } from '../models/v1check-user-organization-permissions-response';
import { UserServiceCheckUserOrganizationPermissionsBody } from '../models/user-service-check-user-organization-permissions-body';
@Injectable({
  providedIn: 'root',
})
class UserServiceService extends __BaseService {
  static readonly UserServiceListUsersPath = '/v1/users';
  static readonly UserServiceGetUserPath = '/v1/{name_16}';
  static readonly UserServiceBatchCheckUserOrganizationPermissionsPath = '/v1/{name}:batchCheckOrganizationPermissions';
  static readonly UserServiceCheckUserOrganizationPermissionsPath = '/v1/{name}:checkOrganizationPermissions';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Lists users with pagination.
   * @param params The `UserServiceService.UserServiceListUsersParams` containing the following parameters:
   *
   * - `page_token`: A page token from a previous ListUsers call.
   *
   * - `page_size`: Maximum number of users to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: display_name, email, is_active.
   *
   * @return A successful response.
   */
  UserServiceListUsersResponse(params: UserServiceService.UserServiceListUsersParams): __Observable<__StrictHttpResponse<V1ListUsersResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;
    if (params.pageToken != null) __params = __params.set('page_token', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('page_size', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('order_by', params.orderBy.toString());
    if (params.filter != null) __params = __params.set('filter', params.filter.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/users`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListUsersResponse>;
      })
    );
  }
  /**
   * Lists users with pagination.
   * @param params The `UserServiceService.UserServiceListUsersParams` containing the following parameters:
   *
   * - `page_token`: A page token from a previous ListUsers call.
   *
   * - `page_size`: Maximum number of users to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: display_name, email, is_active.
   *
   * @return A successful response.
   */
  UserServiceListUsers(params: UserServiceService.UserServiceListUsersParams): __Observable<V1ListUsersResponse> {
    return this.UserServiceListUsersResponse(params).pipe(
      __map(_r => _r.body as V1ListUsersResponse)
    );
  }

  /**
   * Gets a single user by resource name.
   * @param name_16 The resource name of the user.
   * Format: users/{user}
   * @return A successful response.
   */
  UserServiceGetUserResponse(name16: string): __Observable<__StrictHttpResponse<V1User>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(name16))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1User>;
      })
    );
  }
  /**
   * Gets a single user by resource name.
   * @param name_16 The resource name of the user.
   * Format: users/{user}
   * @return A successful response.
   */
  UserServiceGetUser(name16: string): __Observable<V1User> {
    return this.UserServiceGetUserResponse(name16).pipe(
      __map(_r => _r.body as V1User)
    );
  }

  /**
   * Checks permissions for a user across multiple organizations in one call
   * (batch custom method, AIP-231).
   * @param params The `UserServiceService.UserServiceBatchCheckUserOrganizationPermissionsParams` containing the following parameters:
   *
   * - `name`: The resource name of the user.
   *   Format: users/{user}
   *
   * - `body`:
   *
   * @return A successful response.
   */
  UserServiceBatchCheckUserOrganizationPermissionsResponse(params: UserServiceService.UserServiceBatchCheckUserOrganizationPermissionsParams): __Observable<__StrictHttpResponse<V1BatchCheckUserOrganizationPermissionsResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.body;
    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.name))}:batchCheckOrganizationPermissions`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1BatchCheckUserOrganizationPermissionsResponse>;
      })
    );
  }
  /**
   * Checks permissions for a user across multiple organizations in one call
   * (batch custom method, AIP-231).
   * @param params The `UserServiceService.UserServiceBatchCheckUserOrganizationPermissionsParams` containing the following parameters:
   *
   * - `name`: The resource name of the user.
   *   Format: users/{user}
   *
   * - `body`:
   *
   * @return A successful response.
   */
  UserServiceBatchCheckUserOrganizationPermissions(params: UserServiceService.UserServiceBatchCheckUserOrganizationPermissionsParams): __Observable<V1BatchCheckUserOrganizationPermissionsResponse> {
    return this.UserServiceBatchCheckUserOrganizationPermissionsResponse(params).pipe(
      __map(_r => _r.body as V1BatchCheckUserOrganizationPermissionsResponse)
    );
  }

  /**
   * Checks which of the requested permissions a user holds within a single
   * organization (custom method, AIP-136).
   * @param params The `UserServiceService.UserServiceCheckUserOrganizationPermissionsParams` containing the following parameters:
   *
   * - `name`: The resource name of the user.
   *   Format: users/{user}
   *
   * - `body`:
   *
   * @return A successful response.
   */
  UserServiceCheckUserOrganizationPermissionsResponse(params: UserServiceService.UserServiceCheckUserOrganizationPermissionsParams): __Observable<__StrictHttpResponse<V1CheckUserOrganizationPermissionsResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.body;
    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.name))}:checkOrganizationPermissions`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1CheckUserOrganizationPermissionsResponse>;
      })
    );
  }
  /**
   * Checks which of the requested permissions a user holds within a single
   * organization (custom method, AIP-136).
   * @param params The `UserServiceService.UserServiceCheckUserOrganizationPermissionsParams` containing the following parameters:
   *
   * - `name`: The resource name of the user.
   *   Format: users/{user}
   *
   * - `body`:
   *
   * @return A successful response.
   */
  UserServiceCheckUserOrganizationPermissions(params: UserServiceService.UserServiceCheckUserOrganizationPermissionsParams): __Observable<V1CheckUserOrganizationPermissionsResponse> {
    return this.UserServiceCheckUserOrganizationPermissionsResponse(params).pipe(
      __map(_r => _r.body as V1CheckUserOrganizationPermissionsResponse)
    );
  }
}

module UserServiceService {

  /**
   * Parameters for UserServiceListUsers
   */
  export interface UserServiceListUsersParams {

    /**
     * A page token from a previous ListUsers call.
     */
    pageToken?: string;

    /**
     * Maximum number of users to return. The service may return fewer.
     * If unspecified, at most 20 are returned. Maximum value is 100.
     */
    pageSize?: number;

    /**
     * Order by expression (e.g. "display_name", "create_time desc").
     */
    orderBy?: string;

    /**
     * Filter expression conforming to AIP-160.
     * Supported fields: display_name, email, is_active.
     */
    filter?: string;
  }

  /**
   * Parameters for UserServiceBatchCheckUserOrganizationPermissions
   */
  export interface UserServiceBatchCheckUserOrganizationPermissionsParams {

    /**
     * The resource name of the user.
     * Format: users/{user}
     */
    name: string;
    body: UserServiceBatchCheckUserOrganizationPermissionsBody;
  }

  /**
   * Parameters for UserServiceCheckUserOrganizationPermissions
   */
  export interface UserServiceCheckUserOrganizationPermissionsParams {

    /**
     * The resource name of the user.
     * Format: users/{user}
     */
    name: string;
    body: UserServiceCheckUserOrganizationPermissionsBody;
  }
}

export { UserServiceService }
