let DatabaseWorkerForwarder: any;
const isRuntimeInitialized = (() => new Promise(resolve =>
  Module['onRuntimeInitialized'] = async () => {
    DatabaseWorkerForwarder = (await import('./DatabaseWorkerForwarder')).default;
    resolve();
  }
))();

self.addEventListener('message', async (event) => {
  await isRuntimeInitialized;
  DatabaseWorkerForwarder.onMessageReceived(event);
});
