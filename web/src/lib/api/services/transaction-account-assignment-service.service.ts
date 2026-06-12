/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1TransactionAccountAssignment } from '../models/v1transaction-account-assignment';
import { V1Decimal } from '../models/v1decimal';
import { V1ListTransactionAccountAssignmentsResponse } from '../models/v1list-transaction-account-assignments-response';
@Injectable({
  providedIn: 'root',
})
class TransactionAccountAssignmentServiceService extends __BaseService {
  static readonly TransactionAccountAssignmentServiceUpdateTransactionAccountAssignmentPath = '/v1/{assignment.name_1}';
  static readonly TransactionAccountAssignmentServiceDeleteTransactionAccountAssignmentPath = '/v1/{name_13}';
  static readonly TransactionAccountAssignmentServiceGetTransactionAccountAssignmentPath = '/v1/{name_15}';
  static readonly TransactionAccountAssignmentServiceListTransactionAccountAssignmentsPath = '/v1/{parent_1}/assignments';
  static readonly TransactionAccountAssignmentServiceCreateTransactionAccountAssignmentPath = '/v1/{parent_1}/assignments';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Updates an existing assignment.
   * @param params The `TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceUpdateTransactionAccountAssignmentParams` containing the following parameters:
   *
   * - `assignment.name_1`: The resource name of the assignment.
   *   Format: organizations/{organization}/transactions/{transaction}/assignments/{assignment}
   *
   * - `assignment`: The assignment to update.
   *
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceUpdateTransactionAccountAssignmentResponse(params: TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceUpdateTransactionAccountAssignmentParams): __Observable<__StrictHttpResponse<V1TransactionAccountAssignment>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.assignment;
    let req = new HttpRequest<any>(
      'PATCH',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.assignmentName1))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1TransactionAccountAssignment>;
      })
    );
  }
  /**
   * Updates an existing assignment.
   * @param params The `TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceUpdateTransactionAccountAssignmentParams` containing the following parameters:
   *
   * - `assignment.name_1`: The resource name of the assignment.
   *   Format: organizations/{organization}/transactions/{transaction}/assignments/{assignment}
   *
   * - `assignment`: The assignment to update.
   *
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceUpdateTransactionAccountAssignment(params: TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceUpdateTransactionAccountAssignmentParams): __Observable<V1TransactionAccountAssignment> {
    return this.TransactionAccountAssignmentServiceUpdateTransactionAccountAssignmentResponse(params).pipe(
      __map(_r => _r.body as V1TransactionAccountAssignment)
    );
  }

  /**
   * Permanently deletes an assignment.
   * @param name_13 The resource name of the assignment.
   * Format: organizations/{organization}/transactions/{transaction}/assignments/{assignment}
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceDeleteTransactionAccountAssignmentResponse(name13: string): __Observable<__StrictHttpResponse<{}>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'DELETE',
      this.rootUrl + `/v1/${encodeURIComponent(String(name13))}`,
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
   * Permanently deletes an assignment.
   * @param name_13 The resource name of the assignment.
   * Format: organizations/{organization}/transactions/{transaction}/assignments/{assignment}
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceDeleteTransactionAccountAssignment(name13: string): __Observable<{}> {
    return this.TransactionAccountAssignmentServiceDeleteTransactionAccountAssignmentResponse(name13).pipe(
      __map(_r => _r.body as {})
    );
  }

  /**
   * Gets a single assignment by resource name.
   * @param name_15 The resource name of the assignment.
   * Format: organizations/{organization}/transactions/{transaction}/assignments/{assignment}
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceGetTransactionAccountAssignmentResponse(name15: string): __Observable<__StrictHttpResponse<V1TransactionAccountAssignment>> {
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
        return _r as __StrictHttpResponse<V1TransactionAccountAssignment>;
      })
    );
  }
  /**
   * Gets a single assignment by resource name.
   * @param name_15 The resource name of the assignment.
   * Format: organizations/{organization}/transactions/{transaction}/assignments/{assignment}
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceGetTransactionAccountAssignment(name15: string): __Observable<V1TransactionAccountAssignment> {
    return this.TransactionAccountAssignmentServiceGetTransactionAccountAssignmentResponse(name15).pipe(
      __map(_r => _r.body as V1TransactionAccountAssignment)
    );
  }

  /**
   * Lists assignments for a transaction.
   * @param params The `TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceListTransactionAccountAssignmentsParams` containing the following parameters:
   *
   * - `parent_1`: The parent transaction resource name.
   *   Format: organizations/{organization}/transactions/{transaction}
   *
   * - `page_token`: A page token from a previous ListTransactionAccountAssignments call.
   *
   * - `page_size`: Maximum number of assignments to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: account_id, value.
   *   Example: "account_id=\"<uuid>\"".
   *
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceListTransactionAccountAssignmentsResponse(params: TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceListTransactionAccountAssignmentsParams): __Observable<__StrictHttpResponse<V1ListTransactionAccountAssignmentsResponse>> {
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
        return _r as __StrictHttpResponse<V1ListTransactionAccountAssignmentsResponse>;
      })
    );
  }
  /**
   * Lists assignments for a transaction.
   * @param params The `TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceListTransactionAccountAssignmentsParams` containing the following parameters:
   *
   * - `parent_1`: The parent transaction resource name.
   *   Format: organizations/{organization}/transactions/{transaction}
   *
   * - `page_token`: A page token from a previous ListTransactionAccountAssignments call.
   *
   * - `page_size`: Maximum number of assignments to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: account_id, value.
   *   Example: "account_id=\"<uuid>\"".
   *
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceListTransactionAccountAssignments(params: TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceListTransactionAccountAssignmentsParams): __Observable<V1ListTransactionAccountAssignmentsResponse> {
    return this.TransactionAccountAssignmentServiceListTransactionAccountAssignmentsResponse(params).pipe(
      __map(_r => _r.body as V1ListTransactionAccountAssignmentsResponse)
    );
  }

  /**
   * Creates a new assignment.
   * @param params The `TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceCreateTransactionAccountAssignmentParams` containing the following parameters:
   *
   * - `parent_1`: The parent transaction resource name.
   *   Format: organizations/{organization}/transactions/{transaction}
   *
   * - `assignment`: The assignment to create.
   *
   * - `transaction_account_assignment_id`: The ID to use for the assignment. If not provided, a system-generated UUID
   *   will be used. Must be unique within the parent transaction.
   *
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceCreateTransactionAccountAssignmentResponse(params: TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceCreateTransactionAccountAssignmentParams): __Observable<__StrictHttpResponse<V1TransactionAccountAssignment>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.assignment;
    if (params.transactionAccountAssignmentId != null) __params = __params.set('transaction_account_assignment_id', params.transactionAccountAssignmentId.toString());
    let req = new HttpRequest<any>(
      'POST',
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
        return _r as __StrictHttpResponse<V1TransactionAccountAssignment>;
      })
    );
  }
  /**
   * Creates a new assignment.
   * @param params The `TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceCreateTransactionAccountAssignmentParams` containing the following parameters:
   *
   * - `parent_1`: The parent transaction resource name.
   *   Format: organizations/{organization}/transactions/{transaction}
   *
   * - `assignment`: The assignment to create.
   *
   * - `transaction_account_assignment_id`: The ID to use for the assignment. If not provided, a system-generated UUID
   *   will be used. Must be unique within the parent transaction.
   *
   * @return A successful response.
   */
  TransactionAccountAssignmentServiceCreateTransactionAccountAssignment(params: TransactionAccountAssignmentServiceService.TransactionAccountAssignmentServiceCreateTransactionAccountAssignmentParams): __Observable<V1TransactionAccountAssignment> {
    return this.TransactionAccountAssignmentServiceCreateTransactionAccountAssignmentResponse(params).pipe(
      __map(_r => _r.body as V1TransactionAccountAssignment)
    );
  }
}

