<h1 align="center">File system watcher</h1>

<p align="center">
 Watch specific files, directories, deeply nested directories <br/>
 Rebuild recursive when new directories found or old directories remove <br/>
 Deduplicate events with debounce <br/>
</p>

<h2 align="center">Installation</h2>

```bash
npm i leadwatch --save
```

<h2 align="center">Usage</h2>

```js
const DirectoryWatcher = require('leadwatch');
const watcher = new DirectoryWatcher({
  timeout: 200, // Events debouncing for queue
  ignore: [new RegExp(/[\D\d]+\.ignore\D*/)], // Ignore files and directories
  deep: false, // Include nested directories
});
watcher.watch('/home/sashapop10/Downloads');
watcher.watch('/home/sashapop10/Documents');
watcher.on('change', fileName => console.log({ changed: fileName }));
watcher.on('delete', fileName => console.log({ deleted: fileName }));
```

<h2 align="center">Copyright & contributors</h2>

<p align="center">
Copyright © 2023 <a href="https://github.com/LeadFisherSolutions/leadwatch/graphs/contributors">Leadfisher contributors</a>.
Leadwatch is <a href="./LICENSE">MIT licensed license</a>.<br/>
Leadwatch is one of <a href="https://github.com/LeadFisherSolutions">leadfisher solutions</a>.
</p>
