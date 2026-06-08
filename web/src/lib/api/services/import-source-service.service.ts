/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1ImportSource } from '../models/v1import-source';
import { TypeDate } from '../models/type-date';
import { V1ListImportSourcesResponse } from '../models/v1list-import-sources-response';
@Injectable({
  providedIn: 'root',
})
class ImportSourceServiceService extends __BaseService {
  static readonly ImportSourceServiceUpdateImportSourcePath = '/v1/{importSource.name}';
  static readonly ImportSourceServiceDeleteImportSourcePath = '/v1/{name_5}';
  static readonly ImportSourceServiceGetImportSourcePath = '/v1/{name_7}';
  static readonly ImportSourceServiceListImportSourcesPath = '/v1/{parent}/importSources';
  static readonly ImportSourceServiceCreateImportSourcePath = '/v1/{parent}/importSources';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Updates an existing import source.
   * @param params The `ImportSourceServiceService.ImportSourceServiceUpdateImportSourceParams` containing the following parameters:
   *
   * - `importSource.name`: The resource name of the import source.
   *   Format: organizations/{organization}/importSources/{import_source}
   *
   * - `importSource`: The import source to update.
   *
   * @return A successful response.
   */
  ImportSourceServiceUpdateImportSourceResponse(params: ImportSourceServiceService.ImportSourceServiceUpdateImportSourceParams): __Observable<__StrictHttpResponse<V1ImportSource>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.importSource;
    let req = new HttpRequest<any>(
      'PATCH',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.importSourceName))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ImportSource>;
      })
    );
  }
  /**
   * Updates an existing import source.
   * @param params The `ImportSourceServiceService.ImportSourceServiceUpdateImportSourceParams` containing the following parameters:
   *
   * - `importSource.name`: The resource name of the import source.
   *   Format: organizations/{organization}/importSources/{import_source}
   *
   * - `importSource`: The import source to update.
   *
   * @return A successful response.
   */
  ImportSourceServiceUpdateImportSource(params: ImportSourceServiceService.ImportSourceServiceUpdateImportSourceParams): __Observable<V1ImportSource> {
    return this.ImportSourceServiceUpdateImportSourceResponse(params).pipe(
      __map(_r => _r.body as V1ImportSource)
    );
  }

  /**
   * Permanently deletes an import source.
   * @param name_5 The resource name of the import source.
   * Format: organizations/{organization}/importSources/{import_source}
   * @return A successful response.
   */
  ImportSourceServiceDeleteImportSourceResponse(name5: string): __Observable<__StrictHttpResponse<{}>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'DELETE',
      this.rootUrl + `/v1/${encodeURIComponent(String(name5))}`,
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
   * Permanently deletes an import source.
   * @param name_5 The resource name of the import source.
   * Format: organizations/{organization}/importSources/{import_source}
   * @return A successful response.
   */
  ImportSourceServiceDeleteImportSource(name5: string): __Observable<{}> {
    return this.ImportSourceServiceDeleteImportSourceResponse(name5).pipe(
      __map(_r => _r.body as {})
    );
  }

  /**
   * Gets a single import source by resource name.
   * @param name_7 The resource name of the import source.
   * Format: organizations/{organization}/importSources/{import_source}
   * @return A successful response.
   */
  ImportSourceServiceGetImportSourceResponse(name7: string): __Observable<__StrictHttpResponse<V1ImportSource>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(name7))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ImportSource>;
      })
    );
  }
  /**
   * Gets a single import source by resource name.
   * @param name_7 The resource name of the import source.
   * Format: organizations/{organization}/importSources/{import_source}
   * @return A successful response.
   */
  ImportSourceServiceGetImportSource(name7: string): __Observable<V1ImportSource> {
    return this.ImportSourceServiceGetImportSourceResponse(name7).pipe(
      __map(_r => _r.body as V1ImportSource)
    );
  }

  /**
   * Lists import sources with pagination.
   * @param params The `ImportSourceServiceService.ImportSourceServiceListImportSourcesParams` containing the following parameters:
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
   *
   * - `pageToken`: A page token from a previous ListImportSources call.
   *
   * - `pageSize`: Maximum number of import sources to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression (e.g. "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: display_name.
   *   Example: "display_name=\"BankXY\"".
   *
   * @return A successful response.
   */
  ImportSourceServiceListImportSourcesResponse(params: ImportSourceServiceService.ImportSourceServiceListImportSourcesParams): __Observable<__StrictHttpResponse<V1ListImportSourcesResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    if (params.pageToken != null) __params = __params.set('pageToken', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('pageSize', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('orderBy', params.orderBy.toString());
    if (params.filter != null) __params = __params.set('filter', params.filter.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/importSources`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListImportSourcesResponse>;
      })
    );
  }
  /**
   * Lists import sources with pagination.
   * @param params The `ImportSourceServiceService.ImportSourceServiceListImportSourcesParams` containing the following parameters:
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
   *
   * - `pageToken`: A page token from a previous ListImportSources call.
   *
   * - `pageSize`: Maximum number of import sources to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression (e.g. "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: display_name.
   *   Example: "display_name=\"BankXY\"".
   *
   * @return A successful response.
   */
  ImportSourceServiceListImportSources(params: ImportSourceServiceService.ImportSourceServiceListImportSourcesParams): __Observable<V1ListImportSourcesResponse> {
    return this.ImportSourceServiceListImportSourcesResponse(params).pipe(
      __map(_r => _r.body as V1ListImportSourcesResponse)
    );
  }

  /**
   * Creates a new import source.
   * @param params The `ImportSourceServiceService.ImportSourceServiceCreateImportSourceParams` containing the following parameters:
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
   *
   * - `importSource`: The import source to create.
   *
   * @return A successful response.
   */
  ImportSourceServiceCreateImportSourceResponse(params: ImportSourceServiceService.ImportSourceServiceCreateImportSourceParams): __Observable<__StrictHttpResponse<V1ImportSource>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.importSource;
    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/importSources`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ImportSource>;
      })
    );
  }
  /**
   * Creates a new import source.
   * @param params The `ImportSourceServiceService.ImportSourceServiceCreateImportSourceParams` containing the following parameters:
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
   *
   * - `importSource`: The import source to create.
   *
   * @return A successful response.
   */
  ImportSourceServiceCreateImportSource(params: ImportSourceServiceService.ImportSourceServiceCreateImportSourceParams): __Observable<V1ImportSource> {
    return this.ImportSourceServiceCreateImportSourceResponse(params).pipe(
      __map(_r => _r.body as V1ImportSource)
    );
  }
}

