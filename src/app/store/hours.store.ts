import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { map } from 'rxjs/operators/map';
import { Store, Mutation, Action } from 'ngxs';
import {
  DeleteGroup,
  DeleteTask,
  InitReady,
  InsertGroup,
  InsertTask,
  ReadActiveTask,
  RefreshGroups,
  RefreshTasks,
  UpdateGroup,
  UpdateTask,
  StartTask,
  StopTask
} from './hours.actions';

import {
  DeleteTaskSuccess,
  DeleteGroupSuccess,
  InsertGroupSuccess,
  InsertTaskSuccess,
  ReadActiveTaskSuccess,
  RefreshGroupsSuccess,
  RefreshTasksSuccess,
  StartTaskSuccess,
  StopTaskSuccess,
  UpdateGroupSuccess,
  UpdateTaskSuccess
} from './hours.events';

import { ITask, IGroup } from '@web-workers/db/db.schema';
import { WebWorkerService } from '@services/web-worker';

export interface GroupsState {
  byId: {[key: number]: IGroup};
  allIds: number[];
}

export interface TasksState {
  byId: {[key: number]: ITask};
  allIds: number[];
}

export interface ActiveTaskState {
  id: number;
  started?: Date;
}

export interface HoursState {
  initialized: boolean;
  loading: boolean;
  activeTask: ActiveTaskState;
  groups: GroupsState;
  tasks: TasksState;
}

@Store({
  name: 'hours',
  defaults: {
    intialized: false,
    loading: false,
    activeTask: {id: 0},
    tasks: {
      byId: {},
      allIds: [],
    },
    groups: {
      byId: {},
      allIds: [],
    }
  }
})
export class HoursStore {
  constructor(private wws: WebWorkerService) {
  }

  private _log(...args: any[]) {
    if (environment.production === false) {
      console.log('[store.hours]', ...args);
    }
  }

  //
  // init status
  //
  @Mutation(InitReady)
  initReady(state: HoursState, e: InitReady) {
    this._log('init ready');
    state.initialized = true;
  }

  //
  // Groups
  //
  @Mutation(DeleteGroupSuccess)
  deleteGroupSuccess(state: HoursState, e: DeleteGroupSuccess) {
    this._log('removing group', e.payload);
    const groups = {
      allIds: state.groups.allIds.filter(id => id !== e.payload),
      byId: {...state.groups.byId}
    };
    delete groups.byId[e.payload];
    state.groups = groups;
  }

  @Mutation(InsertGroupSuccess)
  insertGroupSuccess(state: HoursState, e: InsertGroupSuccess) {
    this._log('adding group:', e.payload, state);
    state.groups = {
      allIds: [...state.groups.allIds, e.payload.id].sort(),
      byId: {...state.groups.byId}
    };
    state.groups.byId[e.payload.id] = {...e.payload};
  }

  @Mutation(RefreshGroupsSuccess)
  refreshGroupsSuccess(state: HoursState, e: RefreshGroupsSuccess) {
    this._log('settings groups:', e.payload);
    const byId = {};
    state.groups = {
      byId: byId,
      allIds: e.payload.map(g => {
        byId[g.id] = {...g};
        return g.id;
      })
    };
  }

  @Mutation(UpdateGroupSuccess)
  updateGroupSuccess(state: HoursState, e: UpdateGroupSuccess) {
    this._log('updating group:', e.payload);
    if (state.groups.byId[e.payload.id]) {
      state.groups = {
        allIds: state.groups.allIds,
        byId: {...state.groups.byId}
      };
      state.groups.byId[e.payload.id] = {...e.payload};
    }
  }

  @Action(DeleteGroup)
  deleteGroup(state: HoursState, a: DeleteGroup) {
    return fromPromise(this.wws.deleteGroup(a.groupId)).pipe(
      map(() => [
        new DeleteGroupSuccess(a.groupId),
        new RefreshTasks()
      ])
    );
  }

  @Action(InsertGroup)
  insertGroup(state: HoursState, a: InsertGroup) {
    return fromPromise(this.wws.addGroup(a.group)).pipe(
      map(group => new InsertGroupSuccess(group))
    );
  }

  @Action(RefreshGroups)
  refreshGroups(state: HoursState) {
    return fromPromise(this.wws.readGroups()).pipe(
      map(groups => new RefreshGroupsSuccess(groups))
    );
  }

