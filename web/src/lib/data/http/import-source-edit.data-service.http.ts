import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, switchMap } from 'rxjs';
import { ImportSourceServiceService } from '../../api/services/import-source-service.service';
import { ImportSourcePeriodServiceService } from '../../api/services/import-source-period-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { ImportSource } from '../../../app/shared/models';
import {
  ImportSourceEditDataService,
  UpdateImportSourceInput,
} from '../../../app/routes/admin/import-sources/import-source-edit.data-service';
import { mapApiImportSource, mapApiImportSourcePeriod } from './_mappers';

@Injectable()
export class HttpImportSourceEditDataService extends ImportSourceEditDataService {
  private readonly sourceSvc = inject(ImportSourceServiceService);
  private readonly periodSvc = inject(ImportSourcePeriodServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get orgParent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private sourceName(uid: string): string {
    return `${this.orgParent}/importSources/${uid}`;
  }

  private periodName(sourceId: string, periodId: string): string {
    return `${this.sourceName(sourceId)}/periods/${periodId}`;
  }

  getImportSource(id: string): Observable<ImportSource> {
    const name = this.sourceName(id);
    return combineLatest([
      this.sourceSvc.ImportSourceServiceGetImportSource(name),
      this.periodSvc.ImportSourcePeriodServiceListImportSourcePeriods({ parent: name, pageSize: 100 }),
    ]).pipe(
      map(([source, periodsResp]) => {
        const periods = (periodsResp.periods ?? []).map(mapApiImportSourcePeriod);
        return mapApiImportSource(source, periods);
      }),
    );
  }

  updateImportSource(id: string, input: UpdateImportSourceInput): Observable<ImportSource> {
    const name = this.sourceName(id);
    return this.sourceSvc.ImportSourceServiceGetImportSource(name).pipe(
      switchMap((existing) =>
        this.sourceSvc.ImportSourceServiceUpdateImportSource({
          importSourceName: name,
          importSource: {
            display_name: input.name,
            display_description: input.description,
            period_start: existing.period_start,
          },
        }),
      ),
      map((source) => mapApiImportSource(source, [])),
    );
  }

  closePeriod(sourceId: string, periodId: string): Observable<void> {
    return this.periodSvc.ImportSourcePeriodServiceCloseImportSourcePeriod({
      name1: this.periodName(sourceId, periodId),
      body: {},
    }).pipe(map(() => undefined));
  }
}
