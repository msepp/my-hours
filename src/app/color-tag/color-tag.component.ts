import { Component, Input, HostBinding, OnChanges } from '@angular/core';

@Component({
  selector: 'app-color-tag',
  templateUrl: './color-tag.component.html',
  styleUrls: ['./color-tag.component.scss']
})
export class ColorTagComponent implements OnChanges {
  @Input() color = 'default';
  @Input() label = '';
  @HostBinding('class')
  public classes = this.color;

  constructor() {}

  ngOnChanges(changes) {
    if (changes.color) {
      this.classes = this.color;
    }
  }
}
