import { environment } from 'environments/environment';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs/Subscription';
import { debounceTime, filter } from 'rxjs/operators';
import { Ngxs, Select } from 'ngxs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as Schema from '@web-workers/db/db.schema';
import * as Store from '@store/.';
import { colorOptions } from '../symbols';
import { AddTaskComponent } from '../add-task/add-task.component';
import { ConfirmDeleteComponent } from '../confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {
  // Public propertires
  public colorOptions = colorOptions;
  public groups: Store.GroupsState = {byId: {}, allIds: []};
  public tasks: Schema.ITask[] = [];
  public updateTaskForm: FormGroup;

  // Private properties
  private _groups$: Subscription;
  private _tasks$: Subscription;
  private _formChange$: Subscription;
  private _route$: Subscription;

  constructor(
    private fb: FormBuilder,
    private ngxs: Ngxs,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    this._log('construct');
    this.updateTaskForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      color: [''],
      groups: [[]]
    });
 }

  private _log(...args: any[]): void {
    if (environment.production === false) {
      console.log('[tasks.component]', ...args);
    }
  }

  ngOnInit() {
    this._log('init');
    this._route$ = this.route.params.subscribe(params => {
      if (params['popup']) {
        setTimeout(() => this.addTask(), 100);
      }
    });

    this._groups$ = this.ngxs.select((state: Store.StoreState) => state.hours.groups).subscribe(
      (groups: Store.GroupsState) => {
        this.groups = groups;
      }
    );

    this._tasks$ = this.ngxs.select((state: Store.StoreState) => state.hours.tasks).subscribe(
      (tasks: Store.TasksState) => this.tasks = tasks.allIds.map(id => tasks.byId[id])
    );

    this._formChange$ = this.updateTaskForm.valueChanges.pipe(
      debounceTime(500),
      filter(() => this.updateTaskForm.valid)
    ).subscribe(() => {
      const v = this.updateTaskForm.value;
      this.ngxs.dispatch(new Store.UpdateTask({
        id: v.id,
        name: v.name,
        groups: v.groups,
        settings: {color: v.color}
      }));
    });
  }

  ngOnDestroy() {
    this._tasks$.unsubscribe();
    this._groups$.unsubscribe();
    this._route$.unsubscribe();
    this._formChange$.unsubscribe();
  }

  public addTask() {
    const d = this.dialog.open(AddTaskComponent, {
      data: {
        groups: this.groups.allIds.map(id => ({id, name: this.groups.byId[id].name}))
      }
    });
    d.afterClosed().toPromise().then((value: Schema.ITask) => {
      if (value) {
        this.ngxs.dispatch(new Store.InsertTask(value));
      }
    });
  }

  public deleteTask(task: Schema.ITask) {
    this.dialog.open(ConfirmDeleteComponent, {
      data: {target: task.name}
    }).afterClosed().toPromise().then((confirmed: boolean) => {
      if (confirmed) {
        this.ngxs.dispatch(new Store.DeleteTask(task.id));
      }
    });
  }

  public trackTaskById(item: Schema.ITask, index: number): number {
    return item.id;
  }

  public setupForm(task: Schema.ITask) {
    this.updateTaskForm.reset({
      id: task.id,
      name: task.name,
      groups: task.groups,
      color: task.settings.color || colorOptions[0].value
    }, { emitEvent: false });
  }
}
