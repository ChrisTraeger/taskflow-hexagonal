from rest_framework import serializers


class CreateTaskSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    description = serializers.CharField(default="")
    project_id = serializers.UUIDField()
    priority = serializers.ChoiceField(
        choices=["LOW", "MEDIUM", "HIGH", "URGENT"], default="MEDIUM"
    )
    assignee_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_title(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank.")
        return value.strip()


class TaskSerializer(serializers.Serializer):
    """Serializer de salida — convierte Task domain entity a JSON."""

    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    status = serializers.CharField(source="status.value")
    priority = serializers.IntegerField(source="priority.value")
    assignee_id = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()
