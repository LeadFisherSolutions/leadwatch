'use strict';

const Watcher = require('..');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');

setTimeout(() => process.exit(0), 3000);

const WRITE_TIMEOUT = 100;
const TEST_TIMEOUT = 2000;

const dir = process.cwd();

const cleanup = dir => {
  fs.rm(dir, { recursive: true, force: true }, error => {
    if (error) throw error;
  });
};

const create = (watcher, watchPath, callback, check) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('timeout'), TEST_TIMEOUT);
    watcher.once('change', path => {
      assert.strictEqual(check(path), true);
      clearTimeout(timeout);
      resolve();
    });

    setTimeout(() => callback(reject), WRITE_TIMEOUT);
  }).catch(err => (watcher.unwatch(watchPath), cleanup(watchPath), assert.fail(err)));

test('Nested folder updates check', async () => {
  const watchPath = path.join(dir, 'test/example');
  const filePath = path.join(watchPath, 'file.ext');
  const deepFolderPath = path.join(watchPath, 'deep');
  const deepFolderFilePath = path.join(deepFolderPath, 'file.deep.ext');
  // const ignoreFilePath = name => path.join(deepFolderPath, name + '.ignore.ext');

  assert.strictEqual(typeof Watcher, 'function');

  const watcher = new Watcher({ timeout: 200, deep: true, ignore: ['/.*.ignore.ext'] });
  fs.mkdirSync(watchPath);
  watcher.watch(watchPath);

  const createTestCase = create.bind(null, watcher, watchPath);

  await createTestCase(
    reject => fs.writeFile(filePath, 'create', 'utf8', err => err && reject(err, 'Can not write file')),
    filepath => filepath.endsWith(path.sep + 'file.ext'),
  );

  await createTestCase(
    () => fs.mkdirSync(deepFolderPath),
    filepath => filepath.endsWith(path.sep + 'deep'),
  );

  await createTestCase(
    reject => fs.writeFile(deepFolderFilePath, 'create', 'utf8', err => err && reject(err, 'Can not write file')),
    filepath => filepath.endsWith(path.sep + 'file.deep.ext'),
  );

  watcher.unwatch(watchPath);
  cleanup(watchPath);
});

test('Aggregated change', async () => {
  const watchPath = path.join(dir, 'test/example2');
  fs.mkdirSync(watchPath);

  const files = ['file1.ext', 'file2.ext', 'file3.ext', 'file4.ignore.ext', 'file5.ignore.ext'];
  const watcher = new Watcher({ timeout: 200, ignore: ['file[0-9]\\.ignore\\.ext'] });
  watcher.watch(watchPath);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('timeout'), TEST_TIMEOUT);
    let changeCount = 0;

    watcher.on('change', path => {
      assert.strictEqual(path.endsWith('.ext'), true);
      changeCount++;
    });

    watcher.on('before', changes => {
      assert.strictEqual(changes.length, 3);
    });

    watcher.on('after', changes => {
      assert.strictEqual(changeCount, 3);
      assert.strictEqual(changes.length, 3);
      clearTimeout(timeout);
      watcher.unwatch(watchPath);
      resolve();
    });

    setTimeout(() => {
      for (const name of files) {
        const filePath = path.join(watchPath, name);
        fs.writeFile(filePath, 'example', 'utf8', err => err && reject(err, 'Can not write file'));
      }
    }, WRITE_TIMEOUT);
  }).catch(e => (watcher.unwatch(watchPath), cleanup(watchPath), assert.fail(e)));

  watcher.unwatch(watchPath);
  cleanup(watchPath);
});

test('Specific file', async () => {
  const dirPath = path.join(dir, 'test/example3');
  const watchPath = path.join(dirPath, 'file.ext');
  fs.mkdirSync(dirPath);
  fs.writeFileSync(watchPath, 'create', 'utf8');

  const watcher = new Watcher({ timeout: 200 });
  watcher.watch(watchPath);

  const createTestCase = create.bind(null, watcher, watchPath);
  createTestCase(
    reject => fs.writeFile(watchPath, 'update', 'utf8', err => err && reject(err, 'Can not write file')),
    filepath => filepath.endsWith(path.sep + 'file.ext'),
  );

  watcher.unwatch(watchPath);
  cleanup(dirPath);
});
