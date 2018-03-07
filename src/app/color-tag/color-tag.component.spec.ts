import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorTagComponent } from './color-tag.component';

describe('ColorTagComponent', () => {
  let component: ColorTagComponent;
  let fixture: ComponentFixture<ColorTagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ColorTagComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
