from dataclasses import dataclass, field
from datetime import datetime
from domain.value_objects.task_status import TaskStatus
from domain.value_objects.priority import Priority
from domain.exceptions import InvalidTaskOperationError


@dataclass
class Task:
    """Entidad Task — representa una tarea del dominio.

    Responsabilidad única (SRP): solo gestiona el estado
    y las reglas de una tarea. Sin lógica de persistencia.
    """

    id: str
    title: str
    description: str
    status: TaskStatus = TaskStatus.TODO
    priority: Priority = Priority.MEDIUM
    assignee_id: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)

    def assign_to(self, user_id: str) -> None:
        """Asigna la tarea a un usuario. Regla: no reasignar tareas completadas."""
        if self.status == TaskStatus.DONE:
            raise InvalidTaskOperationError("Cannot reassign a completed task")
        self.assignee_id = user_id

    def complete(self) -> None:
        """Marca la tarea como completada. Solo si está en progreso."""
        if self.status != TaskStatus.IN_PROGRESS:
            raise InvalidTaskOperationError("Task must be in progress to complete")
        self.status = TaskStatus.DONE

    def start(self) -> None:
        """Inicia la tarea. Solo si está en estado TODO."""
        if self.status != TaskStatus.TODO:
            raise InvalidTaskOperationError("Only TODO tasks can be started")
        self.status = TaskStatus.IN_PROGRESS
