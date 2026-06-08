/* tslint:disable */
import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ApiConfiguration, ApiConfigurationInterface } from './api-configuration';

import { GroupServiceService } from './services/group-service.service';
import { OrganizationServiceService } from './services/organization-service.service';
import { UserServiceService } from './services/user-service.service';
import { AccountServiceService } from './services/account-service.service';
import { AccountGroupServiceService } from './services/account-group-service.service';
import { BudgetAccountValueServiceService } from './services/budget-account-value-service.service';
import { TransactionAccountAssignmentServiceService } from './services/transaction-account-assignment-service.service';
import { AccountGroupAssignmentServiceService } from './services/account-group-assignment-service.service';
import { BudgetServiceService } from './services/budget-service.service';
import { ImportSourceServiceService } from './services/import-source-service.service';
import { ReportTemplateServiceService } from './services/report-template-service.service';
import { ReportServiceService } from './services/report-service.service';
import { TransactionServiceService } from './services/transaction-service.service';
import { TransactionAccountServiceService } from './services/transaction-account-service.service';
import { UserIdentityServiceService } from './services/user-identity-service.service';
import { UserSettingsServiceService } from './services/user-settings-service.service';
import { ImportSourcePeriodServiceService } from './services/import-source-period-service.service';
import { BudgetRevisionServiceService } from './services/budget-revision-service.service';
import { BudgetRevisionAccountValueServiceService } from './services/budget-revision-account-value-service.service';

/**
 * Provider for all Api services, plus ApiConfiguration
 */
@NgModule({
  imports: [
    HttpClientModule
  ],
  exports: [
    HttpClientModule
  ],
  declarations: [],
  providers: [
    ApiConfiguration,
    GroupServiceService,
    OrganizationServiceService,
    UserServiceService,
    AccountServiceService,
    AccountGroupServiceService,
    BudgetAccountValueServiceService,
    TransactionAccountAssignmentServiceService,
    AccountGroupAssignmentServiceService,
    BudgetServiceService,
    ImportSourceServiceService,
    ReportTemplateServiceService,
    ReportServiceService,
    TransactionServiceService,
    TransactionAccountServiceService,
    UserIdentityServiceService,
    UserSettingsServiceService,
    ImportSourcePeriodServiceService,
    BudgetRevisionServiceService,
    BudgetRevisionAccountValueServiceService
  ],
})
export class ApiModule {
  static forRoot(customParams: ApiConfigurationInterface): ModuleWithProviders<ApiModule> {
    return {
      ngModule: ApiModule,
      providers: [
        {
          provide: ApiConfiguration,
          useValue: {rootUrl: customParams.rootUrl}
        }
      ]
    }
  }
}
