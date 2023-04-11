import { EventEmitter } from 'events';
import { FSWatcher } from 'fs';

export class DirectoryWatcher extends EventEmitter {
  watchers: Map<string, FSWatcher>;
  timeout: number;
  timer: NodeJS.Timer;
  queue: Map<string, string>;
  constructor(options?: { timeout?: number });
  post(event: string, filename: string): void;
  sendQueue(): void;
  watchDirectory(path: string): void;
  watchFile(path: string): void;
  unwatch(path: string): void;
}
