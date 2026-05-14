import { Routes } from '@angular/router';
import { Matrix } from './matrix.component';
import { MatrixDataService } from './matrix.data-service';
import { environment } from '../../../environments/environment';

export const MATRIX_ROUTES: Routes = [
  {
    path: '',
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