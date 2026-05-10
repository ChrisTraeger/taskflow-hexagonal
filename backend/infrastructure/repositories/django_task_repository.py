from application.ports.task_repository_port import ITaskRepository
from domain.entities.task import Task
from domain.value_objects.priority import Priority
from domain.value_objects.task_status import TaskStatus
from infrastructure.models.task_model import TaskModel


class DjangoTaskRepository(ITaskRepository):
    """Adapter de salida: implementa ITaskRepository usando Django ORM.

    La capa de dominio nunca conoce este archivo.
    Open/Closed Principle (OCP): podemos reemplazar por MongoRepository
    sin tocar el dominio ni los casos de uso.
    """

    def save(self, task: Task) -> Task:
        obj, _ = TaskModel.objects.update_or_create(
            id=task.id,
            defaults={
                "title": task.title,
                "description": task.description,
                "status": task.status.value,
                "priority": task.priority.value,
                "assignee_id": task.assignee_id,
            },
        )
        return self._to_domain(obj)

    def find_by_id(self, task_id: str) -> Task | None:
        try:
            return self._to_domain(TaskModel.objects.get(id=task_id))
        except TaskModel.DoesNotExist:
            return None

    def find_by_project(self, project_id: str) -> list[Task]:
        return [
            self._to_domain(obj)
            for obj in TaskModel.objects.filter(project_id=project_id)
        ]

    def delete(self, task_id: str) -> None:
        TaskModel.objects.filter(id=task_id).delete()

    def _to_domain(self, obj: TaskModel) -> Task:
        """Mapeo ORM -> Entidad de dominio (DRY: un único punto de conversión)."""
        return Task(
            id=str(obj.id),
            title=obj.title,
            description=obj.description,
            status=TaskStatus(obj.status),
            priority=Priority(obj.priority),
            assignee_id=str(obj.assignee_id) if obj.assignee_id else None,
        )
