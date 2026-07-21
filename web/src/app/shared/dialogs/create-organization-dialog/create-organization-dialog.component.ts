import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Observable, Subscription, first, map } from 'rxjs';
import slugify from 'slugify';
import { ButtonComponent } from '../../components';
import { CreateOrganizationDialogDataService } from './create-organization-dialog.data-service';

export interface CreatedOrganization {
  id: string;
  name: string;
  description: string;
}

export interface CreateOrganizationDialogOutput {
  created: boolean;
  organization?: CreatedOrganization;
}

@Component({
  selector: 'app-create-organization-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4">
      <h2 class="text-sm font-semibold text-gray-900 mb-4">
        <ng-container i18n>Organisation erstellen</ng-container>
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="space-y-3">
          <div>
            <label for="name" class="block text-xs font-medium text-gray-700 mb-1">
              <ng-container i18n>Name</ng-container>
            </label>
            <input
              id="name"
              type="text"
              formControlName="name"
              autocomplete="off"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="slug" class="block text-xs font-medium text-gray-700 mb-1">
              <ng-container i18n>ID (Slug)</ng-container>
            </label>
            <div class="relative">
              <input
                id="slug"
                type="text"
                formControlName="slug"
                autocomplete="off"
                (input)="onSlugInput()"
                class="w-full px-2 py-1.5 text-sm border rounded bg-white text-gray-900 focus:outline-none focus:ring-2 font-mono pr-7"
                [class.border-gray-300]="!slugControl.errors || slugControl.pending"
                [class.border-red-400]="slugControl.errors && !slugControl.pending"
                [class.focus:ring-blue-500]="!slugControl.errors || slugControl.pending"
                [class.focus:ring-red-400]="slugControl.errors && !slugControl.pending"
                [placeholder]="slugPlaceholder"
              />
              @if (slugControl.pending) {
                <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
            </div>
            @if (slugControl.errors?.['idTaken'] && !slugControl.pending) {
              <p class="mt-1 text-xs text-red-500" i18n>Diese ID ist bereits vergeben.</p>
            } @else {
              <p class="mt-1 text-xs text-gray-500" i18n>
                Wird automatisch aus dem Namen generiert. Kann manuell angepasst werden.
              </p>
            }
          </div>

          <div>
            <label for="description" class="block text-xs font-medium text-gray-700 mb-1">
              <ng-container i18n>Beschreibung</ng-container>
            </label>
            <textarea
              id="description"
              formControlName="description"
              rows="3"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            ></textarea>
          </div>

          <div>
            <label for="startMonth" class="block text-xs font-medium text-gray-700 mb-1">
              <ng-container i18n>Geschäftsjahr Beginn (Monat)</ng-container>
            </label>
            <select
              id="startMonth"
              formControlName="startMonth"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option [ngValue]="1" i18n>Januar</option>
              <option [ngValue]="2" i18n>Februar</option>
              <option [ngValue]="3" i18n>März</option>
              <option [ngValue]="4" i18n>April</option>
              <option [ngValue]="5" i18n>Mai</option>
              <option [ngValue]="6" i18n>Juni</option>
              <option [ngValue]="7" i18n>Juli</option>
              <option [ngValue]="8" i18n>August</option>
              <option [ngValue]="9" i18n>September</option>
              <option [ngValue]="10" i18n>Oktober</option>
              <option [ngValue]="11" i18n>November</option>
              <option [ngValue]="12" i18n>Dezember</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <app-button variant="secondary" (clicked)="cancel()">
            <ng-container i18n>Abbrechen</ng-container>
          </app-button>
          <app-button
            type="submit"
            [disabled]="form.invalid || form.pending"
            [loading]="creating()"
          >
            <ng-container i18n>Erstellen</ng-container>
          </app-button>
        </div>
      </form>
    </div>
  `,
})
export class CreateOrganizationDialogComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(DialogRef<CreateOrganizationDialogOutput>);
  private readonly dataService = inject(CreateOrganizationDialogDataService);
  private readonly fb = inject(FormBuilder);

  readonly creating = signal(false);
  readonly slugPlaceholder = 'z.B. meine-organisation';

  private slugManuallyTouched = false;
  private nameSubscription?: Subscription;

  readonly form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    slug: [{ value: '', disabled: false }, { validators: [], asyncValidators: [this.slugAvailabilityValidator()], updateOn: 'blur' }],
    description: [''],
    startMonth: [1, Validators.required],
  });

  get slugControl(): AbstractControl {
    return this.form.get('slug')!;
  }

  private slugAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = (control.value as string ?? '').trim();
      if (!value) {
        return new Observable((obs) => { obs.next(null); obs.complete(); });
      }
      return this.dataService.isOrganizationIdAvailable(value).pipe(
        map((available) => (available ? null : { idTaken: true })),
        first(),
      );
    };
  }

  ngOnInit(): void {
    this.nameSubscription = this.form.get('name')!.valueChanges.subscribe((name: string) => {
      if (!this.slugManuallyTouched) {
        const generated = slugify(name ?? '', { lower: true, strict: true });
        this.form.get('slug')!.setValue(generated, { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.nameSubscription?.unsubscribe();
  }

  onSlugInput(): void {
    this.slugManuallyTouched = true;
  }

  cancel(): void {
    this.dialogRef.close({ created: false });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.creating.set(true);
    const { name, slug, description, startMonth } = this.form.value;
    let organizationId = (slug as string).trim() || undefined;
    if (organizationId === '') {
      organizationId = undefined;
    }

    this.dataService
      .createOrganization(name.trim(), (description ?? '').trim(), organizationId, startMonth as number)
      .subscribe({
        next: (organization) => {
          this.creating.set(false);
          this.dialogRef.close({ created: true, organization });
        },
        error: () => {
          this.creating.set(false);
        },
      });
  }
}
