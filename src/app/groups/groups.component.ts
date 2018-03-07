import { environment } from 'environments/environment';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs/Subscription';
import { debounceTime, filter } from 'rxjs/operators';
import { Ngxs, Select } from 'ngxs';
import * as Schema from '@web-workers/db/db.schema';
import * as Store from '@store/.';
import { colorOptions } from '../symbols';
import { AddGroupComponent } from '../add-group/add-group.component';
import { ConfirmDeleteComponent } from '../confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit, OnDestroy {
  // Public propertires
  public groups: Schema.IGroup[] = [];
  public colorOptions = colorOptions;
  public updateGroupForm: FormGroup;

  // Private properties
  private _groups$: Subscription;
  private _formChange$: Subscription;

  constructor(
    private fb: FormBuilder,
    private ngxs: Ngxs,
    private dialog: MatDialog
  ) {
    this._log('construct');
    this.updateGroupForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      color: ['']
    });
  }

  private _log(...args: any[]): void {
    if (environment.production === false) {
      console.log('[groups.component]', ...args);
    }
  }

  public ngOnInit() {
    this._log('init');
    this._formChange$ = this.updateGroupForm.valueChanges.pipe(
      debounceTime(500),
      filter(() => this.updateGroupForm.valid)
    ).subscribe(() => {
      const v = this.updateGroupForm.value;
      this.ngxs.dispatch(new Store.UpdateGroup({
        id: v.id,
        name: v.name,
        settings: {color: v.color}
      }));
    });

    this._groups$ = this.ngxs.select((state: Store.StoreState) => state.hours.groups).subscribe(
      (groups: Store.GroupsState) => this.groups = groups.allIds.map(id => groups.byId[id])
    );
  }

  public ngOnDestroy() {
    this._groups$.unsubscribe();
    this._formChange$.unsubscribe();
  }

  public addGroup() {
    const d = this.dialog.open(AddGroupComponent);
    d.afterClosed().toPromise().then((value: Schema.IGroup) => {
      if (value) {
        this.ngxs.dispatch(new Store.InsertGroup(value));
      }
    });
  }

  public deleteGroup(group: Schema.IGroup) {
    this.dialog.open(ConfirmDeleteComponent, {
      data: {target: group.name}
    }).afterClosed().toPromise().then((confirmed: boolean) => {
      if (confirmed) {
        this.ngxs.dispatch(new Store.DeleteGroup(group.id));
      }
    });
  }

  public trackGroupById(item: Schema.IGroup, index: number): number {
    return item.id;
  }

  public setupForm(group: Schema.IGroup) {
    this.updateGroupForm.reset({
      id: group.id,
      name: group.name,
      color: group.settings.color || colorOptions[0].value
    }, { emitEvent: false });
  }
}