  @Action(UpdateGroup)
  updateGroup(state: HoursState, a: UpdateGroup) {
    return fromPromise(this.wws.updateGroup(a.group)).pipe(
      map(group => new UpdateGroupSuccess(group))
    );
  }

  //
  // Tasks
  //

  @Mutation(DeleteTaskSuccess)
  deleteTaskSuccess(state: HoursState, e: DeleteTaskSuccess) {
    this._log('removing task', e.payload);
    state.tasks = {
      allIds: state.tasks.allIds.filter(id => id !== e.payload),
      byId: {...state.tasks.byId}
    };
    delete state.tasks.byId[e.payload];
  }

  @Mutation(InsertTaskSuccess)
  insertTaskSuccess(state: HoursState, e: InsertTaskSuccess) {
    this._log('adding task:', e.payload, state);
    state.tasks = {
      allIds: [...state.tasks.allIds, e.payload.id].sort(),
      byId: {...state.tasks.byId}
    };
    state.tasks.byId[e.payload.id] = {...e.payload};
  }

  @Mutation(ReadActiveTaskSuccess)
  readActiveTaskSuccess(state: HoursState, e: ReadActiveTaskSuccess) {
    this._log('read active task', e, state);
    if (e.payload) {
      state.activeTask = {
        id: e.payload.taskId,
        started: new Date(e.payload.started)
      };
    } else {
      state.activeTask = {
        id: 0,
        started: null
      };
    }
  }

  @Mutation(RefreshTasksSuccess)
  refreshTasksSuccess(state: HoursState, e: RefreshTasksSuccess) {
    this._log('settings tasks:', e.payload, state);
    const byId = {};
    state.tasks = {
      byId: byId,
      allIds: e.payload.map(g => {
        byId[g.id] = {...g};
        return g.id;
      })
    };
  }

  @Mutation(StartTaskSuccess)
  startTaskSuccess(state: HoursState, e: StartTaskSuccess) {
    this._log('started task:', e);
    state.activeTask = {
      id: e.payload.taskId,
      started: new Date(e.payload.started)
    };
  }

  @Mutation(StopTaskSuccess)
  stopTaskSuccess(state: HoursState, e: StopTaskSuccess) {
    this._log('stopped task');
    state.activeTask = {
      id: 0
    };
  }

  @Mutation(UpdateTaskSuccess)
  updateTaskSuccess(state: HoursState, e: UpdateTaskSuccess) {
    this._log('updating task:', e.payload);
    if (state.tasks.byId[e.payload.id]) {
      state.tasks = {
        allIds: state.tasks.allIds,
        byId: {...state.tasks.byId}
      };
      state.tasks.byId[e.payload.id] = {...e.payload};
    }
  }

  @Action(DeleteTask)
  deleteTask(state: HoursState, a: DeleteTask) {
    return fromPromise(this.wws.deleteTask(a.taskId)).pipe(
      map(() => new DeleteTaskSuccess(a.taskId))
    );
  }

  @Action(InsertTask)
  insertTask(state: HoursState, a: InsertTask) {
    return fromPromise(this.wws.addTask(a.task)).pipe(
      map(task => new InsertTaskSuccess(task))
    );
  }

  @Action(ReadActiveTask)
  readActiveTask(state: HoursState) {
    return fromPromise(this.wws.activeTask()).pipe(
      map(active => new ReadActiveTaskSuccess(active))
    );
  }

  @Action(RefreshTasks)
  refreshTasks(state: HoursState) {
    return fromPromise(this.wws.readTasks()).pipe(
      map(tasks => new RefreshTasksSuccess(tasks))
    );
  }

  @Action(StartTask)
  startTask(state: HoursState, a: StartTask) {
    return fromPromise(this.wws.startTask(a.task)).pipe(
      map(active => new StartTaskSuccess(active))
    );
  }

  @Action(StopTask)
  stopTask(state: HoursState) {
    return fromPromise(this.wws.stopTask()).pipe(
      map(() => new StopTaskSuccess())
    );
  }

  @Action(UpdateTask)
  updateTask(state: HoursState, a: UpdateTask) {
    return fromPromise(this.wws.updateTask(a.task)).pipe(
      map(task => new UpdateTaskSuccess(task))
    );
  }

}
