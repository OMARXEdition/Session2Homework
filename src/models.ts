export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  userId?: User['id'];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  userId?: User['id'];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
  userId?: User['id'];
}
