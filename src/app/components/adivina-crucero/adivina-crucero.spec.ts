import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdivinaCrucero } from './adivina-crucero';

describe('AdivinaCrucero', () => {
  let component: AdivinaCrucero;
  let fixture: ComponentFixture<AdivinaCrucero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdivinaCrucero],
    }).compileComponents();

    fixture = TestBed.createComponent(AdivinaCrucero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
