// Declare functions from exports/runtime_methods.json
declare function stackAlloc(ptr: number): number;
declare function stackSave(): number;
declare function stackRestore(ptr: number): void;

// Declare globals exposed by WASM

/*
// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}
*/
declare function allocateUTF8OnStack(str: string): number;

/*
function removeFunction(index) {

  functionPointers[index-jsCallStartIndex] = null;
}
*/
declare function removeFunction(index: number): void;

/*
// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {


  var base = 0;
  for (var i = base; i < base + 64; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func;
      return jsCallStartIndex + i;
    }
  }
  throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';

}
*/
declare function addFunction(func: Function, sig?: any): number;
