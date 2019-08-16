import {ConnectionOptions} from '../interfaces/ConnectionOptions';

import {WORKER_SCRIPT} from './lib/sql-wasm';

export class DatabaseWorkerSender {
  private worker: Worker;
  private databaseInstanceCreated: boolean = false;

  constructor(private options: ConnectionOptions, private identifier: string = 'default') {
    const workerUrl = DatabaseWorkerSender.createWorkerFakeUrl();
    this.worker = new Worker(workerUrl);
    URL.revokeObjectURL(workerUrl);

    // Return a proxy so we can forward all calls to the Worker
    return new Proxy(this, {
      get: (target, calleeName) => async (...args) => {
        if (!this.databaseInstanceCreated) {
          await this.createDatabaseInstance();
        }
        //console.log('Function call -> ', calleeName, args);
        return this.postMessageToWorker(calleeName.toString(), args);
      }
    });
  }

  private static createWorkerFakeUrl() {
    const text = new TextEncoder();
    const arrayBuffer = text.encode(window.atob(WORKER_SCRIPT));
    const workerScript = new Blob([arrayBuffer], {type: 'application/javascript'});
    return URL.createObjectURL(workerScript);
  }

  // Create the database instance on the worker
  private async createDatabaseInstance() {
    await this.postMessageToWorker('constructor', [this.options, this.identifier]);
    this.databaseInstanceCreated = true;
  }

  private postMessageToWorker = (calleeName: string, args: any): Promise<any> => {      
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = event => {
        if (event.data.error) {
          return reject(event.data.error);
        }
        resolve(event.data.output);
      };

      this.worker.postMessage({
        __args: Array.from(args), // [query, params]...
        __functionName: calleeName, // Name of the function to call from the worker
      }, [messageChannel.port2]);
    });
  }
}
