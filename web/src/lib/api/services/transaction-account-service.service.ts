/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1TransactionAccount } from '../models/v1transaction-account';
import { V1ListTransactionAccountsResponse } from '../models/v1list-transaction-accounts-response';
@Injectable({
  providedIn: 'root',
})
class TransactionAccountServiceService extends __BaseService {
  static readonly TransactionAccountServiceDeleteTransactionAccountPath = '/v1/{name_12}';
  static readonly TransactionAccountServiceGetTransactionAccountPath = '/v1/{name_14}';
  static readonly TransactionAccountServiceListTransactionAccountsPath = '/v1/{parent}/transactionAccounts';
  static readonly TransactionAccountServiceCreateTransactionAccountPath = '/v1/{parent}/transactionAccounts';
  static readonly TransactionAccountServiceUpdateTransactionAccountPath = '/v1/{transaction_account.name}';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Permanently deletes a transaction account.
   * @param name_12 The resource name of the transaction account.
   * Format: organizations/{organization}/transactionAccounts/{transaction_account}
   * @return A successful response.
   */
  TransactionAccountServiceDeleteTransactionAccountResponse(name12: string): __Observable<__StrictHttpResponse<{}>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'DELETE',
      this.rootUrl + `/v1/${encodeURIComponent(String(name12))}`,
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
   * Permanently deletes a transaction account.
   * @param name_12 The resource name of the transaction account.
   * Format: organizations/{organization}/transactionAccounts/{transaction_account}
   * @return A successful response.
   */
  TransactionAccountServiceDeleteTransactionAccount(name12: string): __Observable<{}> {
    return this.TransactionAccountServiceDeleteTransactionAccountResponse(name12).pipe(
      __map(_r => _r.body as {})
    );
  }

  /**
   * Gets a single transaction account by resource name.
   * @param name_14 The resource name of the transaction account.
   * Format: organizations/{organization}/transactionAccounts/{transaction_account}
   * @return A successful response.
   */
  TransactionAccountServiceGetTransactionAccountResponse(name14: string): __Observable<__StrictHttpResponse<V1TransactionAccount>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(name14))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1TransactionAccount>;
      })
    );
  }
  /**
   * Gets a single transaction account by resource name.
   * @param name_14 The resource name of the transaction account.
   * Format: organizations/{organization}/transactionAccounts/{transaction_account}
   * @return A successful response.
   */
  TransactionAccountServiceGetTransactionAccount(name14: string): __Observable<V1TransactionAccount> {
    return this.TransactionAccountServiceGetTransactionAccountResponse(name14).pipe(
      __map(_r => _r.body as V1TransactionAccount)
    );
  }

  /**
   * Lists transaction accounts with pagination.
   * @param params The `TransactionAccountServiceService.TransactionAccountServiceListTransactionAccountsParams` containing the following parameters:
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
   *
   * - `page_token`: A page token from a previous ListTransactionAccounts call.
   *
   * - `page_size`: Maximum number of accounts to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "code", "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: import_source_id, code, display_name.
   *   Example: "import_source_id=\"<uuid>\"" or "code:\"IBAN\"".
   *
   * @return A successful response.
   */
  TransactionAccountServiceListTransactionAccountsResponse(params: TransactionAccountServiceService.TransactionAccountServiceListTransactionAccountsParams): __Observable<__StrictHttpResponse<V1ListTransactionAccountsResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    if (params.pageToken != null) __params = __params.set('page_token', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('page_size', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('order_by', params.orderBy.toString());
    if (params.filter != null) __params = __params.set('filter', params.filter.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/transactionAccounts`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListTransactionAccountsResponse>;
      })
    );
  }
  /**
   * Lists transaction accounts with pagination.
   * @param params The `TransactionAccountServiceService.TransactionAccountServiceListTransactionAccountsParams` containing the following parameters:
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
   *
   * - `page_token`: A page token from a previous ListTransactionAccounts call.
   *
   * - `page_size`: Maximum number of accounts to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "code", "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: import_source_id, code, display_name.
   *   Example: "import_source_id=\"<uuid>\"" or "code:\"IBAN\"".
   *
   * @return A successful response.
   */
  TransactionAccountServiceListTransactionAccounts(params: TransactionAccountServiceService.TransactionAccountServiceListTransactionAccountsParams): __Observable<V1ListTransactionAccountsResponse> {
    return this.TransactionAccountServiceListTransactionAccountsResponse(params).pipe(
      __map(_r => _r.body as V1ListTransactionAccountsResponse)
    );
  }

  /**
   * Creates a new transaction account.
   * @param params The `TransactionAccountServiceService.TransactionAccountServiceCreateTransactionAccountParams` containing the following parameters:
   *
   * - `transaction_account`: The transaction account to create.
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
   *
   * - `transaction_account_id`: The ID to use for the transaction account. If not provided, a
   *   system-generated UUID will be used. Must be unique within the parent organization.
   *
   * @return A successful response.
   */
  TransactionAccountServiceCreateTransactionAccountResponse(params: TransactionAccountServiceService.TransactionAccountServiceCreateTransactionAccountParams): __Observable<__StrictHttpResponse<V1TransactionAccount>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;
    __body = params.transactionAccount;

    if (params.transactionAccountId != null) __params = __params.set('transaction_account_id', params.transactionAccountId.toString());
    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.parent))}/transactionAccounts`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1TransactionAccount>;
      })
    );
  }
  /**
   * Creates a new transaction account.
   * @param params The `TransactionAccountServiceService.TransactionAccountServiceCreateTransactionAccountParams` containing the following parameters:
   *
   * - `transaction_account`: The transaction account to create.
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
   *
   * - `transaction_account_id`: The ID to use for the transaction account. If not provided, a
   *   system-generated UUID will be used. Must be unique within the parent organization.
   *
   * @return A successful response.
   */
  TransactionAccountServiceCreateTransactionAccount(params: TransactionAccountServiceService.TransactionAccountServiceCreateTransactionAccountParams): __Observable<V1TransactionAccount> {
    return this.TransactionAccountServiceCreateTransactionAccountResponse(params).pipe(
      __map(_r => _r.body as V1TransactionAccount)
    );
  }

  /**
   * Updates an existing transaction account.
   * @param params The `TransactionAccountServiceService.TransactionAccountServiceUpdateTransactionAccountParams` containing the following parameters:
   *
   * - `transaction_account.name`: The resource name of the transaction account.
   *   Format: organizations/{organization}/transactionAccounts/{transaction_account}
   *
   * - `transaction_account`: The transaction account to update.
   *
   * @return A successful response.
   */
  TransactionAccountServiceUpdateTransactionAccountResponse(params: TransactionAccountServiceService.TransactionAccountServiceUpdateTransactionAccountParams): __Observable<__StrictHttpResponse<V1TransactionAccount>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.transactionAccount;
    let req = new HttpRequest<any>(
      'PATCH',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.transactionAccountName))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1TransactionAccount>;
      })
    );
  }
  /**
   * Updates an existing transaction account.
   * @param params The `TransactionAccountServiceService.TransactionAccountServiceUpdateTransactionAccountParams` containing the following parameters:
   *
   * - `transaction_account.name`: The resource name of the transaction account.
   *   Format: organizations/{organization}/transactionAccounts/{transaction_account}
   *
   * - `transaction_account`: The transaction account to update.
   *
   * @return A successful response.
   */
  TransactionAccountServiceUpdateTransactionAccount(params: TransactionAccountServiceService.TransactionAccountServiceUpdateTransactionAccountParams): __Observable<V1TransactionAccount> {
    return this.TransactionAccountServiceUpdateTransactionAccountResponse(params).pipe(
      __map(_r => _r.body as V1TransactionAccount)
    );
  }
}

