/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1ImportSourcePeriod } from '../models/v1import-source-period';
import { ImportSourcePeriodServiceCloseImportSourcePeriodBody } from '../models/import-source-period-service-close-import-source-period-body';
import { V1ListImportSourcePeriodsResponse } from '../models/v1list-import-source-periods-response';
@Injectable({
  providedIn: 'root',
})
class ImportSourcePeriodServiceService extends __BaseService {
  static readonly ImportSourcePeriodServiceCloseImportSourcePeriodPath = '/v1/{name_1}:close';
  static readonly ImportSourcePeriodServiceDeleteImportSourcePeriodPath = '/v1/{name_6}';
  static readonly ImportSourcePeriodServiceGetImportSourcePeriodPath = '/v1/{name_8}';
  static readonly ImportSourcePeriodServiceListImportSourcePeriodsPath = '/v1/{parent}/periods';
  static readonly ImportSourcePeriodServiceCreateImportSourcePeriodPath = '/v1/{parent}/periods';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Closes a period, preventing new imports.
   * @param params The `ImportSourcePeriodServiceService.ImportSourcePeriodServiceCloseImportSourcePeriodParams` containing the following parameters:
   *
   * - `name_1`: The resource name of the period to close.
   *   Format: organizations/{organization}/importSources/{import_source}/periods/{period}
   *
   * - `body`:
   *
   * @return A successful response.
   */
  ImportSourcePeriodServiceCloseImportSourcePeriodResponse(params: ImportSourcePeriodServiceService.ImportSourcePeriodServiceCloseImportSourcePeriodParams): __Observable<__StrictHttpResponse<V1ImportSourcePeriod>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.body;
    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.name1))}:close`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ImportSourcePeriod>;
      })
    );
  }
  /**
   * Closes a period, preventing new imports.
   * @param params The `ImportSourcePeriodServiceService.ImportSourcePeriodServiceCloseImportSourcePeriodParams` containing the following parameters:
   *
   * - `name_1`: The resource name of the period to close.
   *   Format: organizations/{organization}/importSources/{import_source}/periods/{period}
   *
   * - `body`:
   *
   * @return A successful response.
   */
  ImportSourcePeriodServiceCloseImportSourcePeriod(params: ImportSourcePeriodServiceService.ImportSourcePeriodServiceCloseImportSourcePeriodParams): __Observable<V1ImportSourcePeriod> {
    return this.ImportSourcePeriodServiceCloseImportSourcePeriodResponse(params).pipe(
      __map(_r => _r.body as V1ImportSourcePeriod)
    );
  }

  /**
   * Permanently deletes a period.
   * @param name_6 The resource name of the period.
   * Format: organizations/{organization}/importSources/{import_source}/periods/{period}
   * @return A successful response.
   */
  ImportSourcePeriodServiceDeleteImportSourcePeriodResponse(name6: string): __Observable<__StrictHttpResponse<{}>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'DELETE',
      this.rootUrl + `/v1/${encodeURIComponent(String(name6))}`,
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
   * Permanently deletes a period.
   * @param name_6 The resource name of the period.
   * Format: organizations/{organization}/importSources/{import_source}/periods/{period}
   * @return A successful response.
   */
  ImportSourcePeriodServiceDeleteImportSourcePeriod(name6: string): __Observable<{}> {
    return this.ImportSourcePeriodServiceDeleteImportSourcePeriodResponse(name6).pipe(
      __map(_r => _r.body as {})
    );
  }

  /**
   * Gets a single period by resource name.
   * @param name_8 The resource name of the period.
   * Format: organizations/{organization}/importSources/{import_source}/periods/{period}
   * @return A successful response.
   */
  ImportSourcePeriodServiceGetImportSourcePeriodResponse(name8: string): __Observable<__StrictHttpResponse<V1ImportSourcePeriod>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
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
        return _r as __StrictHttpResponse<V1ImportSourcePeriod>;
      })
    );
  }
  /**
   * Gets a single period by resource name.
   * @param name_8 The resource name of the period.
   * Format: organizations/{organization}/importSources/{import_source}/periods/{period}
   * @return A successful response.
   */
  ImportSourcePeriodServiceGetImportSourcePeriod(name8: string): __Observable<V1ImportSourcePeriod> {
    return this.ImportSourcePeriodServiceGetImportSourcePeriodResponse(name8).pipe(
      __map(_r => _r.body as V1ImportSourcePeriod)
    );
  }

  /**
   * Lists periods for an import source.
   * @param params The `ImportSourcePeriodServiceService.ImportSourcePeriodServiceListImportSourcePeriodsParams` containing the following parameters:
   *
   * - `parent`: The parent import source resource name.
   *   Format: organizations/{organization}/importSources/{import_source}
   *
   * - `pageToken`: A page token from a previous ListImportSourcePeriods call.
   *
   * - `pageSize`: Maximum number of periods to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression (e.g. "year desc", "create_time").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: year, is_closed.
   *   Example: "is_closed=false" or "year=2025".
   *
   * @return A successful response.
   */
  ImportSourcePeriodServiceListImportSourcePeriodsResponse(params: ImportSourcePeriodServiceService.ImportSourcePeriodServiceListImportSourcePeriodsParams): __Observable<__StrictHttpResponse<V1ListImportSourcePeriodsResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    if (params.pageToken != null) __params = __params.set('pageToken', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('pageSize', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('orderBy', params.orderBy.toString());
    if (params.filter != null) __params = __params.set('filter', params.filter.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/periods`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListImportSourcePeriodsResponse>;
      })
    );
  }
  /**
   * Lists periods for an import source.
   * @param params The `ImportSourcePeriodServiceService.ImportSourcePeriodServiceListImportSourcePeriodsParams` containing the following parameters:
   *
   * - `parent`: The parent import source resource name.
   *   Format: organizations/{organization}/importSources/{import_source}
   *
   * - `pageToken`: A page token from a previous ListImportSourcePeriods call.
   *
   * - `pageSize`: Maximum number of periods to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression (e.g. "year desc", "create_time").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: year, is_closed.
   *   Example: "is_closed=false" or "year=2025".
   *
   * @return A successful response.
   */
  ImportSourcePeriodServiceListImportSourcePeriods(params: ImportSourcePeriodServiceService.ImportSourcePeriodServiceListImportSourcePeriodsParams): __Observable<V1ListImportSourcePeriodsResponse> {
    return this.ImportSourcePeriodServiceListImportSourcePeriodsResponse(params).pipe(
      __map(_r => _r.body as V1ListImportSourcePeriodsResponse)
    );
  }

  /**
   * Creates a new period.
   * @param params The `ImportSourcePeriodServiceService.ImportSourcePeriodServiceCreateImportSourcePeriodParams` containing the following parameters:
   *
   * - `period`: The period to create.
   *
   * - `parent`: The parent import source resource name.
   *   Format: organizations/{organization}/importSources/{import_source}
   *
   * @return A successful response.
   */
  ImportSourcePeriodServiceCreateImportSourcePeriodResponse(params: ImportSourcePeriodServiceService.ImportSourcePeriodServiceCreateImportSourcePeriodParams): __Observable<__StrictHttpResponse<V1ImportSourcePeriod>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;
    __body = params.period;

    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/periods`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ImportSourcePeriod>;
      })
    );
  }
  /**
   * Creates a new period.
   * @param params The `ImportSourcePeriodServiceService.ImportSourcePeriodServiceCreateImportSourcePeriodParams` containing the following parameters:
   *
   * - `period`: The period to create.
   *
   * - `parent`: The parent import source resource name.
   *   Format: organizations/{organization}/importSources/{import_source}
   *
   * @return A successful response.
   */
  ImportSourcePeriodServiceCreateImportSourcePeriod(params: ImportSourcePeriodServiceService.ImportSourcePeriodServiceCreateImportSourcePeriodParams): __Observable<V1ImportSourcePeriod> {
    return this.ImportSourcePeriodServiceCreateImportSourcePeriodResponse(params).pipe(
      __map(_r => _r.body as V1ImportSourcePeriod)
    );
  }
}

module ImportSourcePeriodServiceService {

  /**
   * Parameters for ImportSourcePeriodServiceCloseImportSourcePeriod
   */
  export interface ImportSourcePeriodServiceCloseImportSourcePeriodParams {

    /**
     * The resource name of the period to close.
     * Format: organizations/{organization}/importSources/{import_source}/periods/{period}
     */
    name1: string;
    body: ImportSourcePeriodServiceCloseImportSourcePeriodBody;
  }

  /**
   * Parameters for ImportSourcePeriodServiceListImportSourcePeriods
   */
  export interface ImportSourcePeriodServiceListImportSourcePeriodsParams {

    /**
     * The parent import source resource name.
     * Format: organizations/{organization}/importSources/{import_source}
     */
    parent: string;

    /**
     * A page token from a previous ListImportSourcePeriods call.
     */
    pageToken?: string;

    /**
     * Maximum number of periods to return. The service may return fewer.
     * If unspecified, at most 20 are returned. Maximum value is 100.
     */
    pageSize?: number;

    /**
     * Order by expression (e.g. "year desc", "create_time").
     */
    orderBy?: string;

    /**
     * Filter expression conforming to AIP-160.
     * Supported fields: year, is_closed.
     * Example: "is_closed=false" or "year=2025".
     */
    filter?: string;
  }

  /**
   * Parameters for ImportSourcePeriodServiceCreateImportSourcePeriod
   */
  export interface ImportSourcePeriodServiceCreateImportSourcePeriodParams {

    /**
     * The period to create.
     */
    period: V1ImportSourcePeriod;

    /**
     * The parent import source resource name.
     * Format: organizations/{organization}/importSources/{import_source}
     */
    parent: string;
  }
}

export { ImportSourcePeriodServiceService }
