/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1BudgetAccountValue } from '../models/v1budget-account-value';
import { V1Decimal } from '../models/v1decimal';
import { V1ListBudgetAccountValuesResponse } from '../models/v1list-budget-account-values-response';
@Injectable({
  providedIn: 'root',
})
class BudgetAccountValueServiceService extends __BaseService {
  static readonly BudgetAccountValueServiceUpdateBudgetAccountValuePath = '/v1/{accountValue.name}';
  static readonly BudgetAccountValueServiceGetBudgetAccountValuePath = '/v1/{name_4}';
  static readonly BudgetAccountValueServiceDeleteBudgetAccountValuePath = '/v1/{name_4}';
  static readonly BudgetAccountValueServiceListBudgetAccountValuesPath = '/v1/{parent}/accountValues';
  static readonly BudgetAccountValueServiceCreateBudgetAccountValuePath = '/v1/{parent}/accountValues';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Updates an existing budget account value.
   * @param params The `BudgetAccountValueServiceService.BudgetAccountValueServiceUpdateBudgetAccountValueParams` containing the following parameters:
   *
   * - `accountValue.name`: The resource name of the budget account value.
   *   Format: organizations/{organization}/budgets/{budget}/accountValues/{account_value}
   *
   * - `accountValue`: The budget account value to update.
   *
   * @return A successful response.
   */
  BudgetAccountValueServiceUpdateBudgetAccountValueResponse(params: BudgetAccountValueServiceService.BudgetAccountValueServiceUpdateBudgetAccountValueParams): __Observable<__StrictHttpResponse<V1BudgetAccountValue>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.accountValue;
    let req = new HttpRequest<any>(
      'PATCH',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.accountValueName))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1BudgetAccountValue>;
      })
    );
  }
  /**
   * Updates an existing budget account value.
   * @param params The `BudgetAccountValueServiceService.BudgetAccountValueServiceUpdateBudgetAccountValueParams` containing the following parameters:
   *
   * - `accountValue.name`: The resource name of the budget account value.
   *   Format: organizations/{organization}/budgets/{budget}/accountValues/{account_value}
   *
   * - `accountValue`: The budget account value to update.
   *
   * @return A successful response.
   */
  BudgetAccountValueServiceUpdateBudgetAccountValue(params: BudgetAccountValueServiceService.BudgetAccountValueServiceUpdateBudgetAccountValueParams): __Observable<V1BudgetAccountValue> {
    return this.BudgetAccountValueServiceUpdateBudgetAccountValueResponse(params).pipe(
      __map(_r => _r.body as V1BudgetAccountValue)
    );
  }

  /**
   * Gets a single budget account value by resource name.
   * @param name_4 The resource name of the budget account value.
   * Format: organizations/{organization}/budgets/{budget}/accountValues/{account_value}
   * @return A successful response.
   */
  BudgetAccountValueServiceGetBudgetAccountValueResponse(name4: string): __Observable<__StrictHttpResponse<V1BudgetAccountValue>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(name4))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1BudgetAccountValue>;
      })
    );
  }
  /**
   * Gets a single budget account value by resource name.
   * @param name_4 The resource name of the budget account value.
   * Format: organizations/{organization}/budgets/{budget}/accountValues/{account_value}
   * @return A successful response.
   */
  BudgetAccountValueServiceGetBudgetAccountValue(name4: string): __Observable<V1BudgetAccountValue> {
    return this.BudgetAccountValueServiceGetBudgetAccountValueResponse(name4).pipe(
      __map(_r => _r.body as V1BudgetAccountValue)
    );
  }

  /**
   * Permanently deletes a budget account value.
   * @param name_4 The resource name of the budget account value.
   * Format: organizations/{organization}/budgets/{budget}/accountValues/{account_value}
   * @return A successful response.
   */
  BudgetAccountValueServiceDeleteBudgetAccountValueResponse(name4: string): __Observable<__StrictHttpResponse<{}>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'DELETE',
      this.rootUrl + `/v1/${encodeURIComponent(String(name4))}`,
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
   * Permanently deletes a budget account value.
   * @param name_4 The resource name of the budget account value.
   * Format: organizations/{organization}/budgets/{budget}/accountValues/{account_value}
   * @return A successful response.
   */
  BudgetAccountValueServiceDeleteBudgetAccountValue(name4: string): __Observable<{}> {
    return this.BudgetAccountValueServiceDeleteBudgetAccountValueResponse(name4).pipe(
      __map(_r => _r.body as {})
    );
  }

  /**
   * Lists account values for a budget.
   * @param params The `BudgetAccountValueServiceService.BudgetAccountValueServiceListBudgetAccountValuesParams` containing the following parameters:
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * - `pageToken`: A page token from a previous ListBudgetAccountValues call.
   *
   * - `pageSize`: Maximum number of values to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression (e.g. "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: account_id.
   *   Example: "account_id=\"<uuid>\"".
   *
   * @return A successful response.
   */
  BudgetAccountValueServiceListBudgetAccountValuesResponse(params: BudgetAccountValueServiceService.BudgetAccountValueServiceListBudgetAccountValuesParams): __Observable<__StrictHttpResponse<V1ListBudgetAccountValuesResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    if (params.pageToken != null) __params = __params.set('pageToken', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('pageSize', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('orderBy', params.orderBy.toString());
    if (params.filter != null) __params = __params.set('filter', params.filter.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/accountValues`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListBudgetAccountValuesResponse>;
      })
    );
  }
  /**
   * Lists account values for a budget.
   * @param params The `BudgetAccountValueServiceService.BudgetAccountValueServiceListBudgetAccountValuesParams` containing the following parameters:
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * - `pageToken`: A page token from a previous ListBudgetAccountValues call.
   *
   * - `pageSize`: Maximum number of values to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression (e.g. "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: account_id.
   *   Example: "account_id=\"<uuid>\"".
   *
   * @return A successful response.
   */
  BudgetAccountValueServiceListBudgetAccountValues(params: BudgetAccountValueServiceService.BudgetAccountValueServiceListBudgetAccountValuesParams): __Observable<V1ListBudgetAccountValuesResponse> {
    return this.BudgetAccountValueServiceListBudgetAccountValuesResponse(params).pipe(
      __map(_r => _r.body as V1ListBudgetAccountValuesResponse)
    );
  }

  /**
   * Creates a new budget account value.
   * @param params The `BudgetAccountValueServiceService.BudgetAccountValueServiceCreateBudgetAccountValueParams` containing the following parameters:
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * - `accountValue`: The budget account value to create.
   *
   * @return A successful response.
   */
  BudgetAccountValueServiceCreateBudgetAccountValueResponse(params: BudgetAccountValueServiceService.BudgetAccountValueServiceCreateBudgetAccountValueParams): __Observable<__StrictHttpResponse<V1BudgetAccountValue>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.accountValue;
    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/accountValues`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1BudgetAccountValue>;
      })
    );
  }
  /**
   * Creates a new budget account value.
   * @param params The `BudgetAccountValueServiceService.BudgetAccountValueServiceCreateBudgetAccountValueParams` containing the following parameters:
   *
   * - `parent`: The parent budget resource name.
   *   Format: organizations/{organization}/budgets/{budget}
   *
   * - `accountValue`: The budget account value to create.
   *
   * @return A successful response.
   */
  BudgetAccountValueServiceCreateBudgetAccountValue(params: BudgetAccountValueServiceService.BudgetAccountValueServiceCreateBudgetAccountValueParams): __Observable<V1BudgetAccountValue> {
    return this.BudgetAccountValueServiceCreateBudgetAccountValueResponse(params).pipe(
      __map(_r => _r.body as V1BudgetAccountValue)
    );
  }
}

