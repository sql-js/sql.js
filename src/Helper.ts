export const NULL = 0; // Null pointer
export enum SQLite {
  OK = 0,
  ERROR = 1,
  INTERNAL = 2,
  PERM = 3,
  ABORT = 4,
  BUSY = 5,
  LOCKED = 6,
  NOMEM = 7,
  READONLY = 8,
  INTERRUPT = 9,
  IOERR = 10,
  CORRUPT = 11,
  NOTFOUND = 12,
  FULL = 13,
  CANTOPEN = 14,
  PROTOCOL = 15,
  EMPTY = 16,
  SCHEMA = 17,
  TOOBIG = 18,
  CONSTRAINT = 19,
  MISMATCH = 20,
  MISUSE = 21,
  NOLFS = 22,
  AUTH = 23,
  FORMAT = 24,
  RANGE = 25,
  NOTADB = 26,
  NOTICE = 27,
  WARNING = 28,
  ROW = 100,
  DONE = 101,

  // Data types
  INTEGER = 1,
  FLOAT = 2,
  TEXT = 3,
  BLOB = 4,
  NULL = 5,

  // Encodings, used for registering functions. 
  UTF8 = 1,
}

export function __range__(left: number, right: number, inclusive: any) {
  let range: number[] = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
