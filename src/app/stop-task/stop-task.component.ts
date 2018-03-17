import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { colorOptions } from '../symbols';
import * as Schema from '@web-workers/db/db.schema';
import * as moment from 'moment';

export interface StopTaskOptions {
  id: number;
  tasks: Schema.ITask[];
  start: Date;
  end: Date;
  notes: string;
}

@Component({
  selector: 'app-stop-task',
  templateUrl: './stop-task.component.html',
  styleUrls: ['./stop-task.component.scss']
})
export class StopTaskComponent implements OnInit, OnDestroy {
  public colorOptions = colorOptions;
  public stopTaskForm: FormGroup;
  public mobileQuery: MediaQueryList;

  private _mobileQueryListener: () => void;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: StopTaskOptions,
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<StopTaskComponent>
  ) {
    this.stopTaskForm = this.fb.group({
      taskId: [data.id, Validators.required],
      start: [moment.utc(data.start).local().startOf('day'), Validators.required],
      startTime: [moment.utc(data.start).local().format(Schema.TimeFormat), Validators.required],
      end: [moment.utc(data.end).local().startOf('day'), Validators.required],
      endTime: [moment.utc(data.end).local().format(Schema.TimeFormat), Validators.required],
      notes: ['']
    }, {validator: (g) => this.validateDates(g)});

    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
  }

  ngOnInit() {
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnDestroy() {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  private datetime(dt: string): string {
    return moment(dt).utc().format(Schema.TimestampFormat) + 'Z';
  }

  public stopAndClose() {
    if (this.stopTaskForm.valid) {
      const v = this.stopTaskForm.value;
      const res: Schema.IStopTask = {
        taskId: v.id,
        note: v.notes,
        started: this.datetime(v.start.format(Schema.DateFormat) + 'T' + v.startTime),
        stopped: this.datetime(v.end.format(Schema.DateFormat) + 'T' + v.endTime),
      };

      this.dialogRef.close(res);
    }
  }

  public validateDates(group: FormGroup) {
    const v = group.value;
    const s = this.datetime(v.start.format(Schema.DateFormat) + 'T' + v.startTime);
    const e = this.datetime(v.end.format(Schema.DateFormat) + 'T' + v.endTime);
    return (s < e ? null : {datesInvalid: true});
  }
}
