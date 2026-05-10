from abc import ABC, abstractmethod
from domain.entities.task import Task


class ITaskRepository(ABC):
    """Port de salida. Define el contrato que cualquier
    implementación de repositorio debe cumplir.

    Principio de Inversión de Dependencias (DIP).
    """

    @abstractmethod
    def save(self, task: Task) -> Task: ...

    @abstractmethod
    def find_by_id(self, task_id: str) -> Task | None: ...

    @abstractmethod
    def find_by_project(self, project_id: str) -> list[Task]: ...

    @abstractmethod
    def delete(self, task_id: str) -> None: ...
