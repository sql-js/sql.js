// We are modularizing this manually because the current modularize setting in Emscripten has some issues:
// https://github.com/kripken/emscripten/issues/5820
var Module = (function(Module) {
  
    // If Module already exists, use it
    var Module = typeof Module !== 'undefined' ? Module : {};
    
    Module['preRunHasRun'] = new Promise(function(resolve){
      // TODO: Add on to any postRun objects already there
      Module['preRun'] = function(){
        // When Emscripted calls preRun, this resolves
        resolve();
      }
    }.bind(this));
    
    var postRunHasRun = Module['postRunHasRun'] = new Promise(function(resolve){
      // TODO: Add on to any postRun objects already there
      Module['postRun'] = function(){
        // When Emscripted calls postRun, this resolves
        resolve();
      }
    }.bind(this));
    
    // This is a promise that a module loader can listen for 
    Module['ready'] = new Promise(function(resolve, reject){
      // TODO: Add on to any onAbort function already there
      Module['onAbort'] = function(what){
        reject(new Error(what));
      }
  
      return postRunHasRun.then(function(){
        resolve(Module);
      }.bind(this));
  
    }.bind(this));

