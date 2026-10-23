# Contributing to Artha

Thanks for your interest! Artha is open-source under Apache-2.0.

## Good first issues

1. **Another bank's statement parser** — add a new doc_type to `ingest/gemma_reader.py`
2. **UPI SMS importer** — parse Airtel/Jio/BSNL SMS transaction alerts into ledger rows
3. **Account Aggregator sandbox connector** — plug the AA sandbox into the same ledger
4. **More languages** — add Hindi, Telugu, Kannada to the `/coach` endpoint
5. **Firefox extension** — port the Chrome extension to Firefox using WebExtensions API

## Ground rules

- Only edit files in your own folder. See `docs/contract.md` for the API contract.
- All demo data must be fictional. Never commit real financial documents.
- Never commit `.env` or API keys — the repo is public.
- Keep PRs small. One working feature beats one giant PR.
- Add a test for any new finder or calculator function.
- `database_schema.sql` has DROP TABLE — never add Artha tables there. New tables go in `artha_schema.sql` only.

## Setup

See [README.md](README.md) → Quick start.

## Code style

- Python: PEP 8, type hints where practical, docstrings on public functions.
- React: functional components, no class components.
- All money arithmetic lives in `engine/calculator.py`. Gemma never computes totals.
