import { EventEmitter } from 'events';
import { FSWatcher } from 'fs';

type Options = {
  timeout?: number; //* Debounce timeout in milliseconds
  deep?: boolean; //* If true, will watch files recursively
  ignore?: RegExp[]; //* Ignore specific files (should be dir)
};

export class DirectoryWatcher extends EventEmitter {
  constructor(options?: Options);
  watch(path: string): void;
  unwatch(path: string): void;
}
