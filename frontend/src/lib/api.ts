const API = "http://localhost:8000/api"

export async function uploadFile(file: File) {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${API}/upload`, { method: "POST", body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function uploadText(text: string) {
  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getAnalysis(documentId: number | string) {
  const res = await fetch(`${API}/analysis/${documentId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function sendChat(documentId: number | string, question: string) {
  const res = await fetch(`${API}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
