import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Ngxs } from 'ngxs';
import * as Store from '@store/.';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { map, filter, take, concatMap } from 'rxjs/operators';

@Injectable()
export class AppInitResolver implements Resolve<boolean> {
  private _initDone = new BehaviorSubject<boolean>(false);

  constructor(private ngxs: Ngxs) {
    this._log('construct');
  }
  private _log(...args: any[]) {
    if (environment.production === false) {
      console.log('[RESOLVER]:', ...args);
    }
  }

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any>|Promise<any>|any {
    this._log('resolver started');

    this.ngxs.dispatch(new Store.RefreshGroups()).toPromise().then(() => {
      this._log('read groups, reading tasks...');
      return this.ngxs.dispatch(new Store.RefreshTasks()).toPromise();
    }).then(() => {
      this._log('read tasks, reading active tasks...');
      return this.ngxs.dispatch(new Store.ReadActiveTask()).toPromise();
    }).then(() => {
      this._log('read active task, reading latest task...');
      return this.ngxs.dispatch(new Store.ReadLatestTask()).toPromise();
    }).then(() => {
      this._log('read latest task, waiting for store to resolve...');
      return this.ngxs.dispatch(new Store.InitReady()).toPromise();
    });

    return this.ngxs.select(store => store.hours.initialized).pipe(
      map(v => {
        this._log('store initialized changed', v);
        return v;
      }),
      filter(v => v === true),
      take(1)
    );
  }
}
