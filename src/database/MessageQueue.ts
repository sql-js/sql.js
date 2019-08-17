let DatabaseWorkerForwarder: any;
const isRuntimeInitialized = (() => new Promise(resolve =>
  Module['onRuntimeInitialized'] = async () => {
    DatabaseWorkerForwarder = (await import('./DatabaseWorkerForwarder')).default;
    resolve();
  }
))();

export class MessageQueue {
  private static processing: boolean = false;
  private static queue: any[] = [];

  public static async add(event: any) {
    if (!this.processing) {
      // Ensure the runtime is available
      await isRuntimeInitialized;

      // Not currently processing anything so just process the event
      await this.process(event);
    } else {
      this.queue.push(event);
    }
  }

  private static async process(event: any) {
    this.processing = true;
    await DatabaseWorkerForwarder.onMessageReceived(event);
    if (this.queue.length !== 0) {
      // Pull out the oldest message and process it
      const nextEvent = this.queue.shift();
      if (nextEvent) {
        await this.process(nextEvent);
      }
    }
    this.processing = false;
  }
}
