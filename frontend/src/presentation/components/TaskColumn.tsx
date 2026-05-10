import React from "react";
import { Task, TaskStatus } from "../../domain/types";
import { TaskCard } from "./TaskCard";

interface TaskColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskUpdated: () => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  status,
  label,
  tasks,
  onTaskUpdated,
}) => (
  <div
    className={`task-column task-column--${status}`}
    style={{ minWidth: 220, flex: 1 }}
  >
    <h3>
      {label} <span className="badge">{tasks.length}</span>
    </h3>
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onUpdated={onTaskUpdated} />
      ))}
    </div>
  </div>
);
