import {Database, whitelistedFunctions as DatabaseWhitelistedFunctions} from './Database';
import {whitelistedFunctions as StatementWhitelistedFunctions} from './Statement';

// Receive messages from outside the worker
export default class DatabaseWorkerForwarder {
  private static DatabaseInstance?: Database;
  private static readonly statementFunctionName = 'statements.';

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
    const args = event.data.args;
    const functionName = event.data.functionName;

    // Handle the init of the constructor
    if (functionName === 'constructor') {
      if (!this.DatabaseInstance) {
        this.DatabaseInstance = new Database();
      }
      return this.postMessageToOrigin({error: false, output: undefined}, event);
    }
    
    if (!this.DatabaseInstance) {
      return this.throwError('Database has not been initialized, you must do it first', event);
    }

    // Remapper
    let output;
    try {
      const isStatementCall = functionName.startsWith(this.statementFunctionName);
      if (isStatementCall) {
        const statementFunctionName = functionName.substr(this.statementFunctionName.length);
        if (!StatementWhitelistedFunctions.includes(statementFunctionName)) {
          throw new Error('This function either does not exist or is not allowed to be called from the proxy (Statement)');
        }
        const statementId = Number(event.data.statementId);
        output = this.DatabaseInstance.statements[statementId][statementFunctionName](...args);
      } else {
        if (!DatabaseWhitelistedFunctions.includes(functionName)) {
          throw new Error('This function either does not exist or is not allowed to be called from the proxy (Database)');
        }
        output = await this.DatabaseInstance[functionName](...args);
        // Reset database global if we closed the database
        if (functionName === 'close') {
          this.DatabaseInstance = undefined;
        }
      }
    } catch (error) {
      return this.throwError(error.message, event);
    }

    return this.postMessageToOrigin({error: false, output}, event);
  }
}
