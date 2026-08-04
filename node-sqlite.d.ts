declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): Statement;
  }

  export interface Statement {
    run(...params: any[]): { lastInsertRowid: number | bigint; changes: number };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }
}
