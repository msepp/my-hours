import { ITask, IGroup, IActiveTask } from '@web-workers/db/db.schema';

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

export class StartTask {
  constructor(public task: ITask) {}
}

export class StopTask {
}

export class UpdateGroup {
  constructor(public group: IGroup) {}
}

export class UpdateTask {
  constructor(public task: ITask) {}
}
