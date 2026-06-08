/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { BaseService as __BaseService } from '../base-service';
import { ApiConfiguration as __Configuration } from '../api-configuration';
import { StrictHttpResponse as __StrictHttpResponse } from '../strict-http-response';
import { Observable as __Observable } from 'rxjs';
import { map as __map, filter as __filter } from 'rxjs/operators';

import { V1ListGroupsResponse } from '../models/v1list-groups-response';
import { V1Group } from '../models/v1group';
import { V1GroupOrganizationPolicy } from '../models/v1group-organization-policy';
@Injectable({
  providedIn: 'root',
})
class GroupServiceService extends __BaseService {
  static readonly GroupServiceListGroupsPath = '/v1/groups';
  static readonly GroupServiceCreateGroupPath = '/v1/groups';
  static readonly GroupServiceUpdateGroupPath = '/v1/{group.name}';
  static readonly GroupServiceDeleteGroupPath = '/v1/{name_5}';
  static readonly GroupServiceGetGroupPath = '/v1/{name_7}';

  constructor(
    config: __Configuration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Lists groups with pagination.
   * @param params The `GroupServiceService.GroupServiceListGroupsParams` containing the following parameters:
   *
   * - `page_token`: A page token from a previous ListGroups call.
   *
   * - `page_size`: Maximum number of groups to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: display_name.
   *
   * @return A successful response.
   */
  GroupServiceListGroupsResponse(params: GroupServiceService.GroupServiceListGroupsParams): __Observable<__StrictHttpResponse<V1ListGroupsResponse>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;
    if (params.pageToken != null) __params = __params.set('page_token', params.pageToken.toString());
    if (params.pageSize != null) __params = __params.set('page_size', params.pageSize.toString());
    if (params.orderBy != null) __params = __params.set('order_by', params.orderBy.toString());
    if (params.filter != null) __params = __params.set('filter', params.filter.toString());
    let req = new HttpRequest<any>(
      'GET',
      this.rootUrl + `/v1/groups`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1ListGroupsResponse>;
      })
    );
  }
  /**
   * Lists groups with pagination.
   * @param params The `GroupServiceService.GroupServiceListGroupsParams` containing the following parameters:
   *
   * - `page_token`: A page token from a previous ListGroups call.
   *
   * - `page_size`: Maximum number of groups to return. The service may return fewer.
   *   If unspecified, at most 20 are returned. Maximum value is 100.
   *
   * - `order_by`: Order by expression (e.g. "display_name", "create_time desc").
   *
   * - `filter`: Filter expression conforming to AIP-160.
   *   Supported fields: display_name.
   *
   * @return A successful response.
   */
  GroupServiceListGroups(params: GroupServiceService.GroupServiceListGroupsParams): __Observable<V1ListGroupsResponse> {
    return this.GroupServiceListGroupsResponse(params).pipe(
      __map(_r => _r.body as V1ListGroupsResponse)
    );
  }

  /**
   * Creates a new group.
   * @param group The group to create.
   * @return A successful response.
   */
  GroupServiceCreateGroupResponse(group: V1Group): __Observable<__StrictHttpResponse<V1Group>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;
    __body = group;
    let req = new HttpRequest<any>(
      'POST',
      this.rootUrl + `/v1/groups`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1Group>;
      })
    );
  }
  /**
   * Creates a new group.
   * @param group The group to create.
   * @return A successful response.
   */
  GroupServiceCreateGroup(group: V1Group): __Observable<V1Group> {
    return this.GroupServiceCreateGroupResponse(group).pipe(
      __map(_r => _r.body as V1Group)
    );
  }

  /**
   * Updates an existing group.
   * @param params The `GroupServiceService.GroupServiceUpdateGroupParams` containing the following parameters:
   *
   * - `group.name`: The resource name of the group.
   *   Format: groups/{group}
   *
   * - `group`: The group to update.
   *
   * @return A successful response.
   */
  GroupServiceUpdateGroupResponse(params: GroupServiceService.GroupServiceUpdateGroupParams): __Observable<__StrictHttpResponse<V1Group>> {
    let __params = this.newParams();
    let __headers = new HttpHeaders();
    let __body: any = null;

    __body = params.group;
    let req = new HttpRequest<any>(
      'PATCH',
      this.rootUrl + `/v1/${encodeURIComponent(String(params.groupName))}`,
      __body,
      {
        headers: __headers,
        params: __params,
        responseType: 'json'
      });

    return this.http.request<any>(req).pipe(
      __filter(_r => _r instanceof HttpResponse),
      __map((_r) => {
        return _r as __StrictHttpResponse<V1Group>;
      })
    );
  }
  /**
   * Updates an existing group.
   * @param params The `GroupServiceService.GroupServiceUpdateGroupParams` containing the following parameters:
   *
   * - `group.name`: The resource name of the group.
   *   Format: groups/{group}
   *
   * - `group`: The group to update.
   *
   * @return A successful response.
   */
  GroupServiceUpdateGroup(params: GroupServiceService.GroupServiceUpdateGroupParams): __Observable<V1Group> {
    return this.GroupServiceUpdateGroupResponse(params).pipe(
      __map(_r => _r.body as V1Group)
    );
  }

  /**
   * Permanently deletes a group.
   * @param name_5 The resource name of the group.
   * Format: groups/{group}
   * @return A successful response.
   */
  GroupServiceDeleteGroupResponse(name5: string): __Observable<__StrictHttpResponse<{}>> {
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
   * Permanently deletes a group.
   * @param name_5 The resource name of the group.
   * Format: groups/{group}
   * @return A successful response.
   */
  GroupServiceDeleteGroup(name5: string): __Observable<{}> {
    return this.GroupServiceDeleteGroupResponse(name5).pipe(
      __map(_r => _r.body as {})
    );
  }

  /**
   * Gets a single group by resource name.
   * @param name_7 The resource name of the group.
   * Format: groups/{group}
   * @return A successful response.
   */
  GroupServiceGetGroupResponse(name7: string): __Observable<__StrictHttpResponse<V1Group>> {
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
        return _r as __StrictHttpResponse<V1Group>;
      })
    );
  }
  /**
   * Gets a single group by resource name.
   * @param name_7 The resource name of the group.
   * Format: groups/{group}
   * @return A successful response.
   */
  GroupServiceGetGroup(name7: string): __Observable<V1Group> {
    return this.GroupServiceGetGroupResponse(name7).pipe(
      __map(_r => _r.body as V1Group)
    );
  }
}

module GroupServiceService {

  /**
   * Parameters for GroupServiceListGroups
   */
  export interface GroupServiceListGroupsParams {

    /**
     * A page token from a previous ListGroups call.
     */
    pageToken?: string;

    /**
     * Maximum number of groups to return. The service may return fewer.
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
     */
    filter?: string;
  }

  /**
   * Parameters for GroupServiceUpdateGroup
   */
  export interface GroupServiceUpdateGroupParams {

    /**
     * The resource name of the group.
     * Format: groups/{group}
     */
    groupName: string;

    /**
     * The group to update.
     */
    group: {uid?: string, display_name: string, display_description?: string, organization_policies?: Array<V1GroupOrganizationPolicy>, update_time?: string, create_time?: string, etag?: string};
  }
}

export { GroupServiceService }
