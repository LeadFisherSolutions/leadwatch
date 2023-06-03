'use strict';

const fs = require('node:fs');
const { join, sep } = require('node:path');
const { access, schedular } = require('./lib');
const { EventEmitter } = require('node:events');

module.exports = function (options) {
  const watchers = new Map();
  const bridge = new EventEmitter();
  const post = schedular(options?.timeout, bridge.emit.bind(bridge));
  const inIgnore = access.bind(null, options?.ignore ?? []);

  const setWatcher = path => {
    if (watchers.has(path)) return;
    const listener = (_, filename) => {
      const eventPath = path.endsWith(sep + filename) ? path : join(path, filename);
      if (!inIgnore(eventPath)) return;
      fs.stat(eventPath, (err, stats) => {
        if (err) return void (bridge.unwatch(eventPath), post('delete', eventPath));
        stats.isDirectory() && options?.deep && bridge.watch(eventPath), post('change', eventPath);
        return void 0;
      });
    };
    watchers.set(fs.watch(path, listener));
  };

  bridge.unwatch = path => void (watchers.get(path)?.close(), watchers.delete(path));
  bridge.watch = path => {
    if (watchers.has(path)) return;
    fs.stat(path, (err, stats) => {
      if (err) return;
      setWatcher(path);
      if (!stats.isDirectory() || !options?.deep) return;
      const cb = files => files.forEach(f => !inIgnore(f.name) && f.isDirectory() && bridge.watch(join(path, f.name)));
      fs.readdir(path, { withFileTypes: true }, (err, files) => !err && cb(files));
    });
  };

  return bridge;
};