module ImportSourceServiceService {

  /**
   * Parameters for ImportSourceServiceUpdateImportSource
   */
  export interface ImportSourceServiceUpdateImportSourceParams {

    /**
     * The resource name of the import source.
     * Format: organizations/{organization}/importSources/{import_source}
     */
    importSourceName: string;

    /**
     * The import source to update.
     */
    importSource: {uid?: string, displayName: string, displayDescription?: string, periodStart: TypeDate, updateTime?: string, createTime?: string, etag?: string};
  }

  /**
   * Parameters for ImportSourceServiceListImportSources
   */
  export interface ImportSourceServiceListImportSourcesParams {

    /**
     * The parent organization resource name.
     * Format: organizations/{organization}
     */
    parent: string;

    /**
     * A page token from a previous ListImportSources call.
     */
    pageToken?: string;

    /**
     * Maximum number of import sources to return. The service may return fewer.
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
     * Example: "display_name=\"BankXY\"".
     */
    filter?: string;
  }

  /**
   * Parameters for ImportSourceServiceCreateImportSource
   */
  export interface ImportSourceServiceCreateImportSourceParams {

    /**
     * The parent organization resource name.
     * Format: organizations/{organization}
     */
    parent: string;

    /**
     * The import source to create.
     */
    importSource: V1ImportSource;
  }
}

export { ImportSourceServiceService }
