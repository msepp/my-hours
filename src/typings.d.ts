/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

// For web worker support
declare module 'worker-loader!*' {
  const content: any;
  export = content;
}
