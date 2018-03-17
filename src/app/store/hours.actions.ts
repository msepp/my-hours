import { ITask, IGroup, IActiveTask, IStopTask } from '@web-workers/db/db.schema';

export class DeleteGroup {
  constructor(public groupId: number) {}
}

export class DeleteTask {
  constructor(public taskId: number) {}
}

export class InitReady {
}

export class InsertGroup {
  constructor(public group: IGroup) {}
}

export class InsertTask {
  constructor(public task: ITask) {}
}

export class RefreshGroups {
}

export class RefreshTasks {
}

export class ReadActiveTask {
}
export class ReadLatestTask {
}

export class StartTask {
  constructor(public task: ITask) {}
}

export class StopTask {
  constructor(public task: IStopTask) {}
}

export class UpdateGroup {
  constructor(public group: IGroup) {}
}

export class UpdateTask {
  constructor(public task: ITask) {}
}
