import { Statement } from "../database/Statement";

export interface Database {
  mount: () => Promise<void>;
  saveChanges(): Promise<void>;
  run(query: string, params?: any[]): Promise<void>;
  exec(query: string): Promise<any[]>;
  prepare(query: string, params: any[]): Promise<number>;
  export(): Promise<Uint8Array>;
  close(): Promise<void>;
  wipe(): Promise<void>;
  getRowsModified(): Promise<number>;
  //createFunction(name: string, func: { apply: (arg0: null, arg1: any[]) => void; length: any; }): Promise<any>;
}
