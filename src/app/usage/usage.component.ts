import { environment } from 'environments/environment';
import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Ngxs, Select } from 'ngxs';
import * as Schema from '@web-workers/db/db.schema';
import * as Store from '@store/.';
import * as moment from 'moment';
import { WebWorkerService } from '@services/web-worker';

interface Report extends Schema.IReport {
  tasks: Schema.IReportTask[];
  notes: ReportNote[];
}

interface ReportNote extends Schema.IReportNote {
  taskName: string;
  taskColor: string;
}

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss']
})
export class UsageComponent implements OnInit, OnDestroy {
  // Public properties
  @ViewChild('optionsPanel') optionsPanel: MatExpansionPanel;
  @ViewChild('reportTable') elReportTable: ElementRef;
  @ViewChild('notesTable') elNotesTable: ElementRef;
  public mobileQuery: MediaQueryList;
  public tasks: Store.TasksState;
  public groups: Store.GroupsState;
  public report: Report = { days: [], tasks: [], total: 0, notes: [] };
  public reportForm: FormGroup;
  public prettyStart: string;
  public prettyEnd: string;

  // Private props
  private _formChanges$: Subscription;
  private _tasks$: Subscription;
  private _groups$: Subscription;
  private _mobileQueryListener: () => void;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private fb: FormBuilder,
    private ngxs: Ngxs,
    private wws: WebWorkerService
  ) {
    this._log('construct');
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();

    this.reportForm = this.fb.group({
      start: this.fb.control({value: null, disabled: false}, Validators.required),
      end: this.fb.control({value: null, disabled: false}, Validators.required),
      groups: [[]],
      tasks: [[]]
    });
  }

  private _log(...args: any[]): void {
    if (environment.production === false) {
      console.log('[usage.component]', ...args);
    }
  }

  ngOnInit() {
    this._log('init');
    this.mobileQuery.addListener(this._mobileQueryListener);

    this._formChanges$ = this.reportForm.valueChanges.subscribe((v) => {
      this.prettyStart = moment(v.start).format('LL');
      this.prettyEnd = moment(v.end).format('LL');
    });

    this.reportForm.patchValue({
      start: moment().startOf('isoWeek'),
      end: moment().endOf('isoWeek')
    });

    this._tasks$ = this.ngxs.select(state => state.hours.tasks).subscribe((tasks: Store.TasksState) => {
      this.tasks = tasks;
    });

    this._groups$ = this.ngxs.select(state => state.hours.groups).subscribe((groups: Store.GroupsState) => {
      this.groups = groups;
    });

    this.generateReport();
  }

  ngOnDestroy() {
    this._formChanges$.unsubscribe();
    this._tasks$.unsubscribe();
    this._groups$.unsubscribe();
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  public generateReport() {
    this.reportForm.disable();

    const v = this.reportForm.value;
    const opts = {
      start: moment.utc(v.start).format(Schema.TimestampFormat) + 'Z',
      end: moment.utc(v.end).format(Schema.TimestampFormat) + 'Z',
      groups: v.groups,
      tasks: v.tasks
    };
    this.wws.report(opts).then(report => {
      if (report.tasks.length === 0) {
        this.elReportTable.nativeElement.style.minWidth = 'auto';
        this.elNotesTable.nativeElement.style.minWidth = 'auto';
        this.report = {tasks: [], days: [], total: 0, notes: []};
      } else {
        this.report.days = report.days;
        this.report.tasks = report.tasks.map(t => {
          let name = `deleted / id:${t.id}`;
          let color = 'color-deleted';

          if (this.tasks.byId[t.id]) {
            name = this.tasks.byId[t.id].name;
            color = this.tasks.byId[t.id].settings.color;
          }

          return { ...t, name, color };
        });

        this.report.notes = report.notes.map(n => {
          let taskName = `deleted / id:${n.taskId}`;
          let taskColor = 'color-deleted';

          if (this.tasks.byId[n.taskId]) {
            taskName = this.tasks.byId[n.taskId].name;
            taskColor = this.tasks.byId[n.taskId].settings.color;
          }

          return { ...n, taskName, taskColor };
        });

        this.report.total = report.total;
        this.elNotesTable.nativeElement.style.minWidth = `${this.report.notes.length ? 800 : 0}px`;
        this.elReportTable.nativeElement.style.minWidth = `${(report.days.length + 2) * 100}px`;
      }

      this.reportForm.enable();
      this.optionsPanel.close();
    });
  }

  public toLocalTime(s: string): {date: string, time: string} {
    const d = moment(s).local();
    return {
      date: d.format(Schema.DateFormat),
      time: d.format(Schema.TimeFormat)
    };
  }
}
