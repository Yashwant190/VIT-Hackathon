import os
import json
from typing import Dict, Any
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
VERBATIM_SUMMARY = os.getenv("VERBATIM_SUMMARY", "false").lower() == "true"


def _default_summary(title: str, content: str) -> Dict[str, Any]:
    words = len(content.split())
    return {
        "title": title or "Document Summary",
        "key_points": [
            "Key insights extracted from the document",
            "Content analyzed for main ideas",
            "Summary generated for quick review",
        ],
        "word_count": words,
        "reading_time": f"{max(1, words // 250)} min",
        "sentiment": "neutral",
        "categories": ["Document", "Analysis"],
        "full_summary": content[:1200] + ("..." if len(content) > 1200 else ""),
    }


def _extractive_summary(title: str, content: str) -> Dict[str, Any]:
    """Very simple extractive summary: pick first N informative sentences.
    This is used as a safe fallback to avoid hallucinations.
    """
    import re

    # Split into sentences (naive)
    sentences = re.split(r"(?<=[.!?])\s+", content.strip())
    # Keep non-empty sentences and cap
    sentences = [s.strip() for s in sentences if s.strip()]
    top = sentences[:5]
    words = len(content.split())
    return {
        "title": title or "Document Summary",
        "key_points": [s[:200] for s in top][:6] or [content[:200]],
        "word_count": words,
        "reading_time": f"{max(1, words // 250)} min",
        "sentiment": "neutral",
        "categories": ["Document", "Analysis"],
        "full_summary": " ".join(top)[:1500] + ("..." if len(" ".join(top)) > 1500 else ""),
    }


def summarize_text(content: str, title_hint: str = "") -> Dict[str, Any]:
    """
    Use OpenAI to summarize content and return a structured dict.
    """
    # Verbatim mode: return the original extracted text "as is" and no key points
    if VERBATIM_SUMMARY:
        words = len(content.split())
        return {
            "title": title_hint or "Document Content",
            "key_points": [],
            "word_count": words,
            "reading_time": f"{max(1, words // 250)} min",
            "sentiment": "unknown",
            "categories": ["Document"],
            "full_summary": content,
        }

    if not client.api_key:
        # Fallback if no API key
        return _default_summary(title_hint, content)

    system_prompt = (
        "You are an expert document summarizer. Your outputs must be strictly grounded in the provided content. "
        "NEVER invent facts, numbers, names, dates, or claims not explicitly present in the content. If unsure, use 'unknown'.\n\n"
        "Return ONLY a compact JSON object with keys: "
        "title (string), key_points (array of 3-6 strings), word_count (int), "
        "reading_time (string like '3 min'), sentiment (positive|neutral|negative|unknown), "
        "categories (array of strings), full_summary (string), citations (array of objects with fields 'point' and 'quote' where 'quote' is an exact substring from the content that supports the point)."
    )

    user_prompt = (
        f"Title hint: {title_hint}\n\n"
        "Summarize the following document content. Focus on clarity and key insights.\n\n"
        f"CONTENT:\n{content}"
    )

    try:
        # Truncate content if too long to avoid token limits
        max_content_length = 8000  # Conservative limit for GPT-3.5-turbo
        if len(content) > max_content_length:
            content = content[:max_content_length] + "..."
            user_prompt = (
                f"Title hint: {title_hint}\n\n"
                "Summarize the following document content. Focus on clarity and key insights.\n\n"
                f"CONTENT:\n{content}"
            )

        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
            max_tokens=1000,  # Limit response length
        )
        raw = resp.choices[0].message.content.strip()

        # Extract JSON from response
        json_text = raw
        if "{" in raw and "}" in raw:
            json_text = raw[raw.find("{") : raw.rfind("}") + 1]

        data = json.loads(json_text)

        # Validate fields and fill fallbacks
        title = str(data.get("title") or title_hint or "Document Summary")
        key_points_raw = data.get("key_points") or []
        if not isinstance(key_points_raw, list):
            key_points_raw = [str(key_points_raw)]
        key_points_raw = [str(x).strip() for x in key_points_raw][:6]

        # Citations for grounding (optional field from model)
        citations = data.get("citations") or []
        if not isinstance(citations, list):
            citations = []

        # Validate each key point has supporting quote within content
        validated_points = []
        content_lower = content.lower()
        for kp in key_points_raw:
            # Try to find supporting quote from citations
            quote = None
            for c in citations:
                try:
                    if isinstance(c, dict) and str(c.get("point", "")).strip() == kp:
                        q = str(c.get("quote", "")).strip()
                        if q and q.lower() in content_lower:
                            quote = q
                            break
                except Exception:
                    continue
            # If no citation provided, attempt soft validation by checking overlap
            if not quote:
                # Require at least 8-character overlap with content to keep the point
                tokens = [t for t in kp.split() if len(t) > 3]
                overlap = sum(1 for t in tokens if t.lower() in content_lower)
                if overlap >= max(2, len(tokens) // 3):
                    validated_points.append(kp)
                continue
            validated_points.append(kp)

        # Ensure we have at least 3 grounded points; otherwise fall back to extractive
        if len(validated_points) < 3:
            return _extractive_summary(title, content)

        word_count = int(data.get("word_count") or len(content.split()))
        reading_time = str(data.get("reading_time") or f"{max(1, word_count // 250)} min")
        sentiment = str(data.get("sentiment") or "neutral")
        categories = data.get("categories") or ["Document", "Analysis"]
        if not isinstance(categories, list):
            categories = [str(categories)]
        categories = [str(x) for x in categories][:6]
        full_summary = str(data.get("full_summary") or "")
        if not full_summary:
            full_summary = raw[:1500]

        return {
            "title": title,
            "key_points": validated_points[:6],
            "word_count": word_count,
            "reading_time": reading_time,
            "sentiment": sentiment if sentiment in {"positive", "neutral", "negative", "unknown"} else "neutral",
            "categories": categories,
            "full_summary": full_summary,
        }
    except Exception:
        # Safe fallback
        return _extractive_summary(title_hint, content)

