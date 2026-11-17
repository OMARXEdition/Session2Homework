import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TaskService, TaskError } from '../src/task-service.js';

test('creates and lists tasks asynchronously', async () => {
  const service = new TaskService();
  const created = await service.create({ title: 'Write tests', userId: 'user-1' });

  assert.equal(created.id, '1');
  assert.equal(created.title, 'Write tests');
  assert.equal(created.completed, false);
  assert.equal(created.userId, 'user-1');
  assert.deepEqual(await service.list(), [created]);
});

test('updates and retrieves a task', async () => {
  const service = new TaskService();
  const created = await service.create({ title: 'Draft' });

  const updated = await service.update(created.id, { title: 'Final', completed: true });
  assert.equal(updated.title, 'Final');
  assert.equal(updated.completed, true);
  assert.deepEqual(await service.get(created.id), updated);
});

test('deletes a task', async () => {
  const service = new TaskService();
  const created = await service.create({ title: 'Temporary' });

  await service.delete(created.id);
  assert.deepEqual(await service.list(), []);
  await assert.rejects(service.get(created.id), (error: unknown) =>
    error instanceof TaskError && error.status === 404,
  );
});

test('rejects an empty title and invalid updates', async () => {
  const service = new TaskService();
  await assert.rejects(service.create({ title: '  ' }), (error: unknown) =>
    error instanceof TaskError && error.status === 400,
  );
  const created = await service.create({ title: 'Valid' });
  await assert.rejects(service.update(created.id, { completed: 'yes' as unknown as boolean }),
    (error: unknown) => error instanceof TaskError && error.status === 400);
});

test('rejects fields that cannot be set during creation', async () => {
  const service = new TaskService();
  await assert.rejects(
    service.create({ title: 'No override', completed: true } as unknown as Parameters<TaskService['create']>[0]),
    (error: unknown) => error instanceof TaskError && error.status === 400,
  );
});

test('returns not found for missing tasks', async () => {
  const service = new TaskService();
  await assert.rejects(service.update('missing', { completed: true }), (error: unknown) =>
    error instanceof TaskError && error.status === 404,
  );
  await assert.rejects(service.delete('missing'), (error: unknown) =>
    error instanceof TaskError && error.status === 404,
  );
});
