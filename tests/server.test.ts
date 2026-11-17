import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { createServer } from '../src/server.js';
import { TaskService } from '../src/task-service.js';

async function withServer(run: (baseUrl: string) => Promise<void>, service = new TaskService()): Promise<void> {
  const server = createServer(service);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('creates, lists, reads, updates, and deletes a task over HTTP', async () => {
  await withServer(async (baseUrl) => {
    const createdResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Ship API' }),
    });
    assert.equal(createdResponse.status, 201);
    const created = await createdResponse.json() as { id: string; title: string; completed: boolean };
    assert.equal(created.title, 'Ship API');
    assert.equal(created.completed, false);

    const listResponse = await fetch(`${baseUrl}/tasks`);
    assert.equal(listResponse.status, 200);
    assert.deepEqual(await listResponse.json(), [created]);

    const getResponse = await fetch(`${baseUrl}/tasks/${created.id}`);
    assert.equal(getResponse.status, 200);
    assert.deepEqual(await getResponse.json(), created);

    const updatedResponse = await fetch(`${baseUrl}/tasks/${created.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(updatedResponse.status, 200);
    assert.equal((await updatedResponse.json() as { completed: boolean }).completed, true);

    const deletedResponse = await fetch(`${baseUrl}/tasks/${created.id}`, { method: 'DELETE' });
    assert.equal(deletedResponse.status, 204);
    assert.equal((await fetch(`${baseUrl}/tasks/${created.id}`)).status, 404);
  });
});

test('returns 400 for invalid JSON and invalid task input', async () => {
  await withServer(async (baseUrl) => {
    const malformed = await fetch(`${baseUrl}/tasks`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
    });
    assert.equal(malformed.status, 400);
    assert.equal(typeof (await malformed.json() as { error: unknown }).error, 'string');

    const invalid = await fetch(`${baseUrl}/tasks`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: '' }),
    });
    assert.equal(invalid.status, 400);
  });
});

test('returns 404 for an unknown route', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/unknown`);
    assert.equal(response.status, 404);
  });
});

test('returns 500 when a task operation fails unexpectedly', async () => {
  class FailingService extends TaskService {
    override async list(): Promise<never> { throw new Error('Database unavailable'); }
  }
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/tasks`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Internal server error' });
  }, new FailingService());
});
