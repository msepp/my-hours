import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({name: 'duration'})
export class DurationPipe implements PipeTransform {
  transform(value: number): string {
    if (typeof value !== 'number' || value === 0) {
      return '—';
    }

    console.log('[DURATION]: ', value);
    const d = moment.duration(value, 'second');
    const out = [];

    if (d.hours()) {
      out.push(d.hours() + 'h');
    }
    if (d.minutes()) {
      out.push(d.minutes() + 'm');
    }
    if (d.seconds()) {
      out.push(d.seconds() + 's');
    }

    return out.join(' ');
  }
}
