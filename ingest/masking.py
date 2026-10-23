"""
masking.py
Strip personally-identifiable text before it is sent to any cloud LLM.
Account numbers, card numbers, phone numbers, PAN, email addresses.
"""

import re

# Patterns to mask
_PATTERNS = [
    (re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"),              "PAN_REDACTED"),          # PAN card
    (re.compile(r"\b[4-9]\d{9}\b"),                           "PHONE_REDACTED"),        # 10-digit mobile
    (re.compile(r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b"),"CARD_REDACTED"),         # 16-digit card
    (re.compile(r"\b\d{9,18}\b"),                             "ACCT_REDACTED"),         # bank account numbers
    (re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"), "EMAIL_REDACTED"),
]


def mask_text(text: str) -> str:
    """Return a copy of text with sensitive values replaced by placeholder tokens."""
    for pattern, placeholder in _PATTERNS:
        text = pattern.sub(placeholder, text)
    return text
