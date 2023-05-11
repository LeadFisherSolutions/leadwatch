'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Watcher = require('..');
const test = require('node:test');
const assert = require('node:assert');

const WRITE_TIMEOUT = 100;
const TEST_TIMEOUT = 2000;
const targetPath = path.join(process.cwd(), 'test');
const filePath = path.join(targetPath, 'example', 'file.ext');

const testFinalize = (i = 1) => (i++, i !== 2 ? testFinalize(i) : setTimeout(() => process.exit(0), 500));

test('Watch file change', async () => {
  assert.strictEqual(typeof Watcher, 'function');
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('Timeout'), TEST_TIMEOUT);
    setTimeout(() => fs.writeFile(filePath, 'example', 'utf8', err => err && reject(err)), WRITE_TIMEOUT);

    const watcher = new Watcher({ timeout: 200, deep: true, ignore: ['unit.test.js'] });
    watcher.watch(path.join(targetPath, 'example', 'file.ext'));
    watcher.once('change', filename => {
      assert.strictEqual(filename.endsWith('file.ext'), true);
      clearTimeout(timeout);
      watcher.unwatch(path.join(targetPath, 'example', 'file.ext'));
      resolve();
    });
  }).catch(err => assert.fail(err));
  testFinalize();
});

test('Watch dir files change', async () => {
  assert.strictEqual(typeof Watcher, 'function');
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('Timeout'), TEST_TIMEOUT);
    setTimeout(() => fs.writeFile(filePath, 'example', 'utf8', err => err && reject(err)), WRITE_TIMEOUT);

    const watcher = new Watcher({ timeout: 200, deep: true, ignore: ['unit.test.js'] });
    watcher.watch(targetPath);
    watcher.once('change', filename => {
      assert.strictEqual(filename.endsWith('file.ext'), true);
      clearTimeout(timeout);
      watcher.unwatch(targetPath);
      resolve();
    });
  }).catch(err => assert.fail(err));
  testFinalize();
});
