
}).bind(this);

Module['preRun'] = Module['preRun'] || [];
Module['preRun'].push(runCompiledCode);