# linkedin/ml/search_keywords.py
"""LLM-based generation of LinkedIn People search keywords."""
from __future__ import annotations

import json
import logging

import jinja2
from pydantic import BaseModel, Field

from linkedin.conf import PROMPTS_DIR

logger = logging.getLogger(__name__)


class SearchKeywords(BaseModel):
    """Structured LLM output for search keyword generation."""
    keywords: list[str] = Field(description="List of LinkedIn People search queries")


def _extract_json_object(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in LLM response")
    return json.loads(text[start:end + 1])


def generate_search_keywords(
    product_docs: str,
    campaign_objective: str,
    n_keywords: int = 10,
    exclude_keywords: list[str] | None = None,
) -> list[str]:
    """Call LLM to generate LinkedIn search keywords from campaign context.

    Returns a list of search query strings.
    """
    from linkedin.conf import build_chat_llm

    env = jinja2.Environment(loader=jinja2.FileSystemLoader(str(PROMPTS_DIR)))
    template = env.get_template("search_keywords.j2")

    prompt = template.render(
        product_docs=product_docs,
        campaign_objective=campaign_objective,
        n_keywords=n_keywords,
        exclude_keywords=exclude_keywords or [],
    )

    llm = build_chat_llm(temperature=0.9)
    try:
        structured_llm = llm.with_structured_output(SearchKeywords)
        result = structured_llm.invoke(prompt)
    except Exception:
        logger.warning("Structured output unsupported for search keywords; falling back to prompt JSON parsing")
        raw = llm.invoke(
            prompt
            + '\n\nReturn only valid JSON in this format: {"keywords":["query 1","query 2"]}'
        )
        result = SearchKeywords.model_validate(_extract_json_object(raw.content))

    logger.info("Generated %d search keywords via LLM", len(result.keywords))
    return result.keywords
