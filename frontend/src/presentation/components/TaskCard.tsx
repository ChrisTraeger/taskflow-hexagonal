import React from "react";
import { Task } from "../../domain/types";
import { taskService } from "../../infrastructure/services/taskService";

interface TaskCardProps {
  task: Task;
  onUpdated: () => void;
}

const PRIORITY_LABELS: Record<number, string> = {
  1: "Baja",
  2: "Media",
  3: "Alta",
  4: "Urgente",
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdated }) => {
  const handleComplete = async () => {
    await taskService.complete(task.id);
    onUpdated();
  };

  return (
    <div className={`task-card task-card--priority-${task.priority}`}>
      <p className="task-card__title">{task.title}</p>
      <p className="task-card__description">{task.description}</p>
      <span className="task-card__priority">
        {PRIORITY_LABELS[task.priority]}
      </span>
      {task.status === "in_progress" && (
        <button onClick={handleComplete}>Completar</button>
      )}
    </div>
  );
};
