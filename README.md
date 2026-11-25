# NyayaAI — AI Legal Aid for Contract Review

> **General information only — not a substitute for a lawyer.**

NyayaAI is a multi-agent AI legal assistant that turns confusing contracts into plain-language risk reports. Upload a rental, freelance, or employment agreement and receive a risk score, flagged clauses with suggested fixes, a compliance checklist, and a chat assistant for follow-up questions.

Built for the **IBM University Engagement Project** using IBM Bob, IBM watsonx Orchestrate, and IBM Granite models.

---

## How it works

```
User uploads PDF / pastes text
        │
        ▼
  Django REST API  (/api/upload)
        │
        ▼
  Supervisor Agent  (IBM watsonx Orchestrate)
  ┌─────┴──────────────────────────────────┐
  │                                        │
  ▼                                        ▼
Contract Reviewer Agent        Compliance Checker Agent
Flags risky, one-sided         Compares contract against
or unclear clauses             Indian law (RAG knowledge base)
  │                                        │
  └─────────────┬──────────────────────────┘
                ▼
         Structured JSON result
         (risk_score, summary, clauses, compliance)
                │
                ▼
         Next.js dashboard
         Risk gauge · Clause cards · Compliance table · Q&A chat
```

**Q&A Agent** answers follow-up questions from the uploaded contract and the legal knowledge base.  
**Case Research Agent** summarises relevant judgments and precedents without inventing citations.

---

## Tech stack

| Layer | Technology |
|---|---|
| AI agents & coordination | IBM watsonx Orchestrate |
| Foundation model | IBM Granite (reasoning, summarisation, plain-language) |
| RAG knowledge base | Indian Contract Act, Rent Control Act, Consumer Protection Act 2019 |
| Backend | Python · Django 4.2 · Django REST Framework · SQLite |
| Frontend | Next.js 16 (App Router) · Tailwind CSS |
| Code generation | IBM Bob |

---

## Project structure

```
nyayaai/
├── backend/
│   ├── orchestrate.py        # watsonx Orchestrate client (analyze + ask)
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                  # credentials (not committed)
│   ├── config/               # Django project (settings, urls, wsgi)
│   └── legal/                # Django app (models, views, serializers, urls)
│       └── migrations/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          # navy header + disclaimer banner
│       │   ├── page.tsx            # / Upload page
│       │   ├── analysis/[id]/      # /analysis/:id  Risk gauge + clauses
│       │   └── chat/[id]/          # /chat/:id  Q&A chat
│       └── lib/api.ts              # fetch helpers
└── docs/
    ├── NyayaAI_IBM_Bob_Project_Submission.pptx
    ├── CP Act 2019.pdf
    └── The-rajasthan-rent-control-act.pdf
```

---

## Quickstart

### Prerequisites

- Python 3.10+
- Node.js 18+
- An IBM Cloud account with watsonx Orchestrate provisioned

### 1 — Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file (or fill in the existing one):

```env
WXO_INSTANCE_URL=https://api.<region>.watson-orchestrate.cloud.ibm.com/instances/<instance-id>
WXO_API_KEY=<your-ibm-cloud-api-key>
WXO_AGENT_ID=<agent-uuid-or-name>
# Optional — defaults shown
WXO_TOKEN_URL=https://iam.cloud.ibm.com/identity/token
DJANGO_SECRET_KEY=change-me-in-production
DJANGO_DEBUG=True
```

> **Tip:** `WXO_AGENT_ID` can be either the agent's UUID or its name. If a name is supplied the backend resolves it automatically via the Orchestrate agents list. Leave all three `WXO_*` variables empty to run entirely on **mock responses** for local development.

```bash
python manage.py migrate
python manage.py runserver        # → http://localhost:8000
```

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev                       # → http://localhost:3000
```

---

## API reference

### `POST /api/upload`

Accepts a PDF file or plain text. Saves the document, calls the Orchestrate agents, persists the analysis, and returns the result.

**Multipart — PDF:**
```
file=<pdf>
```

**Multipart or JSON — plain text:**
```json
{ "text": "Contract text…" }
```

**Response `201`:**
```json
{
  "document_id": 1,
  "risk_score": 72,
  "summary": "High-risk rental agreement…",
  "clauses": [
    { "clause_text": "…", "risk_level": "High", "reason": "…", "suggestion": "…" }
  ],
  "compliance": [
    { "rule": "Notice period", "status": "violation", "source_document": "Rent Control Act", "explanation": "…" }
  ]
}
```

### `GET /api/analysis/<document_id>`

Returns the saved analysis in the same shape as the upload response.

### `POST /api/chat`

```json
{ "document_id": 1, "question": "Can the landlord keep my deposit?" }
```

**Response `200`:**
```json
{ "answer": "Under the Rent Control Act…" }
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Drag-and-drop PDF upload or paste contract text |
| `/analysis/:id` | Risk score gauge, colour-coded clause cards, compliance table |
| `/chat/:id` | Contract Q&A chat with suggested question chips |

---

## Agents

| Agent | Role |
|---|---|
| **Supervisor** | Routes requests to the right specialist agent |
| **Contract Reviewer** | Flags risky, one-sided, or unclear clauses with reasons and fixes |
| **Compliance Checker** | Checks the contract against the RAG legal knowledge base |
| **Q&A RAG** | Answers questions from the contract and uploaded legal documents |
| **Case Research** | Summarises relevant judgments and precedents |

---

## Disclaimer

NyayaAI provides **general information only**. It is not legal advice and is not a substitute for a qualified lawyer. Always consult a legal professional for matters that affect your rights or obligations.
