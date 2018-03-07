import { IGroup, ITask, IReportOptions } from './db.schema';

export enum DBMessageType {
  DeleteGroup = 'delete.group',
  InsertGroup = 'insert.group',
  ReadGroups = 'read.groups',
  UpdateGroup = 'update.group',

  ActiveTask = 'active.task',
  DeleteTask = 'delete.task',
  InsertTask = 'insert.task',
  ReadTasks = 'read.tasks',
  StartTask = 'start.task',
  StopTask = 'stop.task',
  UpdateTask = 'update.task',

  CreateReport = 'create.report',
}

// UUID generator for messages
const nextId = (() => {
  let _nextId = 0;
  return () => {
    return ++_nextId;
  };
})();

// IDBMessage defines the fields required by DB worker request messages
export interface IDBMessage {
  readonly type: DBMessageType;
  readonly id: number;
  data?: any;
}

// IDBResponse defines fields for DB worker responses
export interface IDBResponse {
  readonly id: number;
  error?: Error;
  data?: any;
}

// DBIdableMessage is a base class for DB worker message implementations.
// Automatically assigns an request ID for the message, so it can be correlated
// to a response.
class DBIdableMessage {
  readonly id: number;
  constructor() {
    this.id = nextId();
  }
}

export class DBMessageActiveTask extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.ActiveTask;
  constructor() {
    super();
  }
}

export class DBMessageCreateReport extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.CreateReport;
  constructor(public options: IReportOptions) {
    super();
  }
}

export class DBMessageDeleteGroup extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.DeleteGroup;
  constructor(public groupId) {
    super();
  }
}

export class DBMessageDeleteTask extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.DeleteTask;
  constructor(public taskId) {
    super();
  }
}

export class DBMessageInsertGroup extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.InsertGroup;
  constructor(public group: IGroup) {
    super();
  }
}

export class DBMessageInsertTask extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.InsertTask;
  constructor(public task: ITask) {
    super();
  }
}

export class DBMessageReadGroups extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.ReadGroups;
  constructor() {
    super();
  }
}

export class DBMessageReadTasks extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.ReadTasks;
  constructor() {
    super();
  }
}

export class DBMessageStartTask extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.StartTask;
  constructor(public task: ITask) {
    super();
  }
}

export class DBMessageStopTask extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.StopTask;
  constructor() {
    super();
  }
}

export class DBMessageUpdateGroup extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.UpdateGroup;
  constructor(public group: IGroup) {
    super();
  }
}

export class DBMessageUpdateTask extends DBIdableMessage implements IDBMessage {
  readonly type = DBMessageType.UpdateTask;
  constructor(public task: ITask) {
    super();
  }
}

// Union type of all DB worker message implementations
export type DBMessage = DBMessageActiveTask |
                        DBMessageDeleteGroup |
                        DBMessageDeleteTask |
                        DBMessageInsertGroup |
                        DBMessageInsertTask |
                        DBMessageReadGroups |
                        DBMessageCreateReport |
                        DBMessageReadTasks |
                        DBMessageStartTask |
                        DBMessageStopTask |
                        DBMessageUpdateGroup |
                        DBMessageUpdateTask;
