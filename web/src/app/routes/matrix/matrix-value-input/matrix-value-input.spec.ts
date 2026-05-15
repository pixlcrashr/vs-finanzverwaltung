import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixValueInput } from './matrix-value-input';

describe('MatrixValueInput', () => {
  let component: MatrixValueInput;
  let fixture: ComponentFixture<MatrixValueInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixValueInput],
    }).compileComponents();

    fixture = TestBed.createComponent(MatrixValueInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
