import { environment } from 'environments/environment';
import Dexie from 'dexie';
import * as moment from 'moment';

// DBName is the database table name
export const DBName = 'Hours';

// Enumeration of supported settings
export enum Setting {
  ActiveTask = 'ActiveTask',
  PreviousTask = 'PreviousTask'
}

// IGroupSettings defines the available configuration options for a group
export interface IGroupSettings {
  color: string;
}

// ITaskSettings defines the available configuration options for a task
export interface ITaskSettings {
  color: string;
}

// IGroup describes a single group object in the database
export interface IGroup {
  id?: number;
  name: string;
  settings: IGroupSettings;
}

// ITask describes a single task object in the database
export interface ITask {
  id?: number;
  name: string;
  groups: number[];
  settings: ITaskSettings;
}

// ISetting describes a setting in the database
export interface ISetting {
  name?: string;
  value: any;
}

// IWork describes registered time spent on a task
export interface IWork {
  id?: number;
  start: string;
  end: string;
  taskId: number;
  note?: string;
}

// IActiveTask descrives current active task in settings
export interface IActiveTask {
  taskId: number;
  started: string;
}

export interface IStopTask {
  taskId?: number;
  started?: string;
  stopped?: string;
  note?: string;
}

export interface IReportOptions {
  start: string;
  end: string;
  groups: number[];
  tasks: number[];
}

export interface IReportTask {
  id: number;
  total: number;
}

export interface IReportDay {
  day: string;
  tasks: {[key: number]: number};
  total: number;
}

export interface IReportNote {
  taskId: number;
  note: string;
  started: string;
  duration: number;
}

export interface IReport {
  days: IReportDay[];
  tasks: IReportTask[];
  notes: IReportNote[];
  total: number;
}

export const DateFormat = 'YYYY-MM-DD';
export const TimeFormat = 'HH:mm:ss';
export const TimestampFormat = DateFormat + 'T' + TimeFormat;

// Class version of IWork with some helpers
export class Work implements IWork {
  public _start: Date;
  public _end: Date;
  public start: string;
  public end: string;
  public taskId: number;
  public note?: string;

  constructor(work: IWork) {
    Object.assign(this, work);
    this._start = new Date(this.start);
    this._end = new Date(this.end);
    this.note = work.note;
  }

  get duration(): number {
    return Math.floor((this._end.getTime() - this._start.getTime()) / 1000);
  }
}

// HoursDB implements a database for storing and manipulating time usage data.
export class HoursDB extends Dexie {
  public groups: Dexie.Table<IGroup, number>;
  public tasks: Dexie.Table<ITask, number>;
  public settings: Dexie.Table<ISetting, string>;
  public history: Dexie.Table<IWork, number>;

  constructor() {
    super(DBName);
    this._log('init begin');

    // Open database
    this.version(1).stores({
      groups: '++id,name',
      tasks: '++id,name,*groups',
      settings: '&name',
      history: '++id,start,end,taskId'
    });

    this.transaction('rw', this.settings, () => {
      return this.settings.get(Setting.ActiveTask).then(s => {
        if (s === undefined) {
          const at: IActiveTask = {taskId: 0, started: ''};
          return this.settings.add({name: Setting.ActiveTask, value: at});
        }
        return Promise.resolve(null);
      }).then(() => {
        return this.settings.get(Setting.PreviousTask);
      }).then(s => {
        if (s === undefined) {
          return this.settings.add({name: Setting.PreviousTask, value: 0});
        }
        return Promise.resolve(null);
      });
    });

    this._log('init finished');
  }

  private _log(...args: any[]): void {
    if (environment.workerDebug) {
      console.log('[db.hours]', ...args);
    }
  }

  // deleteGroup deletes a single group from the database identified by id.
  // Returns a promise that resolves when delete is finished or has failed.
  public deleteGroup(id: number): Promise<void[]> {
    this._log('delete.group', id);

    return this.transaction('rw', this.groups, this.tasks, () => {
      // First delete the group
      this.groups.delete(id);

      const plist = [];
      this.tasks.where('groups').equals(id).each((t: ITask) => {
        const gidx = t.groups.indexOf(id);
        const ng = [...t.groups];
        ng.splice(gidx, 1);

        plist.push(this.tasks.update(t.id, {groups: ng}));
      });

      return Dexie.Promise.all(plist);
    });
  }

