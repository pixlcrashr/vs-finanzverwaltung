import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixContent } from './matrix-content';

describe('MatrixContent', () => {
  let component: MatrixContent;
  let fixture: ComponentFixture<MatrixContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixContent],
    }).compileComponents();

    fixture = TestBed.createComponent(MatrixContent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
