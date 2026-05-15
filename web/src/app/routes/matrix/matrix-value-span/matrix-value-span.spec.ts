import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixValueSpan } from './matrix-value-span';

describe('MatrixValueSpan', () => {
  let component: MatrixValueSpan;
  let fixture: ComponentFixture<MatrixValueSpan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixValueSpan],
    }).compileComponents();

    fixture = TestBed.createComponent(MatrixValueSpan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
