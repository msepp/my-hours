import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { colorOptions } from '../symbols';

export interface AddTaskOptions {
  groups: {id: number, name: string}[];
}

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss']
})
export class AddTaskComponent {
  public colorOptions = colorOptions;
  public addTaskForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddTaskOptions,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddTaskComponent>
  ) {
    this.addTaskForm = this.fb.group({
      name: ['', Validators.required],
      color: [colorOptions[0].value],
      groups: [[]]
    });
  }

  public addAndClose() {
    const v = this.addTaskForm.value;
    this.dialogRef.close({
      name: v.name,
      groups: v.groups,
      settings: {color: v.color},
    });
  }
}
