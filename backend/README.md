# NyayaAI Backend

Django + Django REST Framework backend for legal document analysis.

## Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The server starts at **http://127.0.0.1:8000**.

## Environment variables

Copy `.env` and fill in your IBM watsonx Orchestrate credentials:

| Variable | Description |
|---|---|
| `WXO_INSTANCE_URL` | Orchestrate instance URL |
| `WXO_API_KEY` | IBM Cloud API key |
| `WXO_AGENT_ID` | Orchestrate agent ID |
| `WXO_TOKEN_URL` | IAM token URL (default: IBM Cloud IAM) |
| `DJANGO_SECRET_KEY` | Django secret key (optional in dev) |
| `DJANGO_DEBUG` | `True` / `False` (default: `True`) |

> If `WXO_INSTANCE_URL`, `WXO_API_KEY`, or `WXO_AGENT_ID` are not set the
> backend falls back to **mock responses** so you can develop without credentials.

## API

### `POST /api/upload`

Upload a PDF or plain text for analysis.

**Multipart (PDF):**
```
file=<pdf file>
```

**JSON (plain text):**
```json
{ "text": "Contract text here…" }
```

**Response `201`:**
```json
{
  "document_id": 1,
  "risk_score": 68,
  "summary": "…",
  "clauses": [ { "clause_text": "…", "risk_level": "High", "reason": "…", "suggestion": "…" } ],
  "compliance": [ { "rule": "…", "status": "violation", "source_document": "…", "explanation": "…" } ]
}
```

---

### `GET /api/analysis/<document_id>`

Retrieve the saved analysis for a document.

**Response `200`:** same shape as upload response.

---

### `POST /api/chat`

Ask a question about a document.

**Request:**
```json
{ "document_id": 1, "question": "What is the notice period?" }
```

**Response `200`:**
```json
{ "answer": "The contract specifies 30 days written notice." }
```
