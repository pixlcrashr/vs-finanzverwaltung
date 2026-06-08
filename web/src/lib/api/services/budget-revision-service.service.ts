/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1BudgetRevision } from '../models/v1budget-revision';
import { V1ListBudgetRevisionsResponse } from '../models/v1list-budget-revisions-response';
@Injectable({
  providedIn: 'root',
})
class BudgetRevisionServiceService extends __BaseService {
  static readonly BudgetRevisionServiceGetBudgetRevisionPath = '/v1/{name_5}';
  static readonly BudgetRevisionServiceListBudgetRevisionsPath = '/v1/{parent}/revisions';
  static readonly BudgetRevisionServiceCreateBudgetRevisionPath = '/v1/{parent}/revisions';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Gets a single budget revision by resource name.
   * @param name_5 The resource name of the budget revision.
   * Format: organizations/{organization}/budgets/{budget}/revisions/{revision}
   * @return A successful response.
   */
  BudgetRevisionServiceGetBudgetRevisionResponse(name5: string): __Observable<__StrictHttpResponse<V1BudgetRevision>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
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
        return _r as __StrictHttpResponse<V1BudgetRevision>;
      })
    );
  }
  /**
   * Gets a single budget revision by resource name.
   * @param name_5 The resource name of the budget revision.
   * Format: organizations/{organization}/budgets/{budget}/revisions/{revision}
   * @return A successful response.
   */
  BudgetRevisionServiceGetBudgetRevision(name5: string): __Observable<V1BudgetRevision> {
    return this.BudgetRevisionServiceGetBudgetRevisionResponse(name5).pipe(
      __map(_r => _r.body as V1BudgetRevision)
    );
  }

  /**
   * Lists revisions for a budget in reverse chronological order.
   * @param params The `BudgetRevisionServiceService.BudgetRevisionServiceListBudgetRevisionsParams` containing the following parameters:
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * - `pageToken`: A page token from a previous ListBudgetRevisions call.
   *
   * - `pageSize`: Maximum number of revisions to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression. Defaults to reverse chronological order (create_time desc).
   *   Example: "create_time desc", "display_name".
   *
   * @return A successful response.
   */
  BudgetRevisionServiceListBudgetRevisionsResponse(params: BudgetRevisionServiceService.BudgetRevisionServiceListBudgetRevisionsParams): __Observable<__StrictHttpResponse<V1ListBudgetRevisionsResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    if (params.pageToken != null) __params = __params.set('pageToken', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('pageSize', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('orderBy', params.orderBy.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/revisions`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListBudgetRevisionsResponse>;
      })
    );
  }
  /**
   * Lists revisions for a budget in reverse chronological order.
   * @param params The `BudgetRevisionServiceService.BudgetRevisionServiceListBudgetRevisionsParams` containing the following parameters:
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * - `pageToken`: A page token from a previous ListBudgetRevisions call.
   *
   * - `pageSize`: Maximum number of revisions to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression. Defaults to reverse chronological order (create_time desc).
   *   Example: "create_time desc", "display_name".
   *
   * @return A successful response.
   */
  BudgetRevisionServiceListBudgetRevisions(params: BudgetRevisionServiceService.BudgetRevisionServiceListBudgetRevisionsParams): __Observable<V1ListBudgetRevisionsResponse> {
    return this.BudgetRevisionServiceListBudgetRevisionsResponse(params).pipe(
      __map(_r => _r.body as V1ListBudgetRevisionsResponse)
    );
  }

  /**
   * Creates a new revision by capturing the current state of all
   * BudgetAccountValues for the given budget.
   * @param params The `BudgetRevisionServiceService.BudgetRevisionServiceCreateBudgetRevisionParams` containing the following parameters:
   *
   * - `revision`: The revision to create. Only display_name and display_description are
   *   user-supplied; all other fields are populated by the server.
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * @return A successful response.
   */
  BudgetRevisionServiceCreateBudgetRevisionResponse(params: BudgetRevisionServiceService.BudgetRevisionServiceCreateBudgetRevisionParams): __Observable<__StrictHttpResponse<V1BudgetRevision>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;
    __body = params.revision;

    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/revisions`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1BudgetRevision>;
      })
    );
  }
  /**
   * Creates a new revision by capturing the current state of all
   * BudgetAccountValues for the given budget.
   * @param params The `BudgetRevisionServiceService.BudgetRevisionServiceCreateBudgetRevisionParams` containing the following parameters:
   *
   * - `revision`: The revision to create. Only display_name and display_description are
   *   user-supplied; all other fields are populated by the server.
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * @return A successful response.
   */
  BudgetRevisionServiceCreateBudgetRevision(params: BudgetRevisionServiceService.BudgetRevisionServiceCreateBudgetRevisionParams): __Observable<V1BudgetRevision> {
    return this.BudgetRevisionServiceCreateBudgetRevisionResponse(params).pipe(
      __map(_r => _r.body as V1BudgetRevision)
    );
  }
}

module BudgetRevisionServiceService {

  /**
   * Parameters for BudgetRevisionServiceListBudgetRevisions
   */
  export interface BudgetRevisionServiceListBudgetRevisionsParams {

    /**
     * The parent budget resource name.
     * Format: organizations/{organization}/budgets/{budget}
     */
    parent: string;

    /**
     * A page token from a previous ListBudgetRevisions call.
     */
    pageToken?: string;

    /**
     * Maximum number of revisions to return. The service may return fewer.
     * If unspecified, at most 20 are returned. Maximum value is 100.
     */
    pageSize?: number;

    /**
     * Order by expression. Defaults to reverse chronological order (create_time desc).
     * Example: "create_time desc", "display_name".
     */
    orderBy?: string;
  }

  /**
   * Parameters for BudgetRevisionServiceCreateBudgetRevision
   */
  export interface BudgetRevisionServiceCreateBudgetRevisionParams {

    /**
     * The revision to create. Only display_name and display_description are
     * user-supplied; all other fields are populated by the server.
     */
    revision: V1BudgetRevision;

    /**
     * The parent budget resource name.
     * Format: organizations/{organization}/budgets/{budget}
     */
    parent: string;
  }
}

export { BudgetRevisionServiceService }
