/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1ListOrganizationsResponse } from '../models/v1list-organizations-response';
import { V1Organization } from '../models/v1organization';
@Injectable({
  providedIn: 'root',
})
class OrganizationServiceService extends __BaseService {
  static readonly OrganizationServiceListOrganizationsPath = '/v1/organizations';
  static readonly OrganizationServiceCreateOrganizationPath = '/v1/organizations';
  static readonly OrganizationServiceGetOrganizationPath = '/v1/{name_10}';
  static readonly OrganizationServiceDeleteOrganizationPath = '/v1/{name_8}';
  static readonly OrganizationServiceUpdateOrganizationPath = '/v1/{organization.name}';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Lists organizations with pagination.
   * @param params The `OrganizationServiceService.OrganizationServiceListOrganizationsParams` containing the following parameters:
   *
   * - `page_token`: A page token from a previous ListOrganizations call.
   *
   * - `page_size`: Maximum number of organizations to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: display_name.
   *   Example: "display_name=\"Acme\"".
   *
   * @return A successful response.
   */
  OrganizationServiceListOrganizationsResponse(params: OrganizationServiceService.OrganizationServiceListOrganizationsParams): __Observable<__StrictHttpResponse<V1ListOrganizationsResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;
    if (params.pageToken != null) __params = __params.set('page_token', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('page_size', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('order_by', params.orderBy.toString());
    if (params.filter != null) __params = __params.set('filter', params.filter.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/organizations`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListOrganizationsResponse>;
      })
    );
  }
  /**
   * Lists organizations with pagination.
   * @param params The `OrganizationServiceService.OrganizationServiceListOrganizationsParams` containing the following parameters:
   *
   * - `page_token`: A page token from a previous ListOrganizations call.
   *
   * - `page_size`: Maximum number of organizations to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: display_name.
   *   Example: "display_name=\"Acme\"".
   *
   * @return A successful response.
   */
  OrganizationServiceListOrganizations(params: OrganizationServiceService.OrganizationServiceListOrganizationsParams): __Observable<V1ListOrganizationsResponse> {
    return this.OrganizationServiceListOrganizationsResponse(params).pipe(
      __map(_r => _r.body as V1ListOrganizationsResponse)
    );
  }

  /**
   * Creates a new organization.
   * @param organization The organization to create.
   * @return A successful response.
   */
  OrganizationServiceCreateOrganizationResponse(organization: V1Organization): __Observable<__StrictHttpResponse<V1Organization>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;
    __body = organization;
    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/organizations`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1Organization>;
      })
    );
  }
  /**
   * Creates a new organization.
   * @param organization The organization to create.
   * @return A successful response.
   */
  OrganizationServiceCreateOrganization(organization: V1Organization): __Observable<V1Organization> {
    return this.OrganizationServiceCreateOrganizationResponse(organization).pipe(
      __map(_r => _r.body as V1Organization)
    );
  }

  /**
   * Gets a single organization by resource name.
   * @param name_10 The resource name of the organization.
   * Format: organizations/{organization}
   * @return A successful response.
   */
  OrganizationServiceGetOrganizationResponse(name10: string): __Observable<__StrictHttpResponse<V1Organization>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(name10))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1Organization>;
      })
    );
  }
  /**
   * Gets a single organization by resource name.
   * @param name_10 The resource name of the organization.
   * Format: organizations/{organization}
   * @return A successful response.
   */
  OrganizationServiceGetOrganization(name10: string): __Observable<V1Organization> {
    return this.OrganizationServiceGetOrganizationResponse(name10).pipe(
      __map(_r => _r.body as V1Organization)
    );
  }

  /**
   * Permanently deletes an organization.
   * @param name_8 The resource name of the organization.
   * Format: organizations/{organization}
   * @return A successful response.
   */
  OrganizationServiceDeleteOrganizationResponse(name8: string): __Observable<__StrictHttpResponse<{}>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'DELETE',
      this.rootUrl + `/v1/${encodeURIComponent(String(name8))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<{}>;
      })
    );
  }
  /**
   * Permanently deletes an organization.
   * @param name_8 The resource name of the organization.
   * Format: organizations/{organization}
   * @return A successful response.
   */
  OrganizationServiceDeleteOrganization(name8: string): __Observable<{}> {
    return this.OrganizationServiceDeleteOrganizationResponse(name8).pipe(
      __map(_r => _r.body as {})
    );
  }

  /**
   * Updates an existing organization.
   * @param params The `OrganizationServiceService.OrganizationServiceUpdateOrganizationParams` containing the following parameters:
   *
   * - `organization.name`: The resource name of the organization.
   *   Format: organizations/{organization}
   *
   * - `organization`: The organization to update.
   *
   * @return A successful response.
   */
  OrganizationServiceUpdateOrganizationResponse(params: OrganizationServiceService.OrganizationServiceUpdateOrganizationParams): __Observable<__StrictHttpResponse<V1Organization>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.organization;
    let req = new HttpRequest<any>(
      'PATCH',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.organizationName))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1Organization>;
      })
    );
  }
  /**
   * Updates an existing organization.
   * @param params The `OrganizationServiceService.OrganizationServiceUpdateOrganizationParams` containing the following parameters:
   *
   * - `organization.name`: The resource name of the organization.
   *   Format: organizations/{organization}
   *
   * - `organization`: The organization to update.
   *
   * @return A successful response.
   */
  OrganizationServiceUpdateOrganization(params: OrganizationServiceService.OrganizationServiceUpdateOrganizationParams): __Observable<V1Organization> {
    return this.OrganizationServiceUpdateOrganizationResponse(params).pipe(
      __map(_r => _r.body as V1Organization)
    );
  }
}

module OrganizationServiceService {

  /**
   * Parameters for OrganizationServiceListOrganizations
   */
  export interface OrganizationServiceListOrganizationsParams {

    /**
     * A page token from a previous ListOrganizations call.
     */
    pageToken?: string;

    /**
     * Maximum number of organizations to return. The service may return fewer.
     * If unspecified, at most 20 are returned. Maximum value is 100.
     */
    pageSize?: number;

    /**
     * Order by expression (e.g. "display_name", "create_time desc").
     */
    orderBy?: string;

    /**
     * Filter expression conforming to AIP-160.
     * Supported fields: display_name.
     * Example: "display_name=\"Acme\"".
     */
    filter?: string;
  }

  /**
   * Parameters for OrganizationServiceUpdateOrganization
   */
  export interface OrganizationServiceUpdateOrganizationParams {

    /**
     * The resource name of the organization.
     * Format: organizations/{organization}
     */
    organizationName: string;

    /**
     * The organization to update.
     */
    organization: {uid?: string, display_name: string, update_time?: string, create_time?: string, etag?: string};
  }
}

export { OrganizationServiceService }
