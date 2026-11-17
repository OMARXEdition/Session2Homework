# Task API

A small Node.js backend written in TypeScript with ESM imports and strict type checking. Tasks are stored in memory, so restarting the server clears them.

## Run

Requires Node.js 20 or later.

```sh
npm ci
npm run build
npm start
```

The API listens on port 3000 by default. Set `PORT` to use another port.

## Scripts

- `npm run build` compiles TypeScript to `dist/`.
- `npm run check` type checks without writing files.
- `npm test` builds and runs the service and HTTP tests.
- `npm start` starts the compiled server.

## Endpoints

| Method | Path | Result |
| --- | --- | --- |
| GET | `/tasks` | List tasks |
| POST | `/tasks` | Create a task (`201`) |
| GET | `/tasks/:id` | Get a task |
| PATCH | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task (`204`) |

Create a task with JSON such as `{ "title": "Write docs", "description": "API guide", "userId": "user-1" }`. Updates may contain `title`, `description`, `completed`, or `userId`. The `User` interface defines `id`, `name`, and `email`; `Task.userId` can refer to a user ID. This sample does not manage users or check whether a user ID exists.

Errors have a JSON `error` message. Invalid input returns `400`, missing tasks and routes return `404`, and unexpected failures return `500`.

## AI use

OpenAI Codex assisted with the initial project setup, TypeScript interfaces, task service, HTTP routes, tests, and this README. Codex ran the TypeScript check and automated tests to verify the implementation. The project maintainer is responsible for reviewing the code and deciding when to publish it.
