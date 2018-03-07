import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { take, filter } from 'rxjs/operators';
import { MediaMatcher } from '@angular/cdk/layout';
import { Ngxs, Select } from 'ngxs';
import * as Store from '@store/.';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy, OnInit {
  // Public properties
  public activeView = '';
  public mobileQuery: MediaQueryList;
  public nav = [
    {target: '/active-task', name: 'Active task'},
    {target: '/groups', name: 'Groups'},
    {target: '/tasks', name: 'Tasks'},
    {target: '/usage', name: 'Reports'},
  ];

  // Private properties
  private _mobileQueryListener: () => void;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private ngxs: Ngxs,
    private router: Router
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  private _log(...args: any[]): void {
    console.log('[app.component]', ...args);
  }

  ngOnInit(): void {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        const active = this.nav.find(n => e.url.indexOf(n.target) === 0);
        this.activeView = active ? active.name : '';
      }
    });

    this.ngxs.select(store => store.hours.initialized).pipe(
      filter(v => v === true),
      take(1)
    ).subscribe(() => {
      document.getElementById('app-splash').remove();
    });
  }
  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
}