  // deleteTask deletes a single task from the database identified by id.
  // Returns a promise that resolves when delete is finished or has failed.
  public deleteTask(id: number): Promise<void> {
    this._log('delete.task', id);

    return this.tasks.delete(id);
  }

  // getActiveTask returns the currently active task or null if no task is active
  public getActiveTask(): Promise<IActiveTask|undefined> {
    return this.transaction('r', this.settings, () => {
      return this.settings.get(Setting.ActiveTask).then((s: ISetting) => {
        this._log('read active task: ', s);
        if (!s) {
          return undefined;
        } else {
          return s.value;
        }
      });
    });
  }

  // insertGroup inserts a single group into the database.
  // Returns a promise that resolves with the new group.
  public insertGroup(group: IGroup): Promise<IGroup> {
    this._log('insert.group', group);

    return new Promise<IGroup>((resolve, reject) => {
      this.groups.put(group)
        .then(id => resolve({...group, id}))
        .catch(reason => reject(reason));
    });
  }

  // insertTask inserts a single task into the database.
  // Returns a promise that resolves with the new task.
  public insertTask(task: ITask): Promise<ITask> {
    this._log('insert.task', task);

    return new Promise<ITask>((resolve, reject) => {
      this.tasks.put(task)
        .then(id => resolve({...task, id}))
        .catch(reason => reject(reason));
    });
  }

  // readGroups reads all group entries from the database.
  // Returns a promise that resolves with the found groups.
  public readGroups(): Promise<IGroup[]> {
    this._log('read.groups');

    return new Promise<IGroup[]>((resolve, reject) => {
      const res: IGroup[] = [];

      this.groups
        .each(g => res.push(g))
        .then(() => resolve(res))
        .catch(reason => reject(reason));
    });
  }

  // createReport returns a report with the given options
  public createReport(options: IReportOptions): Promise<IReport> {
    this._log('read.history, options:', options);
    let taskFilter = null;
    let filterPromise: Promise<void>;

    // If groups were given, we filter out those that do not belong to the
    // selected groups
    if (options.groups.length > 0) {
      // fetch tasks that match given groups.
      filterPromise = this.tasks.where('groups').anyOf(options.groups).toArray().then((tasks: ITask[]) => {
        taskFilter = tasks.map(t => t.id);
        if (options.tasks.length > 0) {
          taskFilter = [...taskFilter, ...options.tasks];
        }
      });
    } else {
      filterPromise = Promise.resolve();
      if (options.tasks.length > 0) {
        taskFilter = options.tasks;
      }
    }

    return filterPromise.then(() => {
      this._log('filter tasks:', taskFilter);
      // Filter is empty but it's set, this means selected filter matches nothign
      // and we can return empty result straight away.
      if (taskFilter !== null && taskFilter.length === 0) {
        return [];
      }

      options.start = moment(options.start).startOf('day').format(TimestampFormat) + 'Z';
      options.end = moment(options.end).endOf('day').format(TimestampFormat) + 'Z';

      return this.history.where('start').between(
        options.start, options.end, true, true
      ).filter((work: IWork) => {
        if (taskFilter === null) {
          return true;
        }
        return taskFilter.indexOf(work.taskId) > -1;
      }).toArray();

    }).then((result: IWork[]) => {
      const days: IReportDay[] = [];
      const tasks: IReportTask[] = [];
      const notes: IReportNote[] = [];
      const taskIndex = {};
      let total = 0;
      let ddata: IReportDay;

      // Create days from range.
      let tempd = options.start;
      this._log('start', tempd);
      while (tempd <= options.end) {
        days.push({
          day: tempd.split('T')[0],
          tasks: {},
          total: 0
        });

        tempd = moment(tempd).add(1, 'day').format(TimestampFormat) + 'Z';
        this._log('tempd: ', tempd);
      }

      this._log('days:', days);

      result.map(w => new Work(w)).forEach((w: Work) => {
        const day = w.start.split('T')[0];
        ddata = days.find(d => {
          this._log('compare', d, day);
          return d.day === day;
        });
        this._log(ddata);

        if (taskIndex[w.taskId] === undefined) {
          taskIndex[w.taskId] = tasks.length;
          tasks.push({id: w.taskId, total: 0});
        }

        const didx = days.length - 1;
        ddata.total += w.duration;
        ddata.tasks[w.taskId] = (ddata.tasks[w.taskId] || 0) + w.duration;
        tasks[taskIndex[w.taskId]].total += w.duration;
        total += w.duration;

        // Add to notes if note is set.
        if (w.note) {
          notes.push({note: w.note, taskId: w.taskId, started: w.start, duration: w.duration});
        }
      });

      return { days, tasks, total, notes };
    });
  }

