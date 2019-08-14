// Resolve is present in wrapper.ts
declare function resolveModule(value: any): void;
declare function reject(value: any): void;
declare const moduleConfig: {};

for (const configName in moduleConfig) {
  Module[configName] = moduleConfig[configName];
}

const originalOnAbortFunction = Module["onAbort"];
Module["onAbort"] = (errorThatCausedAbort) => {
  reject(new Error(errorThatCausedAbort));
  if (originalOnAbortFunction) {
    originalOnAbortFunction(errorThatCausedAbort);
  }
};

Module['postRun'] = Module['postRun'] || [];
Module['postRun'].push(async () => {
  // Resolve sqleet
  resolveModule((await import("./Database")).default);
});
