import {Database, whitelistedFunctions} from './Database';

// Receive messages from outside the worker
export default class DatabaseWorkerForwarder {
  private static DatabaseInstance?: Database;
  private static postMessageToOrigin(data: any, event: any): void {
    if (!event.ports[0]) {
      throw new Error('Unable to reply to origin');
    }
    event.ports[0].postMessage(data);
  }
  private static throwError(error: string, event: any): void {
    this.postMessageToOrigin({error}, event);
  }

  public static async onMessageReceived(event: any): Promise<void> {
    const args = event.data.__args;
    const functionName = event.data.__functionName;

    //console.log(JSON.stringify({message: 'onMessageReceived', args, functionName}));

    // Handle the init of the constructor
    if (functionName === 'constructor') {
      DatabaseWorkerForwarder.DatabaseInstance = new Database(...args);
      return DatabaseWorkerForwarder.postMessageToOrigin({error: false, output: undefined}, event);
    }
    
    if (!DatabaseWorkerForwarder.DatabaseInstance) {
      return DatabaseWorkerForwarder.throwError('Database has not been initialized, you must do it first', event);
    }

    if (!functionName || !whitelistedFunctions.includes(functionName)) {
      return DatabaseWorkerForwarder.throwError('This function either does not exist or is not allowed to be called', event);
    }

    let output;
    try {
      output = await DatabaseWorkerForwarder.DatabaseInstance[functionName](...args);
    } catch (error) {
      return DatabaseWorkerForwarder.throwError(error.message, event);
    }

    return DatabaseWorkerForwarder.postMessageToOrigin({error: false, output}, event);
  }
}
