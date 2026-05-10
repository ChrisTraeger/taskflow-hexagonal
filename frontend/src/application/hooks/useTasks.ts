import { useState, useCallback } from "react";
import { taskService } from "../../infrastructure/services/taskService";
import { Task, CreateTaskDTO } from "../../domain/types";

// Hook personalizado — SRP: solo gestiona estado de tareas
export const useTasks = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getByProject(projectId);
      setTasks(data);
    } catch {
      setError("Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createTask = async (dto: CreateTaskDTO): Promise<Task> => {
    const task = await taskService.create(dto);
    setTasks((prev) => [...prev, task]);
    return task;
  };

  const completeTask = async (taskId: string): Promise<void> => {
    const updated = await taskService.complete(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const assignTask = async (taskId: string, assigneeId: string): Promise<void> => {
    const updated = await taskService.assign(taskId, assigneeId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  return { tasks, loading, error, fetchTasks, createTask, completeTask, assignTask };
};
