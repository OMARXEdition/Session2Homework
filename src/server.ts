import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { CreateTaskInput, UpdateTaskInput } from './models.js';
import { TaskError, TaskService } from './task-service.js';

export function createServer(service = new TaskService()): Server {
  return createHttpServer(async (request, response) => {
    try {
      await handleRequest(request, response, service);
    } catch (error) {
      if (error instanceof TaskError) {
        sendJson(response, error.status, { error: error.message });
      } else if (error instanceof SyntaxError) {
        sendJson(response, 400, { error: 'Invalid JSON body' });
      } else {
        sendJson(response, 500, { error: 'Internal server error' });
      }
    }
  });
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  service: TaskService,
): Promise<void> {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname;

  if (path === '/tasks') {
    if (request.method === 'GET') {
      sendJson(response, 200, await service.list());
      return;
    }
    if (request.method === 'POST') {
      const task = await service.create(await readJson(request) as CreateTaskInput);
      sendJson(response, 201, task);
      return;
    }
  }

  const match = /^\/tasks\/([^/]+)$/.exec(path);
  if (match) {
    const id = decodeURIComponent(match[1]!);
    if (request.method === 'GET') {
      sendJson(response, 200, await service.get(id));
      return;
    }
    if (request.method === 'PATCH') {
      sendJson(response, 200, await service.update(id, await readJson(request) as UpdateTaskInput));
      return;
    }
    if (request.method === 'DELETE') {
      await service.delete(id);
      response.writeHead(204).end();
      return;
    }
  }

  sendJson(response, 404, { error: 'Route not found' });
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let body = '';
  for await (const chunk of request) body += chunk.toString();
  if (!body.trim()) throw new TaskError('A JSON body is required', 400);
  return JSON.parse(body) as unknown;
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}
