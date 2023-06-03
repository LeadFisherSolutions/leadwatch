'use strict';

const WATCH_TIMEOUT = 10000;
const schedular = (timeout = WATCH_TIMEOUT, emit) => {
  let timer = null;
  const queue = new Map();

  const sendQueue = () => {
    if (!timer) return;
    timer = (clearTimeout(timer), null);
    const packet = [...queue.entries()];
    queue.clear();
    emit('before', packet);
    for (const [path, event] of packet) emit(event, path);
    emit('after', packet);
  };

  return (event, path) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(sendQueue, timeout);
    queue.set(path, event);
  };
};

const access = (ignore, file) => !ignore.reduce((acc, pattern) => (acc |= new RegExp(pattern).test(file)), false);
module.exports = { access, schedular };
