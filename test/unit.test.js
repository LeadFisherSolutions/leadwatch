'use strict';

const fs = require('node:fs');
const path = require('node:path');
const DirectoryWatcher = require('..');
const test = require('node:test');
const assert = require('node:assert');

const WRITE_TIMEOUT = 100;
const TEST_TIMEOUT = 2000;
const targetPath = path.join(process.cwd(), 'test');

test('Watch file change', async () => {
  assert.strictEqual(typeof DirectoryWatcher, 'function');

  const timeout = setTimeout(() => {
    assert.fail(new Error('Timeout'));
  }, TEST_TIMEOUT);
  const watcher = new DirectoryWatcher({
    timeout: 200,
    deep: true,
    ignore: ['unit.test.js'],
  });
  watcher.watch(targetPath);
  watcher.on('change', filename => {
    assert.strictEqual(filename.endsWith('file.ext'), true);
    clearTimeout(timeout);
    process.kill(0);
  });

  setTimeout(() => {
    fs.writeFile(path.join(targetPath, 'example', 'file.ext'), 'example', 'utf8', err => assert.fail(err));
  }, WRITE_TIMEOUT);
});
