# MyHours

A small PWA for tracking time used.

## Features

* Service worker for offline use
* Site manifest for adding to home screen on Androids
* Easy task switching
* Tasks can be assigned to groups
* Report generation with filtering based on groups/tasks
* Completely local: uses IndexedDB for storage (requires no login)
  * Database work is offloaded to a web worker
  * **caveat**: database can't be transferred between devices at the moment.

## Demo

A demo can be viewed at (https://my-hours.msepp.net/), no login needed!

## About

* Uses [Dexie.js](http://dexie.org/) to interact with IndexedDB.
* Uses [Moment.js](https://momentjs.com/) and [Luxon](https://moment.github.io/luxon/) for manipulating dates & time.
* Uses [NGXS](https://github.com/amcdnl/ngxs) for state management.
* Uses [Angular Material](https://material.angular.io/) to provide a pretty GUI.
* This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.1.
