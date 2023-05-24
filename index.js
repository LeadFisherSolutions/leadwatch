'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const WATCH_TIMEOUT = 10000;

module.exports = class Watcher extends EventEmitter {
  #watchers = new Map();
  #queue = new Map();
  #timer = null;
  #timeout;
  #ignore;
  #deep;

  constructor(options) {
    super();
    this.#deep = options?.deep;
    this.#timeout = options?.timeout ?? WATCH_TIMEOUT;
    this.#ignore = options?.ignore ?? [];
  }

  #access = file => !this.#ignore.reduce((acc, pattern) => (acc |= new RegExp(pattern).test(file)), false);
  #post = (event, filePath) => {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#sendQueue(), this.#timeout);
    this.#queue.set(filePath, event);
  };

  #sendQueue = () => {
    if (!this.#timer) return;
    clearTimeout(this.#timer);
    this.#timer = null;
    for (const [filePath, event] of this.#queue) this.emit(event, filePath);
    this.#queue.clear();
  };

  #setWatcher = targetPath => {
    if (this.#watchers.has(targetPath)) return;
    const watcher = fs.watch(targetPath, (_, filename) => {
      const target = targetPath.endsWith(path.sep + filename);
      const filePath = target ? targetPath : path.join(targetPath, filename);
      if (!this.#access(filePath)) return;
      fs.stat(filePath, (err, stats) => {
        if (err) return void this.unwatch(filePath), this.#post('delete', filePath);
        if (stats.isDirectory() && this.#deep) this.watch(filePath);
        this.#post('change', filePath);
        return void 0;
      });
    });
    this.#watchers.set(targetPath, watcher);
  };

  watch = targetPath => {
    if (this.#watchers.get(targetPath)) return;
    fs.stat(targetPath, (err, stats) => {
      if (err) return;
      this.#setWatcher(targetPath);
      if (!stats.isDirectory()) return;
      fs.readdir(targetPath, { withFileTypes: true }, (err, files) => {
        if (err) return;
        for (const file of files) {
          if (!this.#access(file.name) || !file.isDirectory() || !this.#deep) continue;
          this.watch(path.join(targetPath, file.name));
        }
      });
    });
  };

  unwatch = targetPath => {
    const watcher = this.#watchers.get(targetPath);
    if (!watcher) return;
    watcher.close(), this.#watchers.delete(targetPath);
  };
}
