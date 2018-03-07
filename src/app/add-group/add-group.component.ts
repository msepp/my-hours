import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { colorOptions } from '../symbols';

@Component({
  selector: 'app-add-group',
  templateUrl: './add-group.component.html',
  styleUrls: ['./add-group.component.scss']
})
export class AddGroupComponent implements OnInit {
  public colorOptions = colorOptions;
  public addGroupForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddGroupComponent>
  ) {
    this.addGroupForm = this.fb.group({
      name: ['', Validators.required],
      color: [colorOptions[0].value]
    });
  }

  ngOnInit() {
  }

  public addAndClose() {
    const v = this.addGroupForm.value;
    this.dialogRef.close({
      name: v.name,
      settings: {color: v.color}
    });
  }
}
