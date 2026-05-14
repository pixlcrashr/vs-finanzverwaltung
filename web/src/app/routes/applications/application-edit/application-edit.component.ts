import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../../shared/components';
import {
  Application,
  ApplicationComment,
  ApplicationAuditEntry,
  ApplicationStatus,
  AuditAction,
  getApplicationStatusLabel,
  getApplicationStatusVariant,
  getApplicationTypeLabel,
  formatCurrency,
  isApplicationEditable,
  CostItem,
} from '../../../shared/models';
import { Committee, UserGroup, Budget } from '../../../shared/models';
import { ApplicationEditDataService } from './application-edit.data-service';

// Union type for activity feed items
type ActivityItem =
  | { type: 'comment'; data: ApplicationComment; timestamp: Date }
  | { type: 'audit'; data: ApplicationAuditEntry; timestamp: Date };

@Component({
  selector: 'app-application-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageContentLayoutComponent,
    ButtonComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs()">
      <div layout-content>
        @if (loading()) {
          <div class="flex flex-1 justify-center">
            <app-loading-spinner [fullPage]="true" i18n-text text="Antrag wird geladen..." />
          </div>
        } @else if (application()) {
          <div class="w-full max-w-4xl mx-auto space-y-6">
            <!-- Header Info with Committee Details -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-3 flex-wrap">
                    <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      <ng-container i18n>Antrag</ng-container> {{ application()!.publicId }}
                    </h1>
                    <app-status-badge [variant]="getStatusVariant(application()!.status)" size="md">
                      {{ getStatusLabel(application()!.status) }}
                    </app-status-badge>
                    <span
                      [class]="application()!.type === 'financial' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'"
                      class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium"
                    >
                      {{ getTypeLabel(application()!.type) }}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <ng-container i18n>Eingereicht von</ng-container>
                    <span class="font-medium text-gray-700 dark:text-gray-300">{{ application()!.createdByUserFullName }}</span>
                    <ng-container i18n>am</ng-container>
                    {{ formatDate(application()!.createdAt) }}
                  </p>
                  <!-- Committee & Group inline -->
                  <div class="mt-3 flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-1.5">
                      <svg class="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <span class="text-gray-500 dark:text-gray-400" i18n>Gremium:</span>
                      <span class="font-medium text-gray-900 dark:text-gray-100">{{ application()!.committeeName }}</span>
                    </div>
                    @if (application()!.userGroupName) {
                      <div class="flex items-center gap-1.5">
                        <svg class="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        <span class="text-gray-500 dark:text-gray-400" i18n>Gruppe:</span>
                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ application()!.userGroupName }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Left Column: Application Details -->
              <div class="lg:col-span-2 space-y-6">
                <!-- Decision Question -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4" i18n>
                    Was soll das Gremium entscheiden?
                  </h2>
                  @if (isEditable()) {
                    <textarea
                      [formControl]="decisionQuestionControl"
                      rows="4"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    ></textarea>
                  } @else {
                    <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {{ application()!.decisionQuestion }}
                    </p>
                  }
                </div>

                <!-- Decision Reason -->
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4" i18n>
                    Warum soll das Gremium entscheiden?
                  </h2>
                  @if (isEditable()) {
                    <textarea
                      [formControl]="decisionReasonControl"
                      rows="6"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    ></textarea>
                  } @else {
                    <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {{ application()!.decisionReason }}
                    </p>
                  }
                </div>

                <!-- Cost Items (Financial Applications) -->
                @if (application()!.type === 'financial' && application()!.financialDetails) {
                  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex items-center justify-between mb-4">
                      <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100" i18n>Kostenpositionen</h2>
                      @if (isEditable()) {
                        <app-button variant="secondary" size="sm" (clicked)="addCostItem()">
                          <ng-container i18n>Position hinzufügen</ng-container>
                        </app-button>
                      }
                    </div>

                    @if (application()!.financialDetails!.costItems.length === 0) {
                      <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4" i18n>
                        Keine Kostenpositionen vorhanden.
                      </p>
                    } @else {
                      <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead class="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <th class="px-3 py-2 text-left text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400" i18n>
                                Beschreibung
                              </th>
                              <th class="px-3 py-2 text-right text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400" i18n>
                                Erwartet
                              </th>
                              <th class="px-3 py-2 text-right text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400" i18n>
                                Geschätzt
                              </th>
                              @if (isEditable()) {
                                <th class="px-3 py-2"></th>
                              }
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                            @for (item of application()!.financialDetails!.costItems; track item.id) {
                              <tr>
                                <td class="px-3 py-2">
                                  <div class="text-sm text-gray-900 dark:text-gray-100">{{ item.summary }}</div>
                                  @if (item.description) {
                                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</div>
                                  }
                                  @if (item.links.length > 0) {
                                    <div class="mt-1 flex flex-wrap gap-1">
                                      @for (link of item.links; track link) {
                                        <a
                                          [href]="link"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          class="text-xs text-blue-600 hover:underline dark:text-blue-400"
                                        >
                                          Link
                                        </a>
                                      }
                                    </div>
                                  }
                                </td>
                                <td class="px-3 py-2 text-right text-sm text-gray-900 dark:text-gray-100">
                                  {{ formatCurrency(item.expectedCost) }}
                                </td>
                                <td class="px-3 py-2 text-right text-sm text-gray-900 dark:text-gray-100">
                                  {{ formatCurrency(item.estimatedCost) }}
                                </td>
                                @if (isEditable()) {
                                  <td class="px-3 py-2 text-right">
                                    <button
                                      (click)="deleteCostItem(item)"
                                      class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs"
                                    >
                                      <ng-container i18n>Entfernen</ng-container>
                                    </button>
                                  </td>
                                }
                              </tr>
                            }
                          </tbody>
                          <tfoot class="bg-gray-50 dark:bg-gray-900">
                            <tr>
                              <td class="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100" i18n>Gesamt</td>
                              <td class="px-3 py-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {{ formatCurrency(application()!.financialDetails!.totalExpectedCost) }}
                              </td>
                              <td class="px-3 py-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {{ formatCurrency(application()!.financialDetails!.totalEstimatedCost) }}
                              </td>
                              @if (isEditable()) {
                                <td></td>
                              }
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    }
                  </div>
                }

                <!-- Activity Feed - Combined Comments & Audit Log (oldest first) -->
                <div>
                  <h2 class="text-sm font-semibold text-gray-900 mb-6" i18n>Aktivität</h2>

                  @if (activityFeed().length === 0) {
                    <p class="text-sm text-gray-500 py-4" i18n>Keine Aktivität vorhanden.</p>
                  } @else {
                    <div class="flow-root">
                      <ul role="list" class="-mb-8">
                        @for (item of visibleActivityFeed(); track item.type === 'comment' ? item.data.id : item.data.id; let isLast = $last) {
                          <li>
                            <div class="relative pb-8">
                              @if (!isLast || (activityFeed().length > 10 && !showAllActivity())) {
                                <span class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                              }
                              <div class="relative flex space-x-3">
                                @if (item.type === 'comment') {
                                  <!-- Comment Item -->
                                  <div>
                                    @if (item.data.statusChange) {
                                      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                                        <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                        </svg>
                                      </span>
                                    } @else if (item.data.isAdminOnly) {
                                      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
                                        <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                      </span>
                                    } @else {
                                      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400">
                                        <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                        </svg>
                                      </span>
                                    }
                                  </div>
                                  <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div class="flex-1">
                                      <p class="text-sm text-gray-500 dark:text-gray-400">
                                        <span class="font-medium text-gray-900 dark:text-gray-100">{{ item.data.authorUserFullName }}</span>
                                        <span class="ml-1" i18n>hat kommentiert</span>
                                        @if (item.data.isAdminOnly) {
                                          <span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" i18n>
                                            Intern
                                          </span>
                                        }
                                      </p>
                                      @if (item.data.statusChange) {
                                        <div class="mt-2 flex items-center gap-2">
                                          <app-status-badge [variant]="getStatusVariant(item.data.statusChange.from)" size="sm">
                                            {{ getStatusLabel(item.data.statusChange.from) }}
                                          </app-status-badge>
                                          <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                          </svg>
                                          <app-status-badge [variant]="getStatusVariant(item.data.statusChange.to)" size="sm">
                                            {{ getStatusLabel(item.data.statusChange.to) }}
                                          </app-status-badge>
                                        </div>
                                      }
                                      <p class="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ item.data.content }}</p>
                                    </div>
                                    <div class="whitespace-nowrap text-right text-xs text-gray-500 dark:text-gray-400">
                                      {{ formatDateTime(item.data.createdAt) }}
                                    </div>
                                  </div>
                                } @else {
                                  <!-- Audit Item -->
                                  <div class="relative">
                                    <span [class]="getAuditIconClass(item.data.action)" class="flex h-8 w-8 items-center justify-center rounded-full">
                                      @switch (item.data.action) {
                                        @case ('create') {
                                          <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                          </svg>
                                        }
                                        @case ('update') {
                                          <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                          </svg>
                                        }
                                        @case ('status_change') {
                                          <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                          </svg>
                                        }
                                        @case ('assign_user') {
                                          <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                                          </svg>
                                        }
                                        @case ('unassign_user') {
                                          <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                                          </svg>
                                        }
                                        @case ('add_comment') {
                                          <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                          </svg>
                                        }
                                        @case ('delete') {
                                          <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                          </svg>
                                        }
                                        @default {
                                          <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        }
                                      }
                                    </span>
                                  </div>
                                  <div class="min-w-0 flex-1 pt-1.5">
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                      <span class="font-medium text-gray-900 dark:text-gray-100">{{ item.data.actorUserFullName }}</span>
                                      <span class="ml-1">{{ getAuditActionLabel(item.data.action) }}</span>
                                    </p>
                                    @if (item.data.fieldName && item.data.oldValue && item.data.newValue) {
                                      <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                        {{ item.data.fieldName }}: {{ item.data.oldValue }} → {{ item.data.newValue }}
                                      </p>
                                    }
                                    <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{{ formatDateTime(item.data.timestamp) }}</p>
                                  </div>
                                }
                              </div>
                            </div>
                          </li>
                        }
                      </ul>
                    </div>
                    @if (activityFeed().length > 10 && !showAllActivity()) {
                      <button
                        (click)="toggleShowAllActivity()"
                        class="mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ng-container i18n>Alle anzeigen ({{ activityFeed().length }})</ng-container>
                      </button>
                    }
                    @if (showAllActivity() && activityFeed().length > 10) {
                      <button
                        (click)="toggleShowAllActivity()"
                        class="mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ng-container i18n>Weniger anzeigen</ng-container>
                      </button>
                    }
                  }

                  <!-- Add Comment Form -->
                  <div class="mt-6 flex gap-3">
                    <div class="flex-shrink-0">
                      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                        <svg class="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </span>
                    </div>
                    <div class="flex-1">
                      <textarea
                        [formControl]="newCommentControl"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        i18n-placeholder
                        placeholder="Kommentar hinzufügen..."
                      ></textarea>
                      <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            [checked]="isAdminOnlyComment()"
                            (change)="isAdminOnlyComment.set($any($event.target).checked)"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400" i18n>Intern</span>
                        </label>
                        <div class="flex items-center gap-2">
                          <!-- Status Change Dropdown -->
                          <select
                            [value]="selectedStatusChange()"
                            (change)="selectedStatusChange.set($any($event.target).value)"
                            class="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                          >
                            <option value="" i18n>Nur Kommentar</option>
                            @for (option of availableStatusTransitions(); track option.status) {
                              <option [value]="option.status">{{ option.label }}</option>
                            }
                          </select>
                          <app-button
                            variant="secondary"
                            size="sm"
                            (clicked)="addComment()"
                            [disabled]="!newCommentControl.value?.trim()"
                          >
                            <ng-container i18n>Senden</ng-container>
                          </app-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Save Button (below form) -->
                @if (isEditable()) {
                  <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <app-button variant="primary" (clicked)="save()" [disabled]="saving()">
                      <ng-container i18n>Änderungen speichern</ng-container>
                    </app-button>
                  </div>
                }
              </div>

              <!-- Right Column: Sidebar -->
              <div class="space-y-6">
                <!-- Financial Details -->
                @if (application()!.type === 'financial' && application()!.financialDetails) {
                  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3" i18n>Finanzdetails</h3>
                    <dl class="space-y-3">
                      @if (application()!.financialDetails!.suggestedBudgetName) {
                        <div>
                          <dt class="text-xs text-gray-500 dark:text-gray-400" i18n>Vorgeschlagenes Budget</dt>
                          <dd class="text-sm text-gray-900 dark:text-gray-100">{{ application()!.financialDetails!.suggestedBudgetName }}</dd>
                        </div>
                      }
                      @if (application()!.financialDetails!.confirmedBudgetName) {
                        <div>
                          <dt class="text-xs text-gray-500 dark:text-gray-400" i18n>Bestätigtes Budget</dt>
                          <dd class="text-sm text-gray-900 dark:text-gray-100 font-medium">{{ application()!.financialDetails!.confirmedBudgetName }}</dd>
                        </div>
                      }
                      @if (application()!.financialDetails!.suggestedInvoiceDeadline) {
                        <div>
                          <dt class="text-xs text-gray-500 dark:text-gray-400" i18n>Vorgeschlagene Abrechnungsfrist</dt>
                          <dd class="text-sm text-gray-900 dark:text-gray-100">{{ formatDate(application()!.financialDetails!.suggestedInvoiceDeadline!) }}</dd>
                        </div>
                      }
                      @if (application()!.financialDetails!.confirmedInvoiceDeadline) {
                        <div>
                          <dt class="text-xs text-gray-500 dark:text-gray-400" i18n>Bestätigte Abrechnungsfrist</dt>
                          <dd class="text-sm text-gray-900 dark:text-gray-100 font-medium">{{ formatDate(application()!.financialDetails!.confirmedInvoiceDeadline!) }}</dd>
                        </div>
                      }
                      @if (application()!.financialDetails!.decayAt) {
                        <div>
                          <dt class="text-xs text-gray-500 dark:text-gray-400" i18n>Verfällt am</dt>
                          <dd class="text-sm text-orange-600 dark:text-orange-400 font-medium">{{ formatDate(application()!.financialDetails!.decayAt!) }}</dd>
                        </div>
                      }
                    </dl>
                  </div>
                }

                <!-- Assigned Users (Financial Applications) -->
                @if (application()!.type === 'financial' && application()!.assignedUsers.length > 0) {
                  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3" i18n>Zugewiesene Benutzer</h3>
                    <ul class="space-y-2">
                      @for (user of application()!.assignedUsers; track user.userId) {
                        <li class="text-sm text-gray-900 dark:text-gray-100">{{ user.fullName }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class ApplicationEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(ApplicationEditDataService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly application = signal<Application | null>(null);
  readonly comments = signal<ApplicationComment[]>([]);
  readonly auditLog = signal<ApplicationAuditEntry[]>([]);
  readonly showAllActivity = signal(false);

  readonly decisionQuestionControl = this.fb.control('', Validators.required);
  readonly decisionReasonControl = this.fb.control('', Validators.required);
  readonly newCommentControl = this.fb.control('');
  readonly isAdminOnlyComment = signal(false);
  readonly selectedStatusChange = signal<ApplicationStatus | ''>('');

  readonly isEditable = computed(() => {
    const app = this.application();
    return app ? isApplicationEditable(app.status) : false;
  });

  // Status transitions based on current status
  readonly availableStatusTransitions = computed<{ status: ApplicationStatus; label: string }[]>(() => {
    const app = this.application();
    if (!app) return [];

    const transitions: Record<ApplicationStatus, { status: ApplicationStatus; label: string }[]> = {
      draft: [
        { status: 'queued_for_agenda', label: $localize`→ Zur Tagesordnung` },
      ],
      queued_for_agenda: [
        { status: 'changes_required', label: $localize`→ Änderungen erforderlich` },
        { status: 'accepted', label: $localize`→ Angenommen` },
        { status: 'rejected', label: $localize`→ Abgelehnt` },
      ],
      changes_required: [
        { status: 'queued_for_agenda', label: $localize`→ Zur Tagesordnung` },
        { status: 'rejected', label: $localize`→ Abgelehnt` },
      ],
      accepted: [
        { status: 'completed', label: $localize`→ Abgeschlossen` },
        { status: 'decayed', label: $localize`→ Verfallen` },
      ],
      rejected: [],
      completed: [],
      decayed: [],
    };

    return transitions[app.status] || [];
  });

  // Combined activity feed: comments + audit entries, sorted oldest first (chronological)
  readonly activityFeed = computed<ActivityItem[]>(() => {
    const commentItems: ActivityItem[] = this.comments().map((c) => ({
      type: 'comment' as const,
      data: c,
      timestamp: new Date(c.createdAt),
    }));
    const auditItems: ActivityItem[] = this.auditLog().map((a) => ({
      type: 'audit' as const,
      data: a,
      timestamp: new Date(a.timestamp),
    }));
    const combined = [...commentItems, ...auditItems];
    // Sort oldest first (chronological order)
    return combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  });

  readonly visibleActivityFeed = computed(() => {
    const feed = this.activityFeed();
    if (this.showAllActivity() || feed.length <= 10) {
      return feed;
    }
    return feed.slice(0, 10);
  });

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const app = this.application();
    return [
      { label: $localize`Anträge`, path: '/applications' },
      { label: app ? app.publicId : '...' },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadApplication(id);
    }
  }

  private loadApplication(id: string): void {
    this.dataService.getApplication(id).subscribe({
      next: (application) => {
        this.application.set(application);
        this.decisionQuestionControl.setValue(application.decisionQuestion);
        this.decisionReasonControl.setValue(application.decisionReason);
        this.loading.set(false);
        this.loadComments(id);
        this.loadAuditLog(id);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.error($localize`Fehler beim Laden des Antrags`);
      },
    });
  }

  private loadComments(id: string): void {
    this.dataService.getComments(id).subscribe({
      next: (comments) => this.comments.set(comments),
    });
  }

  private loadAuditLog(id: string): void {
    this.dataService.getAuditLog(id).subscribe({
      next: (log) => this.auditLog.set(log),
    });
  }

  save(): void {
    const app = this.application();
    if (!app || !this.isEditable()) return;

    this.saving.set(true);
    this.dataService
      .updateApplication(app.id, {
        decisionQuestion: this.decisionQuestionControl.value || '',
        decisionReason: this.decisionReasonControl.value || '',
      })
      .subscribe({
        next: (updated) => {
          this.application.set(updated);
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
          this.notifications.error($localize`Fehler beim Speichern des Antrags`);
        },
      });
  }

  addComment(): void {
    const app = this.application();
    const content = this.newCommentControl.value?.trim();
    if (!app || !content) return;

    const newStatus = this.selectedStatusChange();

    // If status change is selected, change status with comment
    if (newStatus) {
      this.dataService
        .changeStatus(app.id, newStatus, content)
        .subscribe({
          next: (updatedApp) => {
            this.application.set(updatedApp);
            this.newCommentControl.reset();
            this.isAdminOnlyComment.set(false);
            this.selectedStatusChange.set('');
            // Reload comments and audit log to reflect changes
            this.loadComments(app.id);
            this.loadAuditLog(app.id);
          },
        });
    } else {
      // Just add a comment without status change
      this.dataService
        .addComment(app.id, { content, isAdminOnly: this.isAdminOnlyComment() })
        .subscribe({
          next: (comment) => {
            this.comments.update((c) => [...c, comment]);
            this.newCommentControl.reset();
            this.isAdminOnlyComment.set(false);
          },
        });
    }
  }

  addCostItem(): void {
    // TODO: Open dialog to add cost item
  }

  deleteCostItem(item: CostItem): void {
    const app = this.application();
    if (!app) return;

    this.dataService.deleteCostItem(app.id, item.id).subscribe({
      next: () => {
        this.loadApplication(app.id);
      },
    });
  }

  getTypeLabel(type: string): string {
    return getApplicationTypeLabel(type as any);
  }

  getStatusLabel(status: ApplicationStatus): string {
    return getApplicationStatusLabel(status);
  }

  getStatusVariant(status: ApplicationStatus): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
    return getApplicationStatusVariant(status);
  }

  formatCurrency(cents: number): string {
    return formatCurrency(cents);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  toggleShowAllActivity(): void {
    this.showAllActivity.update((v) => !v);
  }

  getAuditIconClass(action: string): string {
    const classes: Record<string, string> = {
      create: 'bg-green-500',
      update: 'bg-blue-500',
      status_change: 'bg-purple-500',
      assign_user: 'bg-indigo-500',
      unassign_user: 'bg-orange-500',
      add_comment: 'bg-gray-500',
      delete: 'bg-red-500',
      add_attachment: 'bg-teal-500',
      remove_attachment: 'bg-pink-500',
      confirm_original_received: 'bg-emerald-500',
    };
    return classes[action] || 'bg-gray-400';
  }

  getAuditActionLabel(action: string): string {
    const labels: Record<string, string> = {
      create: $localize`hat den Antrag erstellt`,
      update: $localize`hat den Antrag bearbeitet`,
      status_change: $localize`hat den Status geändert`,
      assign_user: $localize`hat einen Benutzer zugewiesen`,
      unassign_user: $localize`hat einen Benutzer entfernt`,
      add_comment: $localize`hat kommentiert`,
      delete: $localize`hat gelöscht`,
      add_attachment: $localize`hat einen Anhang hinzugefügt`,
      remove_attachment: $localize`hat einen Anhang entfernt`,
      confirm_original_received: $localize`hat Originaleingang bestätigt`,
    };
    return labels[action] || action;
  }
}
