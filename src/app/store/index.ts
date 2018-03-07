export * from './hours.store';
export * from './hours.actions';

import { HoursState } from './hours.store';
export interface StoreState {
  hours: HoursState;
}