  // readTasks reads all task entries from the database.
  // Returns a promise that resolves with the found tasks.
  public readTasks(): Promise<ITask[]> {
    this._log('read.tasks');

    return new Promise<ITask[]>((resolve, reject) => {
      const res: ITask[] = [];

      this.tasks
        .each(g => res.push(g))
        .then(() => resolve(res))
        .catch(reason => reject(reason));
    });
  }

  // setActiveTask sets given task active and stops any previous tasks and
  // automatically places the stopped task into history.
  // Resolves with the new active task.
  public setActiveTask(taskId: number): Promise<IActiveTask> {
    let nextTask: ITask;
    const now = new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z');

    return this.transaction('rw', this.settings, this.history, this.tasks, () => {
      return this.tasks.get(taskId).then(t => {
        if (taskId > 0 && t === undefined) {
          return Promise.reject(Dexie.NotFoundError);
        } else {
          nextTask = t;
          return this.settings.get(Setting.ActiveTask);
        }
      }).then((s: ISetting) => {
        if (s !== undefined && s.value.taskId !== 0) {
          this._log(`task already active: ${s.value.taskId}`);
          return Promise.reject(new Error('task active'));
        }

        // Set active task to given value.
        return this.settings.update(Setting.PreviousTask, {value: taskId});
      }).then(() => {
        return this.settings.update(Setting.ActiveTask, {
          value: {taskId, started: now}
        });
      }).then((ok) => {
        if (!ok) {
          this._log(`updating active task failed!`);
          return Promise.reject(new Error('setting active task failed'));
        }
        return this.settings.get(Setting.ActiveTask);
      }).then((s: ISetting) => {
        this._log('responding with:', s.value);
        return s.value;
      });
    });
  }

  // stopActiveTask stops the currently active task and records time spent to
  // database.
  public stopActiveTask(task: IStopTask): Promise<any> {
    let end = new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z');
    let start: string;
    let taskId: number;
    const note: string = task.note;

    return this.transaction('rw', this.settings, this.history, this.tasks, () => {
      return this.settings.get(Setting.ActiveTask).then((s: ISetting) => {
        if (s.value.taskId === 0) {
          return Promise.reject(new Error('task not active'));
        }
        if (task.taskId && task.taskId !== s.value.taskId) {
          return this.tasks.get(task.taskId).then(t => {
            if (t === undefined) {
              return Promise.reject(Dexie.NotFoundError);
            }
            return Promise.resolve({taskId: t.id, started: s.value.started});
          });
        }
        return Promise.resolve(s.value);
      }).then((at: IActiveTask) => {
        if (task.stopped) {
          try {
            end = new Date(task.stopped).toISOString().replace(/\.[0-9]+Z$/, 'Z');
          } catch (e) {
            return Promise.reject(e);
          }
        }

        if (task.started) {
          try {
            start = new Date(task.started).toISOString().replace(/\.[0-9]+Z$/, 'Z');
          } catch (e) {
            return Promise.reject(e);
          }
        } else {
          start = at.started;
        }

        taskId = at.taskId;

        // Set active task to given value.
        return this.settings.update(Setting.ActiveTask, {
          value: {taskId: 0, started: null}
        });
      }).then(ok => {
        if (!ok) {
          return Promise.reject(new Error('stopping task failed'));
        }

        return this.history.add({ taskId, start, end, note });
      });
    });
  }

  // updateGroup updates task contents.
  // Returns update group data
  public updateGroup(group: IGroup): Promise<IGroup> {
    this._log('update.group', group);

    return this.transaction('rw', this.groups, () => {
      return this.groups.update(group.id, {...group}).then(() => {
        return this.groups.get(group.id);
      }).then(g => {
        return g;
      });
    });
  }

  // updateTask updates task contents.
  // Returns update task data
  public updateTask(task: ITask): Promise<ITask> {
    this._log('update.task', task);

    return this.transaction('rw', this.tasks, () => {
      return this.tasks.update(task.id, {...task}).then(() => {
        return this.tasks.get(task.id);
      }).then(g => {
        return g;
      });
    });
  }

  public getLastestTask(): Promise<number> {
    return this.settings.get(Setting.PreviousTask).then((s: ISetting) => {
      return s ? s.value : 0;
    });
  }
}