module TransactionAccountServiceService {

  /**
   * Parameters for TransactionAccountServiceListTransactionAccounts
   */
  export interface TransactionAccountServiceListTransactionAccountsParams {

    /**
     * The parent organization resource name.
     * Format: organizations/{organization}
     */
    parent: string;

    /**
     * A page token from a previous ListTransactionAccounts call.
     */
    pageToken?: string;

    /**
     * Maximum number of accounts to return. The service may return fewer.
     * If unspecified, at most 20 are returned. Maximum value is 100.
     */
    pageSize?: number;

    /**
     * Order by expression (e.g. "code", "display_name", "create_time desc").
     */
    orderBy?: string;

    /**
     * Filter expression conforming to AIP-160.
     * Supported fields: import_source_id, code, display_name.
     * Example: "import_source_id=\"<uuid>\"" or "code:\"IBAN\"".
     */
    filter?: string;
  }

  /**
   * Parameters for TransactionAccountServiceCreateTransactionAccount
   */
  export interface TransactionAccountServiceCreateTransactionAccountParams {

    /**
     * The transaction account to create.
     */
    transactionAccount: V1TransactionAccount;

    /**
     * The parent organization resource name.
     * Format: organizations/{organization}
     */
    parent: string;

    /**
     * The ID to use for the transaction account. If not provided, a
     * system-generated UUID will be used. Must be unique within the parent organization.
     */
    transactionAccountId?: string;
  }

  /**
   * Parameters for TransactionAccountServiceUpdateTransactionAccount
   */
  export interface TransactionAccountServiceUpdateTransactionAccountParams {

    /**
     * The resource name of the transaction account.
     * Format: organizations/{organization}/transactionAccounts/{transaction_account}
     */
    transactionAccountName: string;

    /**
     * The transaction account to update.
     */
    transactionAccount: {uid?: string, code: string, import_source_id: string, display_name?: string, display_description?: string, update_time?: string, create_time?: string, etag?: string};
  }
}

export { TransactionAccountServiceService }
