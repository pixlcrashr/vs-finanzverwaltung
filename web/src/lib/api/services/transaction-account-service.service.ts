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
  static readonly TransactionAccountServiceDeleteTransactionAccountPath = '/v1/{name_11}';
  static readonly TransactionAccountServiceGetTransactionAccountPath = '/v1/{name_13}';
  static readonly TransactionAccountServiceListTransactionAccountsPath = '/v1/{parent}/transactionAccounts';
  static readonly TransactionAccountServiceCreateTransactionAccountPath = '/v1/{parent}/transactionAccounts';
  static readonly TransactionAccountServiceUpdateTransactionAccountPath = '/v1/{transactionAccount.name}';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Permanently deletes a transaction account.
   * @param name_11 The resource name of the transaction account.
   * Format: organizations/{organization}/transactionAccounts/{transaction_account}
   * @return A successful response.
   */
  TransactionAccountServiceDeleteTransactionAccountResponse(name11: string): __Observable<__StrictHttpResponse<{}>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'DELETE',
      this.rootUrl + `/v1/${encodeURIComponent(String(name11))}`,
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
   * @param name_11 The resource name of the transaction account.
   * Format: organizations/{organization}/transactionAccounts/{transaction_account}
   * @return A successful response.
   */
  TransactionAccountServiceDeleteTransactionAccount(name11: string): __Observable<{}> {
    return this.TransactionAccountServiceDeleteTransactionAccountResponse(name11).pipe(
      __map(_r => _r.body as {})
    );
  }

  /**
   * Gets a single transaction account by resource name.
   * @param name_13 The resource name of the transaction account.
   * Format: organizations/{organization}/transactionAccounts/{transaction_account}
   * @return A successful response.
   */
  TransactionAccountServiceGetTransactionAccountResponse(name13: string): __Observable<__StrictHttpResponse<V1TransactionAccount>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    let req = new HttpRequest<any>(
      'GET',
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
        return _r as __StrictHttpResponse<V1TransactionAccount>;
      })
    );
  }
  /**
   * Gets a single transaction account by resource name.
   * @param name_13 The resource name of the transaction account.
   * Format: organizations/{organization}/transactionAccounts/{transaction_account}
   * @return A successful response.
   */
  TransactionAccountServiceGetTransactionAccount(name13: string): __Observable<V1TransactionAccount> {
    return this.TransactionAccountServiceGetTransactionAccountResponse(name13).pipe(
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
   * - `pageToken`: A page token from a previous ListTransactionAccounts call.
   *
   * - `pageSize`: Maximum number of accounts to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression (e.g. "code", "display_name", "create_time desc").
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

    if (params.pageToken != null) __params = __params.set('pageToken', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('pageSize', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('orderBy', params.orderBy.toString());
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
   * - `pageToken`: A page token from a previous ListTransactionAccounts call.
   *
   * - `pageSize`: Maximum number of accounts to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `orderBy`: Order by expression (e.g. "code", "display_name", "create_time desc").
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
   * - `transactionAccount`: The transaction account to create.
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
   *
   * @return A successful response.
   */
  TransactionAccountServiceCreateTransactionAccountResponse(params: TransactionAccountServiceService.TransactionAccountServiceCreateTransactionAccountParams): __Observable<__StrictHttpResponse<V1TransactionAccount>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;
    __body = params.transactionAccount;

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
   * - `transactionAccount`: The transaction account to create.
   *
   * - `parent`: The parent organization resource name.
   *   Format: organizations/{organization}
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
   * - `transactionAccount.name`: The resource name of the transaction account.
   *   Format: organizations/{organization}/transactionAccounts/{transaction_account}
   *
   * - `transactionAccount`: The transaction account to update.
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
   * - `transactionAccount.name`: The resource name of the transaction account.
   *   Format: organizations/{organization}/transactionAccounts/{transaction_account}
   *
   * - `transactionAccount`: The transaction account to update.
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
    transactionAccount: {uid?: string, code: string, importSourceId: string, displayName?: string, displayDescription?: string, updateTime?: string, createTime?: string, etag?: string};
  }
}

export { TransactionAccountServiceService }
