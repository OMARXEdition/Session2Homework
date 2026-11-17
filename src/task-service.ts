import type { CreateTaskInput, Task, UpdateTaskInput } from './models.js';

export class TaskError extends Error {
  constructor(message: string, public readonly status: 400 | 404) {
    super(message);
    this.name = 'TaskError';
  }
}

export class TaskService {
  private readonly tasks = new Map<string, Task>();
  private nextId = 1;

  async list(): Promise<Task[]> {
    return Array.from(this.tasks.values(), (task) => ({ ...task }));
  }

  async get(id: string): Promise<Task> {
    return { ...this.requireTask(id) };
  }

  async create(input: CreateTaskInput): Promise<Task> {
    validateCreate(input);
    const task: Task = {
      id: String(this.nextId++),
      title: input.title.trim(),
      completed: false,
    };
    if (input.description !== undefined) task.description = input.description;
    if (input.userId !== undefined) task.userId = input.userId;
    this.tasks.set(task.id, task);
    return { ...task };
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const existing = this.requireTask(id);
    validateUpdate(input);
    const updated: Task = { ...existing, ...input };
    if (input.title !== undefined) updated.title = input.title.trim();
    this.tasks.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.requireTask(id);
    this.tasks.delete(id);
  }

  private requireTask(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new TaskError(`Task ${id} not found`, 404);
    return task;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateCreate(input: CreateTaskInput): void {
  if (!isRecord(input) || typeof input.title !== 'string' || !input.title.trim()) {
    throw new TaskError('A non-empty title is required', 400);
  }
  validateOptionalFields(input, ['title', 'description', 'userId']);
}

function validateUpdate(input: UpdateTaskInput): void {
  if (!isRecord(input) || Object.keys(input).length === 0) {
    throw new TaskError('At least one task field is required', 400);
  }
  if (input.title !== undefined && (typeof input.title !== 'string' || !input.title.trim())) {
    throw new TaskError('Title must be a non-empty string', 400);
  }
  if (input.completed !== undefined && typeof input.completed !== 'boolean') {
    throw new TaskError('Completed must be a boolean', 400);
  }
  validateOptionalFields(input, ['title', 'description', 'completed', 'userId']);
}

function validateOptionalFields(input: Record<string, unknown>, allowedFields: string[]): void {
  if (input.description !== undefined && typeof input.description !== 'string') {
    throw new TaskError('Description must be a string', 400);
  }
  if (input.userId !== undefined && (typeof input.userId !== 'string' || !input.userId.trim())) {
    throw new TaskError('User ID must be a non-empty string', 400);
  }
  for (const key of Object.keys(input)) {
    if (!allowedFields.includes(key)) {
      throw new TaskError(`Unknown task field: ${key}`, 400);
    }
  }
}
