import React, { useEffect } from "react";
import { useTasks } from "../../application/hooks/useTasks";
import { TaskColumn } from "./TaskColumn";
import { TaskStatus } from "../../domain/types";

interface TaskBoardProps {
  projectId: string;
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "Por hacer" },
  { status: "in_progress", label: "En progreso" },
  { status: "in_review", label: "En revisión" },
  { status: "done", label: "Completada" },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({ projectId }) => {
  const { tasks, loading, error, fetchTasks } = useTasks(projectId);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (loading) return <div className="loading-spinner">Cargando tareas…</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="task-board" style={{ display: "flex", gap: "1rem" }}>
      {COLUMNS.map(({ status, label }) => (
        <TaskColumn
          key={status}
          status={status}
          label={label}
          tasks={tasks.filter((t) => t.status === status)}
          onTaskUpdated={fetchTasks}
        />
      ))}
    </div>
  );
};
