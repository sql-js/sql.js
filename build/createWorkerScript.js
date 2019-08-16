// We want to bundle the Worker script (sql-wasm-debug) within the main.js
// Let's get the content of the worker script and wrap it in a string that we will save to ./out/sql-wasm-debug-stringify

const fs = require('fs');
const path = require('path');

const distFolder = '../out/';
const outFolder = '../src/worker/lib/';

fs.readdir(distFolder, (err, files) => files.forEach(file => {
  if (!file.startsWith('sql-wasm') || !file.endsWith('.js')) {
    return;
  }

  const IN_FILE = fs.readFileSync(path.join(distFolder, file), {encoding: 'utf8'});
  //const IN_FILE_ESCAPED = IN_FILE.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  const IN_FILE_ESCAPED = Buffer.from(IN_FILE, 'binary').toString('base64');

  const OUT_FILE = path.join(outFolder, `${file.replace('.js', '')}.ts`);
  const fileContent = `export const WORKER_SCRIPT: string = '${IN_FILE_ESCAPED}';`;
  fs.writeFileSync(OUT_FILE, fileContent);
}));