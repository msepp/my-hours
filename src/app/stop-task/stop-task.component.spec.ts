import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StopTaskComponent } from './stop-task.component';

describe('StopTaskComponent', () => {
  let component: StopTaskComponent;
  let fixture: ComponentFixture<StopTaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StopTaskComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StopTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
