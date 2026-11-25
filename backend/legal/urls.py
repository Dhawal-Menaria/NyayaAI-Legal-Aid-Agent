from django.urls import path
from . import views

urlpatterns = [
    path("upload", views.upload),
    path("analysis/<int:document_id>", views.analysis_detail),
    path("chat", views.chat),
]
