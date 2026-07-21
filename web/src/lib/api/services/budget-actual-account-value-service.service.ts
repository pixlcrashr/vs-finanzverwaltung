/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1BudgetActualAccountValue } from '../models/v1budget-actual-account-value';
import { V1ListBudgetActualAccountValuesResponse } from '../models/v1list-budget-actual-account-values-response';
@Injectable({
  providedIn: 'root',
})
class BudgetActualAccountValueServiceService extends __BaseService {
  static readonly BudgetActualAccountValueServiceGetBudgetActualAccountValuePath = '/v1/{name_5}';
  static readonly BudgetActualAccountValueServiceListBudgetActualAccountValuesPath = '/v1/{parent}/actualAccountValues';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Gets the computed actual value for a single account within a budget.
   * Authorization:
   *   Scope: budgets:read
   *   Permission: budgets:read
   *   Domain: organization-scoped
   * @param name_5 The resource name of the budget actual account value.
   * Format: organizations/{organization}/budgets/{budget}/actualAccountValues/{account}
   * @return A successful response.
   */
  BudgetActualAccountValueServiceGetBudgetActualAccountValueResponse(name5: string): __Observable<__StrictHttpResponse<V1BudgetActualAccountValue>> {
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
        return _r as __StrictHttpResponse<V1BudgetActualAccountValue>;
      })
    );
  }
  /**
   * Gets the computed actual value for a single account within a budget.
   * Authorization:
   *   Scope: budgets:read
   *   Permission: budgets:read
   *   Domain: organization-scoped
   * @param name_5 The resource name of the budget actual account value.
   * Format: organizations/{organization}/budgets/{budget}/actualAccountValues/{account}
   * @return A successful response.
   */
  BudgetActualAccountValueServiceGetBudgetActualAccountValue(name5: string): __Observable<V1BudgetActualAccountValue> {
    return this.BudgetActualAccountValueServiceGetBudgetActualAccountValueResponse(name5).pipe(
      __map(_r => _r.body as V1BudgetActualAccountValue)
    );
  }

  /**
   * Lists computed actual account values for a budget, with pagination.
   * Authorization:
   *   Scope: budgets:read
   *   Permission: budgets:read
   *   Domain: organization-scoped
   * @param params The `BudgetActualAccountValueServiceService.BudgetActualAccountValueServiceListBudgetActualAccountValuesParams` containing the following parameters:
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * - `page_token`: A page token from a previous ListBudgetActualAccountValues call.
   *
   * - `page_size`: Maximum number of actual account values to return. The service may return
   *   fewer. If unspecified, at most 50 are returned. Maximum value is 200.
   *
   * - `order_by`: Order by expression (e.g. "account_id", "value desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: account_id.
   *   Example: "account_id=\"<uuid>\"".
   *
   * @return A successful response.
   */
  BudgetActualAccountValueServiceListBudgetActualAccountValuesResponse(params: BudgetActualAccountValueServiceService.BudgetActualAccountValueServiceListBudgetActualAccountValuesParams): __Observable<__StrictHttpResponse<V1ListBudgetActualAccountValuesResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    if (params.pageToken != null) __params = __params.set('page_token', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('page_size', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('order_by', params.orderBy.toString());
    if (params.filter != null) __params = __params.set('filter', params.filter.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/actualAccountValues`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListBudgetActualAccountValuesResponse>;
      })
    );
  }
  /**
   * Lists computed actual account values for a budget, with pagination.
   * Authorization:
   *   Scope: budgets:read
   *   Permission: budgets:read
   *   Domain: organization-scoped
   * @param params The `BudgetActualAccountValueServiceService.BudgetActualAccountValueServiceListBudgetActualAccountValuesParams` containing the following parameters:
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * - `page_token`: A page token from a previous ListBudgetActualAccountValues call.
   *
   * - `page_size`: Maximum number of actual account values to return. The service may return
   *   fewer. If unspecified, at most 50 are returned. Maximum value is 200.
   *
   * - `order_by`: Order by expression (e.g. "account_id", "value desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: account_id.
   *   Example: "account_id=\"<uuid>\"".
   *
   * @return A successful response.
   */
  BudgetActualAccountValueServiceListBudgetActualAccountValues(params: BudgetActualAccountValueServiceService.BudgetActualAccountValueServiceListBudgetActualAccountValuesParams): __Observable<V1ListBudgetActualAccountValuesResponse> {
    return this.BudgetActualAccountValueServiceListBudgetActualAccountValuesResponse(params).pipe(
      __map(_r => _r.body as V1ListBudgetActualAccountValuesResponse)
    );
  }
}

module BudgetActualAccountValueServiceService {

  /**
   * Parameters for BudgetActualAccountValueServiceListBudgetActualAccountValues
   */
  export interface BudgetActualAccountValueServiceListBudgetActualAccountValuesParams {

    /**
     * The parent budget resource name.
     * Format: organizations/{organization}/budgets/{budget}
     */
    parent: string;

    /**
     * A page token from a previous ListBudgetActualAccountValues call.
     */
    pageToken?: string;

    /**
     * Maximum number of actual account values to return. The service may return
     * fewer. If unspecified, at most 50 are returned. Maximum value is 200.
     */
    pageSize?: number;

    /**
     * Order by expression (e.g. "account_id", "value desc").
     */
    orderBy?: string;

    /**
     * Filter expression conforming to AIP-160.
     * Supported fields: account_id.
     * Example: "account_id=\"<uuid>\"".
     */
    filter?: string;
  }
}

export { BudgetActualAccountValueServiceService }
