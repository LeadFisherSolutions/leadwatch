# [Node js] File system watcher

- Watch specific files, directories, deeply nested directories
- Rebuild recursive when new directories found or old directories remove
- Deduplicate events with debounce

## Usage

```js
const leadwatch = require('leadwatch');
const watcher = new leadwatch.DirectoryWatcher({ timeout: 200 });
watcher.watch('/home/sashapop10/Downloads');
watcher.watch('/home/sashapop10/Documents');
watcher.on('change', fileName => console.log({ changed: fileName }));
watcher.on('delete', fileName => console.log({ deleted: fileName }));
```
