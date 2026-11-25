from django.db import models


class Document(models.Model):
    filename = models.CharField(max_length=255)
    extracted_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Analysis(models.Model):
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name="analysis")
    risk_score = models.IntegerField()
    summary = models.TextField()
    clauses_json = models.JSONField(default=list)
    compliance_json = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