module TransactionAccountAssignmentServiceService {

  /**
   * Parameters for TransactionAccountAssignmentServiceUpdateTransactionAccountAssignment
   */
  export interface TransactionAccountAssignmentServiceUpdateTransactionAccountAssignmentParams {

    /**
     * The resource name of the assignment.
     * Format: organizations/{organization}/transactions/{transaction}/assignments/{assignment}
     */
    assignmentName1: string;

    /**
     * The assignment to update.
     */
    assignment: {uid?: string, transaction?: string, account_id: string, value: V1Decimal, update_time?: string, create_time?: string, etag?: string};
  }

  /**
   * Parameters for TransactionAccountAssignmentServiceListTransactionAccountAssignments
   */
  export interface TransactionAccountAssignmentServiceListTransactionAccountAssignmentsParams {

    /**
     * The parent transaction resource name.
     * Format: organizations/{organization}/transactions/{transaction}
     */
    parent1: string;

    /**
     * A page token from a previous ListTransactionAccountAssignments call.
     */
    pageToken?: string;

    /**
     * Maximum number of assignments to return. The service may return fewer.
     * If unspecified, at most 20 are returned. Maximum value is 100.
     */
    pageSize?: number;

    /**
     * Order by expression (e.g. "create_time desc").
     */
    orderBy?: string;

    /**
     * Filter expression conforming to AIP-160.
     * Supported fields: account_id, value.
     * Example: "account_id=\"<uuid>\"".
     */
    filter?: string;
  }

  /**
   * Parameters for TransactionAccountAssignmentServiceCreateTransactionAccountAssignment
   */
  export interface TransactionAccountAssignmentServiceCreateTransactionAccountAssignmentParams {

    /**
     * The parent transaction resource name.
     * Format: organizations/{organization}/transactions/{transaction}
     */
    parent1: string;

    /**
     * The assignment to create.
     */
    assignment: V1TransactionAccountAssignment;

    /**
     * The ID to use for the assignment. If not provided, a system-generated UUID
     * will be used. Must be unique within the parent transaction.
     */
    transactionAccountAssignmentId?: string;
  }
}

export { TransactionAccountAssignmentServiceService }
