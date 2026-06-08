import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideApiConfiguration } from './provide-api-configuration';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

// Dialog data service abstract classes
import { CreateAccountGroupDialogDataService } from './shared/dialogs/create-account-group-dialog/create-account-group-dialog.data-service';
import { AddAccountToGroupDialogDataService } from './shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.data-service';
import { CreateBudgetDialogDataService } from './shared/dialogs/create-budget-dialog/create-budget-dialog.data-service';
import { CloseBudgetDialogDataService } from './shared/dialogs/close-budget-dialog/close-budget-dialog.data-service';
import { CreateAccountDialogDataService } from './shared/dialogs/create-account-dialog/create-account-dialog.data-service';
import { CreateReportDialogDataService } from './shared/dialogs/create-report-dialog/create-report-dialog.data-service';
import { ClosePeriodDialogDataService } from './shared/dialogs/close-period-dialog/close-period-dialog.data-service';
import { AddReceiptDialogDataService } from './shared/dialogs/add-receipt-dialog/add-receipt-dialog.data-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideApiConfiguration(environment.apiBaseUrl),
    // Dialog data services (global providers since dialogs can be opened from any route)
    { provide: CreateAccountGroupDialogDataService, useClass: environment.dataServices.createAccountGroupDialog },
    { provide: AddAccountToGroupDialogDataService, useClass: environment.dataServices.addAccountToGroupDialog },
    { provide: CreateBudgetDialogDataService, useClass: environment.dataServices.createBudgetDialog },
    { provide: CloseBudgetDialogDataService, useClass: environment.dataServices.closeBudgetDialog },
    { provide: CreateAccountDialogDataService, useClass: environment.dataServices.createAccountDialog },
    { provide: CreateReportDialogDataService, useClass: environment.dataServices.createReportDialog },
    { provide: ClosePeriodDialogDataService, useClass: environment.dataServices.closePeriodDialog },
    { provide: AddReceiptDialogDataService, useClass: environment.dataServices.addReceiptDialog },
  ],
};
