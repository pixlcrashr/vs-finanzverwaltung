import { Routes } from '@angular/router';
import { Matrix } from './matrix.component';
import { MatrixDataService } from './matrix.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const MATRIX_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_MATRIX_READ)],
    resolve: {
      permissions: resolvePermissions(V1Permission.PERMISSION_MATRIX_UPDATE),
    },
    loadComponent: () => import('./matrix.component').then((m) => m.Matrix),
    providers: [
      {
        provide: MatrixDataService,
        useClass: environment.dataServices.matrix,
      },
      {
        provide: Matrix,
        useClass: Matrix,
      },
    ],
  }
];
