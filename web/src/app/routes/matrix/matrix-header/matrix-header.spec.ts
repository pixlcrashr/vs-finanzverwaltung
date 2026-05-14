import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixHeader } from './matrix-header';

describe('MatrixHeader', () => {
  let component: MatrixHeader;
  let fixture: ComponentFixture<MatrixHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(MatrixHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
