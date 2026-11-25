import io

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, JSONParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from orchestrate import analyze, ask
from .models import Document, Analysis
from .serializers import AnalysisSerializer


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def upload(request):
    """POST /api/upload — accepts multipart `file` (PDF) or plain `text`."""
    text = ""
    filename = "text_input"

    if "file" in request.FILES:
        uploaded = request.FILES["file"]
        filename = uploaded.name
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(uploaded.read()))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            return Response({"error": f"PDF extraction failed: {exc}"}, status=status.HTTP_400_BAD_REQUEST)
    elif "text" in request.data:
        text = request.data["text"]
    else:
        return Response({"error": "Provide a `file` (PDF) or `text` field."}, status=status.HTTP_400_BAD_REQUEST)

    doc = Document.objects.create(filename=filename, extracted_text=text)

    result = analyze(text)

    analysis = Analysis.objects.create(
        document=doc,
        risk_score=result.get("risk_score", 0),
        summary=result.get("summary", ""),
        clauses_json=result.get("clauses", []),
        compliance_json=result.get("compliance", []),
    )

    return Response({
        "document_id": doc.id,
        "risk_score": analysis.risk_score,
        "summary": analysis.summary,
        "clauses": analysis.clauses_json,
        "compliance": analysis.compliance_json,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def analysis_detail(request, document_id):
    """GET /api/analysis/<document_id>"""
    doc = get_object_or_404(Document, pk=document_id)
    analysis = get_object_or_404(Analysis, document=doc)
    return Response({
        "document_id": doc.id,
        "risk_score": analysis.risk_score,
        "summary": analysis.summary,
        "clauses": analysis.clauses_json,
        "compliance": analysis.compliance_json,
    })


@api_view(["POST"])
def chat(request):
    """POST /api/chat — body {document_id, question}"""
    document_id = request.data.get("document_id")
    question = request.data.get("question")

    if not document_id or not question:
        return Response({"error": "`document_id` and `question` are required."}, status=status.HTTP_400_BAD_REQUEST)

    doc = get_object_or_404(Document, pk=document_id)
    answer = ask(question, doc.extracted_text)
    return Response({"answer": answer})
