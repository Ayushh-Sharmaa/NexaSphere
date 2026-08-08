import assert from 'node:assert/strict';
import net from 'node:net';
import test from 'node:test';

function parseRedisCommand(buffer) {
  const text = buffer.toString();
  let offset = 0;

  if (text[offset] !== '*') {
    return null;
  }

  const arrayEnd = text.indexOf('\r\n', offset);
  if (arrayEnd === -1) {
    return null;
  }

  const count = Number(text.slice(offset + 1, arrayEnd));
  offset = arrayEnd + 2;

  const command = [];
  for (let index = 0; index < count; index += 1) {
    if (text[offset] !== '$') {
      return null;
    }

    const lengthEnd = text.indexOf('\r\n', offset);
    if (lengthEnd === -1) {
      return null;
    }

    const length = Number(text.slice(offset + 1, lengthEnd));
    const valueStart = lengthEnd + 2;
    const valueEnd = valueStart + length;
    if (text.length < valueEnd + 2) {
      return null;
    }

    command.push(text.slice(valueStart, valueEnd));
    offset = valueEnd + 2;
  }

  return {
    command,
    rest: buffer.subarray(offset),
  };
}

async function startFakeRedis() {
  const values = new Map();
  const sockets = new Set();

  const server = net.createServer((socket) => {
    sockets.add(socket);
    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      let parsed = parseRedisCommand(buffer);
      while (parsed) {
        const [rawName, key, value] = parsed.command;
        const name = rawName.toLowerCase();

        if (name === 'get') {
          if (values.has(key)) {
            const cached = values.get(key);
            socket.write(`$${Buffer.byteLength(cached)}\r\n${cached}\r\n`);
          } else {
            socket.write('$-1\r\n');
          }
        } else if (name === 'set') {
          values.set(key, value);
          socket.write('+OK\r\n');
        } else if (name === 'info') {
          socket.write('$15\r\nredis_version:7\r\n');
        } else if (name === 'ping') {
          socket.write('+PONG\r\n');
        } else {
          socket.write('+OK\r\n');
        }

        buffer = parsed.rest;
        parsed = parseRedisCommand(buffer);
      }
    });

    socket.on('close', () => {
      sockets.delete(socket);
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  return {
    url: `redis://127.0.0.1:${server.address().port}`,
    async close() {
      for (const socket of sockets) {
        socket.destroy();
      }
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

test('getCachedQuery shares one in-flight loader for concurrent cache misses', async () => {
  const redis = await startFakeRedis();
  const previousRedisUrl = process.env.REDIS_URL;
  process.env.REDIS_URL = redis.url;

  let releaseLoader;
  let loaderCalls = 0;
  const loaderGate = new Promise((resolve) => {
    releaseLoader = resolve;
  });

  const { getCachedQuery, getRedisClient } = await import(
    `../utils/redis.js?singleflight=${Date.now()}`
  );

  try {
    const client = getRedisClient();
    await client.ping();

    const queryFn = async () => {
      loaderCalls += 1;
      await loaderGate;
      return { source: 'database' };
    };

    const first = getCachedQuery('events:list:concurrent', queryFn, 60);
    const second = getCachedQuery('events:list:concurrent', queryFn, 60);

    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(loaderCalls, 1);

    releaseLoader();

    const [firstResult, secondResult] = await Promise.all([first, second]);
    assert.deepEqual(firstResult, { source: 'database' });
    assert.deepEqual(secondResult, { source: 'database' });
  } finally {
    releaseLoader();
    getRedisClient()?.disconnect();
    if (previousRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previousRedisUrl;
    }
    await redis.close();
  }
});

test('getCachedQuery removes failed in-flight loaders so later misses can retry', async () => {
  const redis = await startFakeRedis();
  const previousRedisUrl = process.env.REDIS_URL;
  process.env.REDIS_URL = redis.url;

  let rejectLoader;
  let loaderCalls = 0;
  const loaderGate = new Promise((resolve, reject) => {
    rejectLoader = reject;
  });

  const { getCachedQuery, getRedisClient } = await import(
    `../utils/redis.js?singleflight=${Date.now()}`
  );

  try {
    const client = getRedisClient();
    await client.ping();

    const queryFn = async () => {
      loaderCalls += 1;
      await loaderGate;
      return { source: 'database' };
    };

    const first = getCachedQuery('events:list:retry-after-failure', queryFn, 60);
    const second = getCachedQuery('events:list:retry-after-failure', queryFn, 60);

    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(loaderCalls, 1);

    rejectLoader(new Error('database unavailable'));

    const failures = await Promise.allSettled([first, second]);
    assert.equal(failures[0].status, 'rejected');
    assert.equal(failures[1].status, 'rejected');

    const retryResult = await getCachedQuery(
      'events:list:retry-after-failure',
      async () => {
        loaderCalls += 1;
        return { source: 'retry' };
      },
      60
    );

    assert.deepEqual(retryResult, { source: 'retry' });
    assert.equal(loaderCalls, 2);
  } finally {
    rejectLoader(new Error('test cleanup'));
    getRedisClient()?.disconnect();
    if (previousRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previousRedisUrl;
    }
    await redis.close();
  }
});