module BudgetAccountValueServiceService {

  /**
   * Parameters for BudgetAccountValueServiceUpdateBudgetAccountValue
   */
  export interface BudgetAccountValueServiceUpdateBudgetAccountValueParams {

    /**
     * The resource name of the budget account value.
     * Format: organizations/{organization}/budgets/{budget}/accountValues/{account_value}
     */
    accountValueName: string;

    /**
     * The budget account value to update.
     */
    accountValue: {uid?: string, budget?: string, accountId: string, value: V1Decimal, updateTime?: string, createTime?: string, etag?: string};
  }

  /**
   * Parameters for BudgetAccountValueServiceListBudgetAccountValues
   */
  export interface BudgetAccountValueServiceListBudgetAccountValuesParams {

    /**
     * The parent budget resource name.
     * Format: organizations/{organization}/budgets/{budget}
     */
    parent: string;

    /**
     * A page token from a previous ListBudgetAccountValues call.
     */
    pageToken?: string;

    /**
     * Maximum number of values to return. The service may return fewer.
     * If unspecified, at most 20 are returned. Maximum value is 100.
     */
    pageSize?: number;

    /**
     * Order by expression (e.g. "create_time desc").
     */
    orderBy?: string;

    /**
     * Filter expression conforming to AIP-160.
     * Supported fields: account_id.
     * Example: "account_id=\"<uuid>\"".
     */
    filter?: string;
  }

  /**
   * Parameters for BudgetAccountValueServiceCreateBudgetAccountValue
   */
  export interface BudgetAccountValueServiceCreateBudgetAccountValueParams {

    /**
     * The parent budget resource name.
     * Format: organizations/{organization}/budgets/{budget}
     */
    parent: string;

    /**
     * The budget account value to create.
     */
    accountValue: V1BudgetAccountValue;
  }
}

export { BudgetAccountValueServiceService }
