import { Task, CreateTaskDTO } from "../../domain/types";

const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000/api";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const taskService = {
  async getByProject(projectId: string): Promise<Task[]> {
    const res = await fetch(
      `${API_URL}/tasks/?project_id=${projectId}`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
  },

  async create(dto: CreateTaskDTO): Promise<Task> {
    const res = await fetch(`${API_URL}/tasks/`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },

  async assign(taskId: string, assigneeId: string): Promise<Task> {
    const res = await fetch(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "assign", assignee_id: assigneeId }),
    });
    if (!res.ok) throw new Error("Failed to assign task");
    return res.json();
  },

  async complete(taskId: string): Promise<Task> {
    const res = await fetch(`${API_URL}/tasks/${taskId}/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ action: "complete" }),
    });
    if (!res.ok) throw new Error("Failed to complete task");
    return res.json();
  },

  async delete(taskId: string): Promise<void> {
    await fetch(`${API_URL}/tasks/${taskId}/`, {
      method: "DELETE",
      headers: authHeaders(),
    });
  },
};
