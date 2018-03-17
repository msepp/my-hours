import { ITask, IGroup, IActiveTask } from '@web-workers/db/db.schema';


export class DeleteGroupSuccess {
constructor(public payload: number) {}
}

export class DeleteTaskSuccess {
constructor(public payload: number) {}
}

export class InsertGroupSuccess {
  constructor(public payload: IGroup) {}
}

export class InsertTaskSuccess {
  constructor(public payload: ITask) {}
}

export class ReadActiveTaskSuccess {
  constructor(public payload: IActiveTask) {}
}

export class ReadLatestTaskSuccess {
  constructor(public payload: number) {}
}

export class RefreshGroupsSuccess {
  constructor(public payload: IGroup[]) {}
}

export class RefreshTasksSuccess {
  constructor(public payload: ITask[]) {}
}

export class StartTaskSuccess {
  constructor(public payload: IActiveTask) {}
}

export class StopTaskSuccess {
}

export class UpdateGroupSuccess {
  constructor(public payload: IGroup) {}
}

export class UpdateTaskSuccess {
  constructor(public payload: ITask) {}
}
