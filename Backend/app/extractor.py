import io
from typing import Optional

# External libs
from PyPDF2 import PdfReader  # type: ignore
from docx import Document as DocxDocument  # type: ignore


MAX_CHARS = 15000  # safety cap before summarization


def _extract_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        texts = []
        for page in reader.pages:
            try:
                txt = page.extract_text() or ""
            except Exception:
                txt = ""
            if txt:
                texts.append(txt)
        return "\n\n".join(texts)
    except Exception:
        return ""


def _extract_docx(file_bytes: bytes) -> str:
    try:
        doc = DocxDocument(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs if p.text)
    except Exception:
        return ""


def _extract_text_like(file_bytes: bytes) -> str:
    for enc in ("utf-8", "utf-16", "latin-1"):
        try:
            return file_bytes.decode(enc)
        except Exception:
            continue
    return ""


def extract_text(file_bytes: bytes, content_type: Optional[str], filename: Optional[str]) -> str:
    """
    Best-effort text extraction by content type and file extension.
    Returns a trimmed string suitable for summarization.
    """
    ct = (content_type or "").lower()
    ext = ((filename or "").rsplit(".", 1)[-1] if filename and "." in filename else "").lower()

    text = ""

    # Prefer content-type, then extension
    if "pdf" in ct or ext == "pdf":
        text = _extract_pdf(file_bytes)
    elif "word" in ct or ext in {"docx"}:
        text = _extract_docx(file_bytes)
    elif ext == "doc":
        # Legacy .doc not directly supported; try best-effort text decode
        text = _extract_text_like(file_bytes)
    elif any(t in ct for t in ["text/", "json"]) or ext in {"txt", "md", "csv", "json"}:
        text = _extract_text_like(file_bytes)

    # Fallback if none worked
    if not text:
        text = _extract_text_like(file_bytes)

    # Normalize whitespace and cap size
    text = "\n".join(line.strip() for line in text.splitlines())
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]

    return text.strip()

