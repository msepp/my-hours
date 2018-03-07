import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { filter, take } from 'rxjs/operators';
import * as DB from 'worker-loader!../../../web-workers/db/db.worker.bundle.js';
import * as DBMessages from '@web-workers/db/db.messages';
import * as Schema from '@web-workers/db/db.schema';

@Injectable()
export class WebWorkerService {
  private _replies: Subject<DBMessages.IDBResponse> = new Subject<DBMessages.IDBResponse>();
  private _dbWorker: Worker = new DB();

  constructor() {
    this._log('construct');
    this._initialize();
  }

  private _log(...args: any[]) {
    if (environment.production === false) {
      console.log('[web-worker.service]', ...args);
    }
  }

  private _initialize() {
    // DB worker
    this._dbWorker.onmessage = (event: {data: DBMessages.IDBResponse}) => {
      this._log(`received response to ${event.data.id}`, event.data);
      this._replies.next(event.data);
    };
  }

  private _post(msg: DBMessages.IDBMessage): Promise<DBMessages.IDBResponse> {
    const s = this._replies.pipe(
      filter(r => r.id === msg.id),
      take(1)
    ).toPromise();
    this._log(`sending message ${msg.type} (id: ${msg.id})`, msg.data);
    this._dbWorker.postMessage(msg);
    return s;
  }

  activeTask(): Promise<Schema.IActiveTask> {
    return new Promise<Schema.IActiveTask>((resolve, reject) => {
      const msg = new DBMessages.DBMessageActiveTask();
      this._post(msg).then(r => {
        resolve(r.data);
      });
    });
  }

  addGroup(group: Schema.IGroup): Promise<Schema.IGroup> {
    return new Promise<Schema.IGroup>((resolve, reject) => {
      const msg = new DBMessages.DBMessageInsertGroup(group);
      this._post(msg).then(r => {
        resolve(r.data);
      });
    });
  }

  addTask(group: Schema.ITask): Promise<Schema.ITask> {
    return new Promise<Schema.ITask>((resolve, reject) => {
      const msg = new DBMessages.DBMessageInsertTask(group);
      this._post(msg).then(r => {
        resolve(r.data);
      });
    });
  }

  deleteGroup(groupId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const msg = new DBMessages.DBMessageDeleteGroup(groupId);
      this._post(msg).then(() => {
        resolve();
      });
    });
  }

  deleteTask(groupId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const msg = new DBMessages.DBMessageDeleteTask(groupId);
      this._post(msg).then(() => {
        resolve();
      });
    });
  }

  readGroups(): Promise<Schema.IGroup[]> {
    return new Promise<Schema.IGroup[]>((resolve, reject) => {
      const msg = new DBMessages.DBMessageReadGroups();
      this._post(msg).then(r => {
        resolve(r.data);
      });
    });
  }

  readTasks(): Promise<Schema.ITask[]> {
    return new Promise<Schema.ITask[]>((resolve, reject) => {
      const msg = new DBMessages.DBMessageReadTasks();
      this._post(msg).then(r => {
        resolve(r.data);
      });
    });
  }

  report(options: Schema.IReportOptions): Promise<Schema.IReport> {
    return new Promise<Schema.IReport>((resolve, reject) => {
      const msg = new DBMessages.DBMessageCreateReport(options);
      this._post(msg).then(response => {
        this._log(response.data);
        resolve(response.data);
      });
    });
  }

  startTask(task: Schema.ITask): Promise<Schema.IActiveTask> {
    return new Promise<Schema.IActiveTask>((resolve, reject) => {
      const msg = new DBMessages.DBMessageStartTask(task);
      this._post(msg).then(r => {
        if (r.error) {
          reject(r.error);
        } else {
          resolve(r.data);
        }
      });
    });
  }

  stopTask(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const msg = new DBMessages.DBMessageStopTask();
      this._post(msg).then(r => {
        this._log(r);
        if (r.error) {
          reject(r.error);
        } else {
          resolve(r.data);
        }
      });
    });
  }

  updateGroup(group: Schema.IGroup): Promise<Schema.IGroup> {
    return new Promise<Schema.IGroup>((resolve, reject) => {
      const msg = new DBMessages.DBMessageUpdateGroup(group);
      this._post(msg).then(r => {
        resolve(r.data);
      });
    });
  }

  updateTask(task: Schema.ITask): Promise<Schema.ITask> {
    return new Promise<Schema.ITask>((resolve, reject) => {
      const msg = new DBMessages.DBMessageUpdateTask(task);
      this._post(msg).then(r => {
        resolve(r.data);
      });
    });
  }
}
