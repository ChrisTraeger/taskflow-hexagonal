export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type Priority = 1 | 2 | 3 | 4;

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee_id: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
}

export interface CreateTaskDTO {
  title: string;
  description: string;
  project_id: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignee_id?: string;
}
