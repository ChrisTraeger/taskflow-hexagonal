from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from application.use_cases.assign_task import AssignTaskCommand, AssignTaskUseCase
from application.use_cases.complete_task import CompleteTaskCommand, CompleteTaskUseCase
from application.use_cases.create_task import CreateTaskCommand, CreateTaskUseCase
from domain.exceptions import DomainException, TaskNotFoundError
from infrastructure.notifications.email_adapter import EmailNotificationAdapter
from infrastructure.repositories.django_task_repository import DjangoTaskRepository
from presentation.api.serializers import CreateTaskSerializer, TaskSerializer


class TaskViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    # ── Factory Methods (DIP: facilita mocks en tests) ─────────────────

    def _get_create_use_case(self) -> CreateTaskUseCase:
        return CreateTaskUseCase(
            task_repo=DjangoTaskRepository(),
            notification_port=EmailNotificationAdapter(),
        )

    def _get_assign_use_case(self) -> AssignTaskUseCase:
        return AssignTaskUseCase(
            task_repo=DjangoTaskRepository(),
            notification_port=EmailNotificationAdapter(),
        )

    def _get_complete_use_case(self) -> CompleteTaskUseCase:
        return CompleteTaskUseCase(task_repo=DjangoTaskRepository())

    # ── Endpoints ───────────────────────────────────────────────────────

    def create(self, request: Request) -> Response:
        """POST /api/tasks/ — Crea una nueva tarea."""
        serializer = CreateTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        command = CreateTaskCommand(**serializer.validated_data)
        task = self._get_create_use_case().execute(command)

        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)

    def list(self, request: Request) -> Response:
        """GET /api/projects/{project_id}/tasks/"""
        project_id = request.query_params.get("project_id")
        repo = DjangoTaskRepository()
        tasks = repo.find_by_project(project_id) if project_id else []
        return Response(TaskSerializer(tasks, many=True).data)

    def partial_update(self, request: Request, pk: str = None) -> Response:
        """PATCH /api/tasks/{id}/ — Asigna o completa una tarea."""
        action = request.data.get("action")
        try:
            if action == "assign":
                command = AssignTaskCommand(
                    task_id=pk, assignee_id=request.data["assignee_id"]
                )
                task = self._get_assign_use_case().execute(command)
            elif action == "complete":
                task = self._get_complete_use_case().execute(
                    CompleteTaskCommand(task_id=pk)
                )
            else:
                return Response(
                    {"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST
                )
        except TaskNotFoundError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except DomainException as e:
            return Response({"error": str(e)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        return Response(TaskSerializer(task).data)

    def destroy(self, request: Request, pk: str = None) -> Response:
        """DELETE /api/tasks/{id}/"""
        DjangoTaskRepository().delete(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)
