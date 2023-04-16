'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const WATCH_TIMEOUT = 10000;

class DirectoryWatcher extends EventEmitter {
  #watchers;
  #timeout;
  #timer;
  #queue;
  #options;

  constructor(options = {}) {
    super();

    const { timeout } = options;
    this.#options = options;
    this.#watchers = new Map();
    this.#timeout = timeout ?? WATCH_TIMEOUT;
    this.#timer = null;
    this.#queue = new Map();
  }

  #post = (event, filePath) => {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#sendQueue(), this.#timeout);
    this.#queue.set(filePath, event);
  };

  #access = file => {
    const ignore = this.#options.ignore ?? [];
    const isIgnore = ignore.reduce((acc, pattern) => (acc |= new RegExp(pattern).test(file)), false);
    return !isIgnore;
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
    const watcher = fs.watch(targetPath, (event, filename) => {
      const target = targetPath.endsWith(path.sep + filename);
      const filePath = target ? targetPath : path.join(targetPath, filename);
      if (!this.#access(filePath)) return;

      fs.stat(filePath, (err, stats) => {
        if (err) {
          this.unwatch(filePath);
          this.#post('delete', filePath);
          return;
        }

        if (stats.isDirectory() && this.#options.deep) this.watch(filePath);
        this.#post('change', filePath);
      });
    });

    this.#watchers.set(targetPath, watcher);
  };

  watch = targetPath => {
    const watcher = this.#watchers.get(targetPath);
    if (watcher) return;

    fs.stat(targetPath, (err, stats) => {
      if (err) return;

      if (stats.isDirectory())
        fs.readdir(targetPath, { withFileTypes: true }, (err, files) => {
          if (err) return;
          for (const file of files) {
            if (!this.#access(file.name) || !file.isDirectory() || !this.#options.deep) continue;
            const dirPath = path.join(targetPath, file.name);
            this.watch(dirPath);
          }
        });

      this.#setWatcher(targetPath);
    });
  };

  unwatch = targetPath => {
    const watcher = this.#watchers.get(targetPath);
    if (!watcher) return;
    watcher.close();
    this.#watchers.delete(targetPath);
  };
}

module.exports = DirectoryWatcher;
