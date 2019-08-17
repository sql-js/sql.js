import {MessageQueue} from './MessageQueue';

declare const self: SharedWorker.SharedWorkerGlobalScope;
self.onconnect = (event) => event.ports[0].onmessage = (event) => MessageQueue.add(event);
//self.addEventListener('message', (event) => DatabaseQueue.add(event));
