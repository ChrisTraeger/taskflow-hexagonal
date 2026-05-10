import pytest
from domain.entities.task import Task
from domain.value_objects.task_status import TaskStatus
from domain.exceptions import InvalidTaskOperationError


class TestTaskEntity:

    def _make_task(self, **kwargs) -> Task:
        defaults = dict(id="t-1", title="Test task", description="desc")
        return Task(**{**defaults, **kwargs})

    def test_start_changes_status_to_in_progress(self):
        task = self._make_task()
        task.start()
        assert task.status == TaskStatus.IN_PROGRESS

    def test_cannot_start_task_already_in_progress(self):
        task = self._make_task(status=TaskStatus.IN_PROGRESS)
        with pytest.raises(InvalidTaskOperationError):
            task.start()

    def test_complete_changes_status_to_done(self):
        task = self._make_task(status=TaskStatus.IN_PROGRESS)
        task.complete()
        assert task.status == TaskStatus.DONE

    def test_cannot_complete_todo_task(self):
        task = self._make_task()
        with pytest.raises(InvalidTaskOperationError):
            task.complete()

    def test_assign_to_sets_assignee(self):
        task = self._make_task()
        task.assign_to("user-99")
        assert task.assignee_id == "user-99"

    def test_cannot_reassign_completed_task(self):
        task = self._make_task(status=TaskStatus.DONE)
        with pytest.raises(InvalidTaskOperationError):
            task.assign_to("user-99")
