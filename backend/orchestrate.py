import os, json, re, time, requests

INSTANCE_URL = os.getenv("WXO_INSTANCE_URL", "").rstrip("/")
API_KEY = os.getenv("WXO_API_KEY", "")
_AGENT_ID_RAW = os.getenv("WXO_AGENT_ID", "")
TOKEN_URL = os.getenv("WXO_TOKEN_URL", "https://iam.cloud.ibm.com/identity/token")

_token = {"value": None, "exp": 0}
_resolved_agent_id = {"value": None}  # cache the resolved UUID


def _get_token():
    if _token["value"] and time.time() < _token["exp"]:
        return _token["value"]
    if "iam.cloud.ibm.com" in TOKEN_URL:
        r = requests.post(
            TOKEN_URL,
            data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": API_KEY},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30,
        )
    else:
        r = requests.post(TOKEN_URL, json={"apikey": API_KEY}, timeout=30)
    r.raise_for_status()
    d = r.json()
    _token["value"] = d.get("access_token") or d.get("token")
    _token["exp"] = time.time() + 2700
    return _token["value"]


# UUID pattern — 8-4-4-4-12 hex groups
_UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


def _resolve_agent_id():
    """Return a valid UUID agent id.

    If WXO_AGENT_ID is already a UUID, use it directly.
    Otherwise call GET /v1/orchestrate/agents and find the agent whose
    name matches WXO_AGENT_ID, or fall back to the first agent in the list.
    Result is cached for the lifetime of the process.
    """
    if _resolved_agent_id["value"]:
        return _resolved_agent_id["value"]

    # Already a UUID → trust it
    if _UUID_RE.match(_AGENT_ID_RAW):
        _resolved_agent_id["value"] = _AGENT_ID_RAW
        return _AGENT_ID_RAW

    # Name-based ID or empty — resolve via the agents list
    try:
        token = _get_token()
        resp = requests.get(
            f"{INSTANCE_URL}/v1/orchestrate/agents",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        resp.raise_for_status()
        agents = resp.json()
        if not isinstance(agents, list) or not agents:
            return _AGENT_ID_RAW  # give up, return as-is

        # Prefer exact name match
        for agent in agents:
            if agent.get("name") == _AGENT_ID_RAW:
                _resolved_agent_id["value"] = agent["id"]
                return agent["id"]

        # No match — use the first agent (supervisor is typically first)
        _resolved_agent_id["value"] = agents[0]["id"]
        return agents[0]["id"]
    except Exception:
        # If resolution fails, fall back to raw value
        return _AGENT_ID_RAW


def _chat(prompt):
    if not (INSTANCE_URL and API_KEY and _AGENT_ID_RAW):
        return None  # triggers mock fallback
    agent_id = _resolve_agent_id()
    url = f"{INSTANCE_URL}/v1/orchestrate/{agent_id}/chat/completions"
    r = requests.post(
        url,
        headers={"Authorization": f"Bearer {_get_token()}", "Content-Type": "application/json"},
        json={"messages": [{"role": "user", "content": prompt}], "stream": False},
        timeout=180,
    )
    r.raise_for_status()
    data = r.json()
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return json.dumps(data)


MOCK = {
    "risk_score": 68,
    "summary": "Mock result: this rental agreement has a one-sided termination clause and a heavy late-payment penalty.",
    "clauses": [
        {"clause_text": "Landlord may terminate at any time without notice.", "risk_level": "High",
         "reason": "No notice period.", "suggestion": "Ask for at least 30 days written notice."},
        {"clause_text": "Late rent attracts 10% penalty per day.", "risk_level": "Medium",
         "reason": "Penalty is excessive.", "suggestion": "Negotiate a flat late fee."},
    ],
    "compliance": [
        {"rule": "Notice period for eviction", "status": "violation",
         "source_document": "Rent Control Act", "explanation": "Mock data."}
    ],
}


def analyze(text):
    prompt = (
        "Analyze this contract. Run the Contract Reviewer and Compliance Checker. "
        "Reply with ONLY one JSON object with keys: risk_score (0-100), summary, "
        "clauses (list of {clause_text, risk_level, reason, suggestion}), "
        "compliance (list of {rule, status, source_document, explanation}).\n\n"
        f"CONTRACT:\n{text[:12000]}"
    )
    out = _chat(prompt)
    if out is None:
        return MOCK
    m = re.search(r"\{.*\}", out, re.DOTALL)
    try:
        return json.loads(m.group(0))
    except Exception:
        return {"risk_score": 0, "summary": out, "clauses": [], "compliance": []}


def ask(question, context=""):
    prompt = f"Answer this question using the knowledge base and the contract.\n\nCONTRACT:\n{context[:12000]}\n\nQUESTION: {question}"
    out = _chat(prompt)
    return out if out is not None else "Mock answer: connect Orchestrate to get real answers. This is not legal advice."