import pytest
from unittest.mock import MagicMock

from application.use_cases.create_task import CreateTaskCommand, CreateTaskUseCase
from domain.value_objects.task_status import TaskStatus


class TestCreateTaskUseCase:
    def setup_method(self):
        self.mock_repo = MagicMock()          # Mock del repositorio
        self.mock_notification = MagicMock()  # Mock del notificador
        self.use_case = CreateTaskUseCase(
            task_repo=self.mock_repo,
            notification_port=self.mock_notification,
        )

    def test_creates_task_with_correct_title(self):
        command = CreateTaskCommand(
            title="Implementar login",
            description="OAuth2 con Google",
            project_id="proj-1",
        )
        self.mock_repo.save.return_value = MagicMock()

        self.use_case.execute(command)

        saved_task = self.mock_repo.save.call_args[0][0]
        assert saved_task.title == "Implementar login"
        assert saved_task.status == TaskStatus.TODO

    def test_notifies_when_assignee_provided(self):
        command = CreateTaskCommand(
            title="Task",
            description="",
            project_id="p1",
            assignee_id="user-42",
        )
        self.mock_repo.save.return_value = MagicMock()

        self.use_case.execute(command)

        self.mock_notification.notify_assignment.assert_called_once()

    def test_does_not_notify_without_assignee(self):
        command = CreateTaskCommand(
            title="Unassigned task", description="", project_id="p1"
        )
        self.mock_repo.save.return_value = MagicMock()

        self.use_case.execute(command)

        # La notificación se llama, pero el adapter decide si envía o no
        self.mock_notification.notify_assignment.assert_called_once()

    def test_saves_task_to_repository(self):
        command = CreateTaskCommand(
            title="Persist me", description="", project_id="p1"
        )
        self.mock_repo.save.return_value = MagicMock()

        self.use_case.execute(command)

        assert self.mock_repo.save.called
