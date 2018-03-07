import { environment } from 'environments/environment';
import * as Msg from './db.messages';
import * as Schema from './db.schema';

// Need to declare it like this, otherwise we get some funky code that doesn't
// work.
declare function postMessage(message: Msg.IDBResponse, transfer?: any[]): void;

// Instantiate our database
const db = new Schema.HoursDB();

// log is a simple function for namespaced logging
const log = (...args: any[]) => {
  if (environment.workerDebug) {
    console.log('[worker]', ...args);
  }
};

// replyTo posts a reply to the given input message. Reply data is set from the
// response object.
function replyTo(msg: Msg.DBMessage, response?: {error?: Error, data?: any}): void {
  log(`response for ${msg.id}/${msg.type}`, response);
  postMessage({
    id: msg.id,
    ...response
  });
}

// WorkerEvent describes expected payload type for incoming messages.
export interface WorkerEvent {
  data: Msg.DBMessage;
}

// Worker API. Handles incoming events
onmessage = (event: WorkerEvent) => {
  const msg = event.data;
  log('received', msg);

  switch (msg.type) {
    case Msg.DBMessageType.ActiveTask:
      db.getActiveTask()
        .then(task => replyTo(msg, {data: task}))
        .catch(e => replyTo(msg, {error: e}));
    break;

    case Msg.DBMessageType.DeleteGroup:
      db.deleteGroup(msg.groupId)
        .then(() => replyTo(msg, {}))
        .catch(e => replyTo(msg, {error: e}));
    break;

    case Msg.DBMessageType.DeleteTask:
      db.deleteTask(msg.taskId)
        .then(() => replyTo(msg, {}))
        .catch(e => replyTo(msg, {error: e}));
    break;

    case Msg.DBMessageType.InsertGroup:
      db.insertGroup(msg.group)
        .then(newId => replyTo(msg, {data: newId}))
        .catch(e => replyTo(msg, {error: e}));
    break;

    case Msg.DBMessageType.InsertTask:
      db.insertTask(msg.task)
        .then(newId => replyTo(msg, {data: newId}))
        .catch(e => replyTo(msg, {error: e}));
    break;

    case Msg.DBMessageType.ReadGroups:
      db.readGroups()
        .then(groups => replyTo(msg, {data: groups}))
        .catch(e => replyTo(msg, {error: e}));
    break;

    case Msg.DBMessageType.CreateReport:
      db.createReport(msg.options)
        .then(report => replyTo(msg, {data: report}))
        .catch(e => replyTo(msg, {error: e}));
    break;

    case Msg.DBMessageType.ReadTasks:
      db.readTasks()
        .then(tasks => replyTo(msg, {data: tasks}))
        .catch(e => replyTo(msg, {error: e}));
    break;

    case Msg.DBMessageType.StartTask:
      db.setActiveTask(msg.task.id)
        .then(t => replyTo(msg, {data: t}))
        .catch(e => replyTo(msg, {error: e.message}));
    break;

    case Msg.DBMessageType.StopTask:
      db.setActiveTask(0)
        .then(t => replyTo(msg, {data: t}))
        .catch(e => {
          replyTo(msg, {error: e.name});
        });
    break;

    case Msg.DBMessageType.UpdateGroup:
      db.updateGroup(msg.group)
        .then(group => replyTo(msg, {data: group}))
        .catch(e => replyTo(msg, {error: e.message}));
    break;

    case Msg.DBMessageType.UpdateTask:
      db.updateTask(msg.task)
        .then(task => replyTo(msg, {data: task}))
        .catch(e => replyTo(msg, {error: e.message}));
    break;
  }
};
