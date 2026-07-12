/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1TransactionAssignment } from '../models/v1transaction-assignment';
import { V1ListTransactionAssignmentsResponse } from '../models/v1list-transaction-assignments-response';

/**
 * TransactionAssignmentService manages transaction assignments to budget accounts.
 */
@Injectable({
  providedIn: 'root',
})
class TransactionAssignmentServiceService extends __BaseService {
  static readonly TransactionAssignmentServiceGetTransactionAssignmentPath = '/v1/{name_15}';
  static readonly TransactionAssignmentServiceListTransactionAssignmentsPath = '/v1/{parent_1}/assignments';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Gets a single transaction assignment by resource name.
   * Authorization:
   *   Scope: transactions:read
   *   Permission: PERMISSION_TRANSACTIONS_READ
   *   Domain: organization-scoped
   * @param name_15 The resource name of the transaction assignment.
   * Format: organizations/{organization}/transactions/{transaction}/assignments/{assignment}
   * @return A successful response.
   */
  TransactionAssignmentServiceGetTransactionAssignmentResponse(name15: string): __Observable<__StrictHttpResponse<V1TransactionAssignment>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(name15))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1TransactionAssignment>;
      })
    );
  }
  /**
   * Gets a single transaction assignment by resource name.
   * Authorization:
   *   Scope: transactions:read
   *   Permission: PERMISSION_TRANSACTIONS_READ
   *   Domain: organization-scoped
   * @param name_15 The resource name of the transaction assignment.
   * Format: organizations/{organization}/transactions/{transaction}/assignments/{assignment}
   * @return A successful response.
   */
  TransactionAssignmentServiceGetTransactionAssignment(name15: string): __Observable<V1TransactionAssignment> {
    return this.TransactionAssignmentServiceGetTransactionAssignmentResponse(name15).pipe(
      __map(_r => _r.body as V1TransactionAssignment)
    );
  }

  /**
   * Lists transaction assignments with keyset pagination and optional filters.
   * Authorization:
   *   Scope: transactions:read
   *   Permission: PERMISSION_TRANSACTIONS_READ
   *   Domain: organization-scoped
   * @param params The `TransactionAssignmentServiceService.TransactionAssignmentServiceListTransactionAssignmentsParams` containing the following parameters:
   *
   * - `parent_1`: The parent transaction resource name.
   *   Format: organizations/{organization}/transactions/{transaction}
   *
   * - `page_token`: A page token from a previous ListTransactionAssignments call.
   *
   * - `page_size`: Maximum number of assignments to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "value desc", "create_time").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: account.
   *   Example: "account=\"organizations/*/accounts/*\"".
   *
   * @return A successful response.
   */
  TransactionAssignmentServiceListTransactionAssignmentsResponse(params: TransactionAssignmentServiceService.TransactionAssignmentServiceListTransactionAssignmentsParams): __Observable<__StrictHttpResponse<V1ListTransactionAssignmentsResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    if (params.pageToken != null) __params = __params.set('page_token', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('page_size', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('order_by', params.orderBy.toString());
    if (params.filter != null) __params = __params.set('filter', params.filter.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent1))}/assignments`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListTransactionAssignmentsResponse>;
      })
    );
  }
  /**
   * Lists transaction assignments with keyset pagination and optional filters.
   * Authorization:
   *   Scope: transactions:read
   *   Permission: PERMISSION_TRANSACTIONS_READ
   *   Domain: organization-scoped
   * @param params The `TransactionAssignmentServiceService.TransactionAssignmentServiceListTransactionAssignmentsParams` containing the following parameters:
   *
   * - `parent_1`: The parent transaction resource name.
   *   Format: organizations/{organization}/transactions/{transaction}
   *
   * - `page_token`: A page token from a previous ListTransactionAssignments call.
   *
   * - `page_size`: Maximum number of assignments to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "value desc", "create_time").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: account.
   *   Example: "account=\"organizations/*/accounts/*\"".
   *
   * @return A successful response.
   */
  TransactionAssignmentServiceListTransactionAssignments(params: TransactionAssignmentServiceService.TransactionAssignmentServiceListTransactionAssignmentsParams): __Observable<V1ListTransactionAssignmentsResponse> {
    return this.TransactionAssignmentServiceListTransactionAssignmentsResponse(params).pipe(
      __map(_r => _r.body as V1ListTransactionAssignmentsResponse)
    );
  }
}

module TransactionAssignmentServiceService {

  /**
   * Parameters for TransactionAssignmentServiceListTransactionAssignments
   */
  export interface TransactionAssignmentServiceListTransactionAssignmentsParams {

    /**
     * The parent transaction resource name.
     * Format: organizations/{organization}/transactions/{transaction}
     */
    parent1: string;

    /**
     * A page token from a previous ListTransactionAssignments call.
     */
    pageToken?: string;

    /**
     * Maximum number of assignments to return. The service may return fewer.
     * If unspecified, at most 20 are returned. Maximum value is 100.
     */
    pageSize?: number;

    /**
     * Order by expression (e.g. "value desc", "create_time").
     */
    orderBy?: string;

    /**
     * Filter expression conforming to AIP-160.
     * Supported fields: account.
     * Example: "account=\"organizations/*/accounts/*\"".
     */
    filter?: string;
  }
}

export { TransactionAssignmentServiceService }
