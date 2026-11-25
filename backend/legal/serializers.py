from rest_framework import serializers
from .models import Document, Analysis


class AnalysisSerializer(serializers.ModelSerializer):
    clauses = serializers.JSONField(source="clauses_json")
    compliance = serializers.JSONField(source="compliance_json")

    class Meta:
        model = Analysis
        fields = ["risk_score", "summary", "clauses", "compliance"]


class UploadResponseSerializer(serializers.Serializer):
    document_id = serializers.IntegerField()
    risk_score = serializers.IntegerField()
    summary = serializers.CharField()
    clauses = serializers.JSONField()
    compliance = serializers.JSONField()


class ChatResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
