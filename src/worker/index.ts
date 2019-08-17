function objectFrozen(): boolean {
  throw new Error('Forbidden operation, object is frozen');
}

export class DatabaseProxy {
  private worker: SharedWorker.SharedWorker;
  private databaseInstanceCreated: boolean = false;

  constructor(sharedWorkerUrl: string) {
    if (!window['SharedWorker']) {
      throw new Error('Shared workers are not available in your browser.');
    }

    //const workerUrl = DatabaseWorkerProxy.createWorkerFakeUrl();
    this.worker = new SharedWorker(sharedWorkerUrl);
    this.worker.port.start();
    //URL.revokeObjectURL(workerUrl);

    window.onunload = async () => {
      if (this.databaseInstanceCreated) {
        await this.postMessageToWorker('saveChanges');
      }
    };

    // Return a proxy so we can forward all calls to the Worker
    return this.createNewProxy<this>(this, async (calleeName, ...args) => {
      if (!this.databaseInstanceCreated) {
        await this.createDatabaseInstance();
      }
      const response = await this.postMessageToWorker(calleeName, args);
      return response;
    });
  }

  private createNewProxy<T>(forwardTo: any, handler: (calleeName: string, ...args: any) => any): T {
    return new Proxy(forwardTo, {
      get: (target, calleeName) => {
        // https://stackoverflow.com/a/53890904
        // This proxy is not thenable
        if (calleeName === 'then') {
          return null;
        }
        return async (...args) => handler(calleeName.toString(), ...args)
      },
      set: objectFrozen,
      has: objectFrozen,
      deleteProperty: objectFrozen
    });
  }

  /*private static createWorkerFakeUrl() {
    const text = new TextEncoder();
    const arrayBuffer = text.encode(window.atob(WORKER_SCRIPT));
    const workerScript = new Blob([arrayBuffer], {type: 'application/javascript'});
    return URL.createObjectURL(workerScript);
  }*/

  // Create the database instance on the worker
  private async createDatabaseInstance() {
    await this.postMessageToWorker('constructor');
    this.databaseInstanceCreated = true;
  }

  private remapper(calleeName: string, output: any) {
    switch (calleeName) {
      case 'prepare':
        // Return a proxy that will forward to the Worker API
        const statementId: number = output;
        return this.createNewProxy<{}>({}, async (calleeName, ...args) => {
          //console.log('Statement call detected: ', calleeName, args);
          const response = await this.postMessageToWorker(`statements.${calleeName.toString()}`, args, {statementId});
          return response;
        });
    }
    return output;
  }

  private postMessageToWorker = (calleeName: string, args: any[] = [], additionalData: {} = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = event => {
        if (event.data.error) {
          return reject(event.data.error);
        }

        const output = this.remapper(calleeName, event.data.output);
        resolve(output);
      };

      this.worker.port.postMessage({
        args: args.slice(), // Force casting "arguments" into a regular Array
        functionName: calleeName, // Name of the function to call from the worker
        ...additionalData,
      }, [messageChannel.port2]);
    });
  }
}
