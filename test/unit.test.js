'use strict';

const fs = require('fs').promises;
const path = require('path');
const { DirectoryWatcher } = require('..');
const test = require('node:test');
const assert = require('node:assert');

const TEST_TIMEOUT = 2000;
const targetPath = path.join(process.cwd(), 'test/example');

test('Watch file change', async () => {
  assert.strictEqual(typeof DirectoryWatcher, 'function');

  const timeout = setTimeout(() => assert.fail('Timeout'), TEST_TIMEOUT);
  const watcher = new DirectoryWatcher({ timeout: 200 });
  watcher.watch(targetPath);
  watcher.on('change', filename => {
    assert.strictEqual(filename.endsWith('file.ext'), true);
    clearTimeout(timeout);
    process.kill(0);
  });

  await fs.writeFile(path.join(targetPath, 'file.ext'), 'example', 'utf8', err => assert.fail(err));
});
